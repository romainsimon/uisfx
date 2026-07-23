import { createError, getQuery, setResponseHeader, type H3Event } from 'h3'
import {
  CATEGORIES,
  CUES,
  PACKS,
  getPlaybackMode,
  type PackName,
} from '../../../../packages/uisfx/src/catalog'
import manifestData from '../../../../packages/uisfx/manifest.json'
import {
  UI_SFX_NPM_URL,
  UI_SFX_REPOSITORY_URL,
  UI_SFX_URL,
  buildAgentImplementationPrompt,
} from '../../shared/agent-docs'

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'
const TEXT_CONTENT_TYPE = 'text/plain; charset=utf-8'
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8'
const packNameSet = new Set<string>(PACKS.map(pack => pack.name))

export interface AgentCatalogOptions {
  pack?: PackName
}

export interface PublicCatalog {
  schemaVersion: number
  summary: {
    packs: number
    cues: number
    assets: number
    categories: number
    oneShots: number
    loops: number
  }
  filter: { pack: PackName | null }
  packs: Array<{
    name: PackName
    label: string
    description: string
    bestFor: string
    color: string
  }>
  categories: Array<{
    id: string
    label: string
    description: string
    cues: number
  }>
  cues: Array<{
    name: string
    label: string
    category: string
    description: string
    playback: 'one-shot' | 'loop'
    defaultVolume: number
  }>
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function libraryCounts() {
  const loops = CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length
  return {
    packs: PACKS.length,
    cues: CUES.length,
    assets: PACKS.length * CUES.length,
    categories: CATEGORIES.length,
    oneShots: CUES.length - loops,
    loops,
  }
}

function selectedPacks(pack?: PackName) {
  return pack ? PACKS.filter(candidate => candidate.name === pack) : PACKS
}

function referenceFilterNote(pack?: PackName): string {
  if (!pack) return ''
  const definition = PACKS.find(candidate => candidate.name === pack)
  if (!definition) return ''

  return `\n> Reference filter: this response is narrowed to **${definition.label}** (\`${definition.name}\`) for inspection. This is not a recommendation. An implementation agent should still analyze the target product and choose the best coherent feel itself.\n`
}

function packsMarkdown(pack?: PackName): string {
  const rows = selectedPacks(pack).map(definition => (
    `| \`${definition.name}\` | ${markdownCell(definition.label)} | ${markdownCell(definition.description)} | ${markdownCell(definition.bestFor)} |`
  ))

  return [
    '| ID | Feel | Character | Often suits |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n')
}

function cuesMarkdown(): string {
  return CATEGORIES.map(category => {
    const cues = CUES.filter(cue => cue.category === category.id)
    const rows = cues.map(cue => (
      `| \`${cue.name}\` | ${markdownCell(cue.label)} | ${getPlaybackMode(cue.name)} | ${cue.defaultVolume} | ${markdownCell(cue.description)} |`
    ))

    return [
      `### ${category.label}`,
      '',
      category.description,
      '',
      '| Cue | Label | Playback | Default volume | Meaning |',
      '| --- | --- | --- | ---: | --- |',
      ...rows,
    ].join('\n')
  }).join('\n\n')
}

export function resolvePackName(value: unknown): PackName | undefined {
  if (value == null || value === '') return undefined
  const candidate = Array.isArray(value) ? value[0] : value
  if (typeof candidate !== 'string' || !packNameSet.has(candidate)) return undefined
  return candidate as PackName
}

export function getRequestedPack(event: H3Event): PackName | undefined {
  const rawPack = getQuery(event).pack
  if (rawPack == null || rawPack === '') return undefined

  const pack = resolvePackName(rawPack)
  if (!pack) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown pack. Expected one of: ${PACKS.map(item => item.name).join(', ')}`,
    })
  }
  return pack
}

export function sendMarkdown(event: H3Event, content: string): string {
  setResponseHeader(event, 'content-type', MARKDOWN_CONTENT_TYPE)
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600')
  return content
}

export function sendText(event: H3Event, content: string): string {
  setResponseHeader(event, 'content-type', TEXT_CONTENT_TYPE)
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600')
  return content
}

export function sendJson<T>(event: H3Event, content: T): T {
  setResponseHeader(event, 'content-type', JSON_CONTENT_TYPE)
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600')
  return content
}

export function buildCatalog(options: AgentCatalogOptions = {}): PublicCatalog {
  const counts = libraryCounts()
  const packs = selectedPacks(options.pack)

  return {
    schemaVersion: 1,
    summary: {
      ...counts,
      packs: packs.length,
      assets: packs.length * CUES.length,
    },
    filter: { pack: options.pack ?? null },
    packs: packs.map(pack => ({
      name: pack.name,
      label: pack.label,
      description: pack.description,
      bestFor: pack.bestFor,
      color: pack.color,
    })),
    categories: CATEGORIES.map(category => ({
      id: category.id,
      label: category.label,
      description: category.description,
      cues: CUES.filter(cue => cue.category === category.id).length,
    })),
    cues: CUES.map(cue => ({
      name: cue.name,
      label: cue.label,
      category: cue.category,
      description: cue.description,
      playback: getPlaybackMode(cue.name),
      defaultVolume: cue.defaultVolume,
    })),
  }
}

export function buildPublicManifest(options: AgentCatalogOptions = {}) {
  const packs = selectedPacks(options.pack)
  const names = new Set<string>(packs.map(pack => pack.name))
  const assets = manifestData.assets.filter(asset => names.has(asset.pack))
  const mp3Bytes = assets.reduce((sum, asset) => sum + asset.files.mp3.bytes, 0)
  const oggBytes = assets.reduce((sum, asset) => sum + asset.files.ogg.bytes, 0)

  return {
    ...manifestData,
    summary: {
      ...manifestData.summary,
      packs: packs.length,
      cues: CUES.length,
      assets: assets.length,
      mp3Bytes,
      oggBytes,
    },
    packs: manifestData.packs.filter(pack => names.has(pack.name)),
    assets,
  }
}

export function buildCatalogMarkdown(options: AgentCatalogOptions = {}): string {
  const counts = libraryCounts()
  const visiblePacks = selectedPacks(options.pack)

  return `# UI SFX catalog

> Semantic interface sound effects organized by product meaning, with interchangeable sonic feels.
${referenceFilterNote(options.pack)}
## Library summary

- ${PACKS.length} complete feels
- ${CUES.length} semantic cues in ${CATEGORIES.length} categories
- ${counts.assets} rendered sounds
- ${counts.oneShots} one-shot cues and ${counts.loops} seamless loop cues per feel
- MP3 and Ogg assets, plus the zero-dependency Web Audio runtime

${options.pack ? `This view contains ${visiblePacks.length} reference feel. Remove the \`?pack=\` query to compare all ${PACKS.length}.` : 'Every feel implements the complete semantic cue contract.'}

## Feels

Choose after inspecting the target product and auditioning likely candidates. The descriptions are starting points, not automatic routing rules.

${packsMarkdown(options.pack)}

## Semantic cues

Map product events by meaning. A cue should reinforce an interaction or state that is already understandable without sound.

${cuesMarkdown()}

## Machine-readable versions

- [Catalog JSON](${UI_SFX_URL}/api/catalog)
- [Complete asset manifest](${UI_SFX_URL}/manifest.json)
- Add \`?pack={id}\` to either endpoint for a reference-only filter.
`
}

export function buildAgentGuideMarkdown(options: AgentCatalogOptions = {}): string {
  const counts = libraryCounts()

  return `# UI SFX agent implementation guide

> A product-analysis-first guide for adding sound without turning every interface action into noise.
${referenceFilterNote(options.pack)}
UI SFX provides ${CUES.length} semantic cues across ${PACKS.length} coherent feels, for ${counts.assets} rendered sounds. The runtime is MIT licensed and the audio assets are CC0.

## Decision order

1. Understand the product, its audience, pace, visual and motion language, platform, and existing accessibility controls.
2. Identify only meaningful outcomes, consequential transitions, attention-worthy changes, and ongoing states that benefit from sound.
3. Compare and audition the available feels. Choose one coherent feel by default.
4. Map product events to semantic cues by meaning.
5. Integrate through existing application patterns, then test sound-on, muted, low-volume, and assistive flows.

## Restraint and accessibility

- Sound reinforces visible or haptic feedback. It never replaces it.
- Do not add sound to every click, hover, keypress, or decorative animation.
- Keep a persistent mute setting and a conservative volume control.
- Respect existing user, system, reduced-motion, and reduced-sensory preferences.
- Start audio only after a permitted user interaction. Never autoplay on page load.
- Debounce rapid events and prevent uncontrolled overlap.
- Use loop cues only while the matching state is visibly active, then stop them on success, failure, cancellation, unmount, and route change.
- Verify that the product remains fully usable with sound disabled.

## Runtime pattern

Choose the feel outside the sound layer, after product analysis, and pass it into a stable semantic mapping.

\`\`\`ts
import { createUISFX, type PackName } from 'uisfx'

export function createProductSounds(selectedFeel: PackName) {
  const ui = createUISFX({ pack: selectedFeel, volume: 0.5 })

  return {
    completed: () => ui.play('success'),
    failed: () => ui.play('error'),
    processing: () => ui.play('processing'),
    setMuted: (muted: boolean) => ui.setEnabled(!muted),
    setVolume: (volume: number) => ui.setVolume(volume),
    dispose: () => ui.stopAll(),
  }
}
\`\`\`

Portable MP3 and Ogg files are available at \`sounds/{feel}/{cue}.{format}\` for platforms without Web Audio. The [manifest](${UI_SFX_URL}/manifest.json) includes paths, duration, loop behavior, category, and default volume.

## Copyable implementation prompt

\`\`\`text
${buildAgentImplementationPrompt()}
\`\`\`

## References

- [Interactive preview](${UI_SFX_URL})
- [Copyable implementation prompt](${UI_SFX_URL}/agent-prompt.txt)
- [Semantic catalog](${UI_SFX_URL}/catalog.md)
- [Machine-readable catalog](${UI_SFX_URL}/api/catalog)
- [Machine-readable manifest](${UI_SFX_URL}/manifest.json)
- [npm package](${UI_SFX_NPM_URL})
- [Source repository](${UI_SFX_REPOSITORY_URL})
`
}

export function buildLlmsTxt(): string {
  const counts = libraryCounts()

  return `# UI SFX

> Open-source semantic interface sound effects for web, mobile, SaaS, games, and native products.

UI SFX contains ${counts.assets} rendered sounds: ${PACKS.length} coherent feels implementing the same ${CUES.length} semantic cues. It includes ${counts.oneShots} one-shot cues and ${counts.loops} seamless state loops per feel. The TypeScript runtime is MIT licensed and the portable MP3/Ogg audio is CC0.

Use sound to reinforce meaningful outcomes and ongoing states, never as the only signal. Inspect the target product first, choose a feel intentionally, provide mute and volume controls, and avoid sonifying every interaction.

## Primary documentation

- [Agent implementation guide](${UI_SFX_URL}/agent-guide.md): analysis-first integration workflow, accessibility rules, runtime pattern, and copyable implementation prompt.
- [Copyable implementation prompt](${UI_SFX_URL}/agent-prompt.txt): a concise, feel-agnostic brief that asks the agent to inspect the target product before choosing.
- [Semantic catalog](${UI_SFX_URL}/catalog.md): every feel, category, cue, playback mode, and default volume.
- [Full LLM reference](${UI_SFX_URL}/llms-full.txt): combined implementation guide and catalog.

## Machine-readable resources

- [Catalog JSON](${UI_SFX_URL}/api/catalog)
- [Asset manifest JSON](${UI_SFX_URL}/manifest.json)
- [Manifest API](${UI_SFX_URL}/api/manifest)

## Project

- [Interactive preview](${UI_SFX_URL})
- [npm package](${UI_SFX_NPM_URL})
- [Source repository](${UI_SFX_REPOSITORY_URL})
`
}

export function buildLlmsFull(options: AgentCatalogOptions = {}): string {
  return `${buildAgentGuideMarkdown(options)}\n\n${buildCatalogMarkdown(options)}`
}
