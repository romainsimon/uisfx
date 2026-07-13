import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { CATEGORIES, CUES, PACKS, type CueDefinition } from '../packages/uisfx/src/catalog.ts'
import { createRecipe } from '../packages/uisfx/src/recipes.ts'
import { renderRecipe, type RenderedSound } from '../packages/uisfx/src/synth.ts'

const root = resolve(import.meta.dirname, '..')
const packageRoot = resolve(root, 'packages/uisfx')
const soundsRoot = resolve(packageRoot, 'sounds')
const temporaryRoot = resolve(root, '.generated/wav')

function wavBuffer(sound: RenderedSound) {
  const channelCount = 2
  const bytesPerSample = 2
  const dataSize = sound.left.length * channelCount * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channelCount, 22)
  buffer.writeUInt32LE(sound.sampleRate, 24)
  buffer.writeUInt32LE(sound.sampleRate * channelCount * bytesPerSample, 28)
  buffer.writeUInt16LE(channelCount * bytesPerSample, 32)
  buffer.writeUInt16LE(bytesPerSample * 8, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  let offset = 44
  for (let frame = 0; frame < sound.left.length; frame += 1) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sound.left[frame] ?? 0)) * 32767), offset)
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sound.right[frame] ?? 0)) * 32767), offset + 2)
    offset += 4
  }
  return buffer
}

function rotateLoopForEncoding(sound: RenderedSound): RenderedSound {
  const frameCount = sound.left.length
  const threshold = 1e-7
  let firstActive = 0
  while (
    firstActive < frameCount
    && Math.max(Math.abs(sound.left[firstActive] ?? 0), Math.abs(sound.right[firstActive] ?? 0)) <= threshold
  ) firstActive += 1
  if (firstActive === frameCount) return sound

  let lastActive = frameCount - 1
  while (
    lastActive > firstActive
    && Math.max(Math.abs(sound.left[lastActive] ?? 0), Math.abs(sound.right[lastActive] ?? 0)) <= threshold
  ) lastActive -= 1

  const wrapSilenceFrames = firstActive + (frameCount - 1 - lastActive)
  const leadSilenceFrames = Math.min(
    Math.floor(wrapSilenceFrames / 2),
    Math.round(sound.sampleRate * 0.045),
  )
  if (leadSilenceFrames <= 0) return sound

  // Lossy codecs can ring backwards across a transient at sample zero. Rotate
  // the same cyclic recipe into its existing silent gap so MP3 and Ogg retain
  // a clean boundary without changing pitch, rhythm, duration, or the cycle.
  const startFrame = (firstActive - leadSilenceFrames + frameCount) % frameCount
  const left = new Float32Array(frameCount)
  const right = new Float32Array(frameCount)
  for (let frame = 0; frame < frameCount; frame += 1) {
    const sourceFrame = (startFrame + frame) % frameCount
    left[frame] = sound.left[sourceFrame] ?? 0
    right[frame] = sound.right[sourceFrame] ?? 0
  }
  return { ...sound, left, right }
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk) => { stderr += String(chunk) })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-1200)}`))
    })
  })
}

function isSpatialCue(cue: CueDefinition) {
  return (cue.panFrom ?? 0) !== 0 || (cue.panTo ?? 0) !== 0
}

async function mapConcurrent<T>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let cursor = 0
  async function next() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item) await worker(item)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()))
}

async function main() {
  await rm(soundsRoot, { recursive: true, force: true })
  await rm(temporaryRoot, { recursive: true, force: true })
  await mkdir(soundsRoot, { recursive: true })
  await mkdir(temporaryRoot, { recursive: true })

  const jobs = PACKS.flatMap((pack) => CUES.map((cue) => ({ pack, cue })))
  const renderedDurations = new Map<string, number>()
  let renderedCount = 0

  await mapConcurrent(jobs, 8, async ({ pack, cue }) => {
    const recipe = createRecipe(pack.name, cue.name)
    const sound = renderRecipe(recipe)
    renderedDurations.set(`${pack.name}:${cue.name}`, sound.duration)
    const wavPath = resolve(temporaryRoot, pack.name, `${cue.name}.wav`)
    const mp3Path = resolve(soundsRoot, pack.name, `${cue.name}.mp3`)
    const oggPath = resolve(soundsRoot, pack.name, `${cue.name}.ogg`)
    await mkdir(dirname(wavPath), { recursive: true })
    await mkdir(dirname(mp3Path), { recursive: true })
    await writeFile(wavPath, wavBuffer(recipe.loop ? rotateLoopForEncoding(sound) : sound))

    const isSpatial = isSpatialCue(cue)
    const channels = isSpatial ? '2' : '1'
    await Promise.all([
      run('ffmpeg', ['-y', '-v', 'error', '-i', wavPath, '-map_metadata', '-1', '-ac', channels, '-c:a', 'libmp3lame', '-b:a', isSpatial ? '96k' : '72k', '-ar', '44100', mp3Path]),
      run('ffmpeg', ['-y', '-v', 'error', '-i', wavPath, '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-ac', channels, '-c:a', 'libopus', '-b:a', isSpatial ? '64k' : '48k', '-vbr', 'on', '-application', 'audio', oggPath]),
    ])

    renderedCount += 1
    if (renderedCount % 32 === 0) process.stdout.write(`rendered ${renderedCount}/${jobs.length}\n`)
  })

  const assets = []
  for (const pack of PACKS) {
    for (const cue of CUES) {
      const recipe = createRecipe(pack.name, cue.name)
      const isSpatial = isSpatialCue(cue)
      const mp3Path = resolve(soundsRoot, pack.name, `${cue.name}.mp3`)
      const oggPath = resolve(soundsRoot, pack.name, `${cue.name}.ogg`)
      const [mp3, ogg] = await Promise.all([stat(mp3Path), stat(oggPath)])
      assets.push({
        pack: pack.name,
        cue: cue.name,
        category: cue.category,
        duration: Number((renderedDurations.get(`${pack.name}:${cue.name}`) ?? recipe.duration).toFixed(3)),
        channels: isSpatial ? 2 : 1,
        loop: recipe.loop,
        playback: recipe.loop ? 'loop' : 'one-shot',
        defaultVolume: cue.defaultVolume,
        files: {
          mp3: { path: `sounds/${pack.name}/${cue.name}.mp3`, bytes: mp3.size },
          ogg: { path: `sounds/${pack.name}/${cue.name}.ogg`, bytes: ogg.size },
        },
      })
    }
  }

  const packageJson = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8')) as { version: string }
  const manifest = {
    schemaVersion: 1,
    version: packageJson.version,
    license: { code: 'MIT', audio: 'CC0-1.0' },
    source: 'Deterministic UI SFX synthesis recipes',
    summary: {
      packs: PACKS.length,
      cues: CUES.length,
      assets: assets.length,
      mp3Bytes: assets.reduce((total, asset) => total + asset.files.mp3.bytes, 0),
      oggBytes: assets.reduce((total, asset) => total + asset.files.ogg.bytes, 0),
    },
    categories: CATEGORIES,
    packs: PACKS.map(({ name, label, description, bestFor, color }) => ({ name, label, description, bestFor, color })),
    cues: CUES.map((cue) => ({
      name: cue.name,
      label: cue.label,
      category: cue.category,
      description: cue.description,
      defaultVolume: cue.defaultVolume,
      loop: 'loop' in cue ? cue.loop : false,
      playback: 'loop' in cue && cue.loop ? 'loop' : 'one-shot',
    })),
    assets,
  }
  await writeFile(resolve(packageRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await rm(temporaryRoot, { recursive: true, force: true })
  process.stdout.write(`UI SFX library ready: ${assets.length} cues in MP3 and Ogg.\n`)
}

await main()
