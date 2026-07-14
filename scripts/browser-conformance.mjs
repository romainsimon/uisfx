import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const runtime = await readFile(resolve(root, 'packages/uisfx/dist/index.js'))
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

let chromeBinary
for (const candidate of chromeCandidates) {
  try {
    await access(candidate)
    chromeBinary = candidate
    break
  } catch { /* Try the next installed browser. */ }
}
if (!chromeBinary) throw new Error('Chrome or Chromium is required for browser conformance')

const fixture = `<!doctype html>
<meta charset="utf-8">
<button id="run" style="width:160px;height:80px">Run conformance</button>
<script type="module">
  import { createUISFX } from '/uisfx.js'
  document.querySelector('#run').addEventListener('click', async () => {
    try {
      const loopAudit = { started: 0, stopped: 0 }
      const nativeCreateBufferSource = AudioContext.prototype.createBufferSource
      AudioContext.prototype.createBufferSource = function (...args) {
        const source = nativeCreateBufferSource.apply(this, args)
        const nativeStart = source.start.bind(source)
        const nativeStop = source.stop.bind(source)
        source.start = (...startArgs) => {
          if (source.loop) loopAudit.started += 1
          return nativeStart(...startArgs)
        }
        source.stop = (...stopArgs) => {
          if (source.loop) loopAudit.stopped += 1
          return nativeStop(...stopArgs)
        }
        return source
      }
      const player = createUISFX({ pack: 'minimal', volume: 0.25, maxVoices: 4 })
      const unlocked = await player.unlock()
      const started = performance.now()
      player.play('success')
      const firstPlayMs = performance.now() - started
      const loop = player.play('loading')
      player.setPack('soft')
      loop?.stop()
      const loopMigrated = loopAudit.started === 2 && loopAudit.stopped === 2
      let yielded = false
      setTimeout(() => { yielded = true }, 0)
      await player.preload(['hover', 'press', 'select', 'success', 'error'])
      const preferences = createUISFX({ preferences: {}, enabled: false, volume: 0.3, pack: 'zen' })
      preferences.setEnabled(true)
      const restored = createUISFX({ preferences: {} })
      const persisted = restored.isEnabled() && restored.getVolume() === 0.3 && restored.getPack() === 'zen'
      await Promise.all([player.destroy(), preferences.destroy(), restored.destroy()])
      AudioContext.prototype.createBufferSource = nativeCreateBufferSource
      window.__uisfxResult = { unlocked, firstPlayMs, loopMigrated, preloadYielded: yielded, persisted }
    } catch (error) {
      window.__uisfxResult = { error: String(error?.stack || error) }
    }
  })
</script>`

const server = createServer((request, response) => {
  if (request.url === '/uisfx.js') {
    response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
    response.end(runtime)
    return
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  response.end(fixture)
})
await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Unable to start browser fixture')

const profile = await mkdtemp(join(tmpdir(), 'uisfx-browser-'))
const debugPort = 9337
const chrome = spawn(chromeBinary, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-sandbox',
  '--autoplay-policy=user-gesture-required',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${debugPort}`,
  'about:blank',
], { stdio: 'ignore' })

async function devtools(path = '/json') {
  let lastError
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}${path}`, path.startsWith('/json/new') ? { method: 'PUT' } : undefined)
      if (response.ok) return response.json()
    } catch (error) {
      lastError = error
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }
  throw lastError ?? new Error('Chrome DevTools did not start')
}

let socket
try {
  const target = await devtools('/json/new?about:blank')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let id = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    pending.get(message.id)(message)
    pending.delete(message.id)
  })
  const send = (method, params = {}) => new Promise((resolvePromise, reject) => {
    const commandId = ++id
    pending.set(commandId, resolvePromise)
    socket.send(JSON.stringify({ id: commandId, method, params }))
    setTimeout(() => {
      if (!pending.delete(commandId)) return
      reject(new Error(`${method} timed out`))
    }, 10_000)
  })

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}/` })
  let pageReady = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const ready = await send('Runtime.evaluate', {
      expression: 'Boolean(document.querySelector("#run"))',
      returnByValue: true,
    })
    if (ready.result?.result?.value) {
      pageReady = true
      break
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }
  if (!pageReady) throw new Error('Browser fixture did not load')
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 70, y: 40, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 70, y: 40, button: 'left', clickCount: 1 })

  let result
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const evaluation = await send('Runtime.evaluate', {
      expression: 'window.__uisfxResult',
      returnByValue: true,
    })
    result = evaluation.result?.result?.value
    if (result) break
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
  }
  if (!result) throw new Error('Browser conformance did not finish')
  if (result.error) throw new Error(result.error)
  if (!result.unlocked) throw new Error('AudioContext did not unlock from a trusted click')
  if (!result.loopMigrated) throw new Error('Active loop did not migrate and stop in the real AudioContext')
  if (!result.preloadYielded) throw new Error('Preload blocked the browser task queue')
  if (!result.persisted) throw new Error('Browser preferences were not restored')
  if (result.firstPlayMs > 75) throw new Error(`First play took ${result.firstPlayMs.toFixed(1)} ms`)
  console.table(result)
  console.log('Browser conformance passed.')
} finally {
  socket?.close()
  const exited = new Promise((resolvePromise) => chrome.once('exit', resolvePromise))
  chrome.kill('SIGTERM')
  server.close()
  await Promise.race([exited, new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000))])
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
      break
    } catch (error) {
      if (attempt === 4) throw error
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 200))
    }
  }
}
