import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createApp, toWebHandler, type EventHandler } from 'h3'
import { CUES, PACKS, getPlaybackMode } from '../packages/uisfx/src/index.ts'
import { buildAgentImplementationPrompt } from '../apps/showcase/app/lib/agent-prompt.ts'
import agentPromptRoute from '../apps/showcase/server/routes/agent-prompt.txt.get.ts'
import agentGuideRoute from '../apps/showcase/server/routes/docs/agent-guide.md.get.ts'
import llmsFullRoute from '../apps/showcase/server/routes/llms-full.txt.get.ts'
import llmsRoute from '../apps/showcase/server/routes/llms.txt.get.ts'
import markdownRoute from '../apps/showcase/server/routes/ui-sound-design.md.get.ts'
import catalogRoute from '../apps/showcase/server/routes/uisfx-catalog.json.get.ts'
import manifestRoute from '../apps/showcase/server/routes/uisfx-manifest.json.get.ts'
import {
  buildAgentGuide,
  buildLlmsFull,
  buildLlmsTxt,
  buildUiSoundDesignMarkdown,
} from '../apps/showcase/server/utils/agent-docs.ts'
import { buildPublicManifest } from '../apps/showcase/server/utils/library-manifest.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const expectedAssets = PACKS.length * CUES.length
const expectedLoops = CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length
const expectedOneShots = CUES.length - expectedLoops
const llms = buildLlmsTxt()
const full = buildLlmsFull()
const guide = buildAgentGuide('studio')
const markdownPage = buildUiSoundDesignMarkdown()
const prompt = buildAgentImplementationPrompt('studio')
const manifest = buildPublicManifest()

assert.match(llms, /^# UI SFX\n\n> /)
assert.match(llms, new RegExp(`${CUES.length} cues`))
assert.match(llms, new RegExp(`${PACKS.length} interchangeable sound packs`))
assert.match(llms, new RegExp(`${expectedOneShots} one-shots`))
assert.match(llms, new RegExp(`${expectedLoops} seamless loops`))
assert.match(llms, /https:\/\/uisfx\.com\/docs\/agent-guide\.md/)
assert.match(llms, /https:\/\/uisfx\.com\/llms-full\.txt/)
assert.match(llms, /https:\/\/uisfx\.com\/ui-sound-design\.md/)
assert.match(llms, /https:\/\/uisfx\.com\/uisfx-catalog\.json/)
assert.match(llms, /https:\/\/uisfx\.com\/uisfx-manifest\.json/)

assert.equal(manifest.version, '0.3.0')
assert.equal(manifest.license.code, 'MIT')
assert.equal(manifest.license.audio, 'CC0-1.0')
assert.equal(manifest.summary.packs, PACKS.length)
assert.equal(manifest.summary.cues, CUES.length)
assert.equal(manifest.summary.assets, expectedAssets)
assert.equal(manifest.assets.length, expectedAssets)
assert.match(manifest.pathScope, /npm package/)

assert.match(guide, /pack: 'studio'/)
assert.match(guide, /uisfx\/sounds\/studio\/\{cue\}\.mp3/)
assert.match(guide, /ui\.setPack\('studio'\)/)
assert.match(guide, /agent-prompt\.txt\?pack=studio/)
assert.match(guide, /docs\/agent-guide\.md\?pack=studio/)
assert.match(prompt, /pack: 'studio'/)
assert.match(prompt, /uisfx\/sounds\/studio\/\{cue\}\.mp3/)
assert.match(prompt, /ui\.setPack\('studio'\)/)
assert.match(prompt, /docs\/agent-guide\.md\?pack=studio/)
assert.match(prompt, /synchronously inside a pointer or keyboard handler/)
assert.match(prompt, /suppress background and asynchronous cues/)
assert.match(prompt, /await context\.close\(\)/)
assert.match(guide, /existing cancellation propagation policy/)

for (const pack of PACKS) assert.ok(guide.includes(`\`${pack.name}\``), `Guide is missing pack ${pack.name}`)
for (const cue of CUES) assert.ok(guide.includes(`\`${cue.name}\``), `Guide is missing cue ${cue.name}`)

for (const content of [llms, full, guide, markdownPage, prompt]) {
  assert.doesNotMatch(content, /\/Users\/|\/dev\/|sk_[a-zA-Z0-9]+|api[_-]?key/i)
}

for (const path of [
  'apps/showcase/server/routes/llms.txt.get.ts',
  'apps/showcase/server/routes/llms-full.txt.get.ts',
  'apps/showcase/server/routes/docs/agent-guide.md.get.ts',
  'apps/showcase/server/routes/agent-prompt.txt.get.ts',
  'apps/showcase/server/routes/ui-sound-design.md.get.ts',
  'apps/showcase/server/routes/uisfx-catalog.json.get.ts',
  'apps/showcase/server/routes/uisfx-manifest.json.get.ts',
]) {
  assert.ok(existsSync(`${root}/${path}`), `Missing agent resource route: ${path}`)
}

interface RouteExpectation {
  handler: EventHandler
  path: string
  contentType: string
  noindex: boolean
  maxAge?: number
}

async function getRoute({ handler, path, contentType, noindex, maxAge = 3600 }: RouteExpectation) {
  const app = createApp()
  app.use(handler)
  const response = await toWebHandler(app)(new Request(`https://uisfx.test${path}`))
  assert.equal(response.status, 200, `${path} status`)
  assert.equal(response.headers.get('content-type'), `${contentType}; charset=utf-8`, `${path} content type`)
  assert.equal(response.headers.get('content-language'), 'en', `${path} content language`)
  assert.equal(response.headers.get('access-control-allow-origin'), '*', `${path} CORS`)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', `${path} nosniff`)
  assert.match(response.headers.get('cache-control') ?? '', new RegExp(`^public, max-age=${maxAge},`), `${path} cache policy`)
  if (noindex) assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow', `${path} robots policy`)
  else assert.equal(response.headers.get('x-robots-tag'), null, `${path} should remain indexable`)
  return response
}

const llmsResponse = await getRoute({ handler: llmsRoute, path: '/llms.txt', contentType: 'text/plain', noindex: true })
assert.equal(await llmsResponse.text(), llms)

const fullResponse = await getRoute({ handler: llmsFullRoute, path: '/llms-full.txt', contentType: 'text/plain', noindex: true })
assert.equal(await fullResponse.text(), full)

const markdownResponse = await getRoute({ handler: markdownRoute, path: '/ui-sound-design.md', contentType: 'text/markdown', noindex: true })
assert.equal(await markdownResponse.text(), markdownPage)

const promptResponse = await getRoute({ handler: agentPromptRoute, path: '/agent-prompt.txt?pack=studio', contentType: 'text/plain', noindex: true })
assert.equal(await promptResponse.text(), prompt)

const guideResponse = await getRoute({ handler: agentGuideRoute, path: '/docs/agent-guide.md?pack=studio', contentType: 'text/markdown', noindex: false })
assert.equal(await guideResponse.text(), guide)

const catalogResponse = await getRoute({ handler: catalogRoute, path: '/uisfx-catalog.json', contentType: 'application/json', noindex: true })
const catalog = await catalogResponse.json() as {
  product: { licenses: { code: string; audio: string } }
  packs: typeof PACKS
  cues: Array<{ name: string; description: string; playback: string }>
}
assert.equal(catalog.product.licenses.code, 'MIT')
assert.equal(catalog.product.licenses.audio, 'CC0-1.0')
assert.deepEqual(catalog.packs.map(pack => pack.name), PACKS.map(pack => pack.name))
assert.deepEqual(catalog.packs.map(pack => pack.description), PACKS.map(pack => pack.description))
assert.deepEqual(catalog.cues.map(cue => cue.name), CUES.map(cue => cue.name))
assert.deepEqual(catalog.cues.map(cue => cue.description), CUES.map(cue => cue.description))
assert.deepEqual(catalog.cues.map(cue => cue.playback), CUES.map(cue => getPlaybackMode(cue.name)))

const manifestResponse = await getRoute({ handler: manifestRoute, path: '/uisfx-manifest.json', contentType: 'application/json', noindex: true, maxAge: 86400 })
assert.deepEqual(await manifestResponse.json(), manifest)

console.log(`Agent docs OK: ${PACKS.length} packs, ${CUES.length} cues, ${expectedAssets} assets, 7 live routes.`)
