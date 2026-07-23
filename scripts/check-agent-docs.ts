import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORIES, CUES, PACKS, getPlaybackMode } from '../packages/uisfx/src/catalog'
import { buildAgentImplementationPrompt } from '../apps/showcase/shared/agent-docs'
import {
  buildAgentGuideMarkdown,
  buildCatalog,
  buildCatalogMarkdown,
  buildLlmsFull,
  buildLlmsTxt,
  buildPublicManifest,
  resolvePackName,
} from '../apps/showcase/server/utils/agent-docs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const routeFiles = [
  'apps/showcase/server/routes/agent-prompt.txt.get.ts',
  'apps/showcase/server/routes/llms.txt.get.ts',
  'apps/showcase/server/routes/llms-full.txt.get.ts',
  'apps/showcase/server/routes/agent-guide.md.get.ts',
  'apps/showcase/server/routes/catalog.md.get.ts',
  'apps/showcase/server/routes/manifest.json.get.ts',
  'apps/showcase/server/routes/api/catalog.get.ts',
  'apps/showcase/server/routes/api/manifest.get.ts',
]

for (const file of routeFiles) {
  assert.ok(existsSync(resolve(root, file)), `Missing public agent-doc route: ${file}`)
}

const prompt = buildAgentImplementationPrompt()
assert.equal(buildAgentImplementationPrompt.length, 0, 'The copyable prompt must not require a selected pack')
assert.match(prompt, /inspect the product and its codebase/i)
assert.match(prompt, /where silence is the better choice/i)
assert.match(prompt, /No feel, cue set, or integration pattern is preselected/i)
assert.match(prompt, /whether one feel, a deliberate combination, or another supported approach/i)
assert.match(prompt, /only after inspecting the project's architecture/i)
assert.match(prompt, /follow its existing conventions/i)
assert.match(prompt, /Preserve accessibility and user control/i)
assert.match(prompt, /experience must remain complete when muted/i)
assert.match(prompt, /briefly report what you learned about the product/i)

for (const pack of PACKS) {
  assert.equal(resolvePackName(pack.name), pack.name)
  assert.ok(!prompt.includes(`pack: '${pack.name}'`), `Prompt hardcodes the ${pack.name} feel`)
  assert.ok(!prompt.includes(`?pack=${pack.name}`), `Prompt preselects the ${pack.name} feel`)
  assert.doesNotMatch(prompt, new RegExp(`\\b${pack.name}\\b`, 'i'), `Prompt names the ${pack.name} feel instead of asking the agent to choose`)
}

for (const implementationDetail of ['```', 'ui.play(', 'createUISFX', 'React', 'Vue', 'Nuxt', 'Next.js']) {
  assert.ok(!prompt.includes(implementationDetail), `Prompt contains a preselected implementation detail: ${implementationDetail}`)
}

const promptRoute = readFileSync(resolve(root, 'apps/showcase/server/routes/agent-prompt.txt.get.ts'), 'utf8')
assert.match(promptRoute, /sendText\(event, buildAgentImplementationPrompt\(\)\)/, 'Prompt endpoint must return the shared copy verbatim')

const showcasePage = readFileSync(resolve(root, 'apps/showcase/app/pages/index.vue'), 'utf8')
assert.match(showcasePage, /buildAgentImplementationPrompt\(\)/, 'Showcase must copy the shared agent prompt')
assert.match(showcasePage, /Analyze this project, then choose its sound\./, 'Showcase prompt card must remain project-analysis-first')
assert.equal(resolvePackName('not-a-ui-sfx-feel'), undefined)

const packageMetadata = JSON.parse(readFileSync(resolve(root, 'packages/uisfx/package.json'), 'utf8')) as { version: string }
const packageManifest = JSON.parse(readFileSync(resolve(root, 'packages/uisfx/manifest.json'), 'utf8')) as { version: string }
assert.equal(packageManifest.version, packageMetadata.version, 'Published manifest version must match the package version')

const loopCount = CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length
const totalAssets = PACKS.length * CUES.length
const catalog = buildCatalog()
const manifest = buildPublicManifest()

assert.equal(catalog.summary.packs, PACKS.length)
assert.equal(catalog.summary.cues, CUES.length)
assert.equal(catalog.summary.assets, totalAssets)
assert.equal(catalog.summary.categories, CATEGORIES.length)
assert.equal(catalog.summary.loops, loopCount)
assert.equal(catalog.summary.oneShots, CUES.length - loopCount)
assert.equal(catalog.packs.length, PACKS.length)
assert.equal(catalog.cues.length, CUES.length)
assert.equal(manifest.summary.packs, PACKS.length)
assert.equal(manifest.summary.cues, CUES.length)
assert.equal(manifest.summary.assets, totalAssets)
assert.equal(manifest.assets.length, totalAssets)

const referencePack = PACKS.at(-1)?.name
assert.ok(referencePack, 'Expected at least one UI SFX feel')
const filteredCatalog = buildCatalog({ pack: referencePack })
const filteredManifest = buildPublicManifest({ pack: referencePack })
const filteredGuide = buildAgentGuideMarkdown({ pack: referencePack })
assert.equal(filteredCatalog.summary.packs, 1)
assert.equal(filteredCatalog.summary.assets, CUES.length)
assert.deepEqual(filteredCatalog.packs.map(pack => pack.name), [referencePack])
assert.equal(filteredManifest.summary.packs, 1)
assert.equal(filteredManifest.summary.assets, CUES.length)
assert.ok(filteredManifest.assets.every(asset => asset.pack === referencePack))
assert.match(filteredGuide, /This is not a recommendation/i)
assert.ok(filteredGuide.includes(prompt), 'Filtered docs must preserve the feel-agnostic implementation prompt')

const publicDocs = [
  prompt,
  buildLlmsTxt(),
  buildLlmsFull(),
  buildAgentGuideMarkdown(),
  buildCatalogMarkdown(),
  JSON.stringify(catalog),
  JSON.stringify(manifest),
].join('\n')

const forbiddenFragments = [
  ['/', 'Users', '/'].join(''),
  ['/', 'dev', '/'].join(''),
  ['sk', '_'].join(''),
  ['Eleven', 'Labs'].join(''),
  ['eleven', 'labs'].join(''),
]

for (const forbidden of forbiddenFragments) {
  assert.ok(!publicDocs.includes(forbidden), `Public agent docs contain forbidden text: ${forbidden}`)
}

console.log(`Agent docs: ${PACKS.length} feels, ${CUES.length} cues, ${totalAssets} assets, ${routeFiles.length} routes`)
