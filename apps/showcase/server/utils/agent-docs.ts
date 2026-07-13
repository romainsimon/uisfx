import {
  CATEGORIES,
  CUES,
  PACKS,
  getPlaybackMode,
  packNames,
  type PackName,
} from '../../../../packages/uisfx/src/catalog'
import { buildAgentImplementationPrompt } from '../../app/lib/agent-prompt'

const SITE_URL = 'https://uisfx.com'

export function resolvePack(value: unknown): PackName {
  return typeof value === 'string' && packNames.includes(value as PackName)
    ? value as PackName
    : 'minimal'
}

function packTable() {
  return [
    '| Pack | Character | Good fit |',
    '| --- | --- | --- |',
    ...PACKS.map(pack => `| \`${pack.name}\` | ${pack.description} | ${pack.bestFor} |`),
  ].join('\n')
}

function cueSections() {
  return CATEGORIES.map((category) => {
    const cues = CUES.filter(cue => cue.category === category.id)
      .map(cue => `- \`${cue.name}\` (${getPlaybackMode(cue.name)}): ${cue.description}`)
      .join('\n')
    return `### ${category.label}\n\n${category.description}\n\n${cues}`
  }).join('\n\n')
}

export function buildLlmsTxt() {
  return `# UI SFX

> UI SFX is an open-source semantic interface sound system with ${CUES.length} cues, ${PACKS.length} interchangeable sound packs, ${CUES.filter(cue => getPlaybackMode(cue.name) === 'one-shot').length} one-shots, and ${CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length} seamless loops for web, mobile, SaaS, media, and games.

UI SFX separates interaction meaning from sonic personality: product code calls semantic cues such as \`success\`, \`open\`, or \`processing\`, while a pack controls how the whole interface feels. The TypeScript runtime is MIT licensed and the generated audio library is CC0.

## Start here

- [Agent integration guide](${SITE_URL}/docs/agent-guide.md): Framework-neutral implementation contract, lifecycle rules, accessibility requirements, cue catalog, and copy-ready coding-agent prompt.
- [Copy-ready implementation prompt](${SITE_URL}/agent-prompt.txt): Plain-text prompt that asks a coding agent to integrate UI SFX across every meaningful product interaction.
- [UI sound design documentation](${SITE_URL}/ui-sound-design.md): Clean Markdown counterpart to the interactive showcase.
- [Full LLM context](${SITE_URL}/llms-full.txt): Expanded product, API, pack, cue, accessibility, and licensing context.

## Package and source

- [npm package](https://www.npmjs.com/package/uisfx): Installable \`uisfx\` runtime and audio assets.
- [GitHub repository](https://github.com/romainsimon/uisfx): Source, contribution guide, issues, and licenses.
- [Package README](https://github.com/romainsimon/uisfx/blob/main/packages/uisfx/README.md): API examples for the runtime, bindings, loops, and packaged audio files.
- [Cue taxonomy](https://github.com/romainsimon/uisfx/blob/main/docs/taxonomy.md): Semantic intent and usage guidance for all cue families.

## Machine-readable data

- [Semantic cue catalog](${SITE_URL}/uisfx-catalog.json): Compact JSON for packs, categories, cue names, playback modes, and integration URLs.

## Optional

- [Complete asset manifest](${SITE_URL}/uisfx-manifest.json): Full ${PACKS.length * CUES.length}-asset package manifest with sizes, formats, durations, paths, packs, categories, and licenses. Asset paths are npm-package paths, not website media URLs.
`
}

export function buildAgentGuide(pack: PackName = 'minimal') {
  return `# UI SFX agent integration guide

> Use this guide when implementing UI SFX in an existing product. It is written for coding agents and humans and uses the \`${pack}\` sound pack in examples.

Last updated: 2026-07-13

## Goal

Add semantic sound wherever it materially improves confirmation, state awareness, spatial understanding, progress, or delight. Do not sonify every click. A good integration feels coherent, restrained, optional, and synchronized with the visible interface.

## Install and initialize

\`\`\`bash
npm install uisfx
\`\`\`

For browser applications, create one long-lived client-side player:

\`\`\`ts
import { createUISFX } from 'uisfx'

const ui = createUISFX({
  pack: '${pack}',
  volume: 0.7,
  enabled: savedSoundPreference,
})
\`\`\`

Do not instantiate or play audio during SSR. Unlock Web Audio from a genuine user gesture: call the first \`ui.play()\` synchronously inside a pointer or keyboard handler before any \`await\`, or create, retain, and resume an \`AudioContext\` in that handler and pass it to \`createUISFX\`. If the app creates that context, close it with \`await context.close()\` after \`await ui.destroy()\` during final app teardown. Never autoplay on page load. Until audio is unlocked, suppress background and asynchronous cues rather than queueing stale feedback. For native mobile, game engines, or environments without Web Audio, use the packaged MP3 or Ogg assets and preserve the same semantic rules.

## Implementation contract

1. Audit the product's shared controls, async workflows, state management, accessibility patterns, preference system, and tests before editing.
2. Use cue names for what happened, not what a control looks like. Prefer committed outcomes over speculative click sounds.
3. Usually play one cue per interaction. Do not stack \`press\`, \`select\`, and \`success\` on an ordinary action.
4. Use hover sparingly on important fine-pointer targets. Never use hover sound on touch or dense repeated lists.
5. Throttle rapid seek, volume, hover, progress, and notification events.
6. Keep visible, textual, motion, haptic, and ARIA feedback. Sound must never be the only signal.
7. Add or reuse a clearly labeled, persistent sound preference. Do not interpret reduced-motion as a mute preference.
8. Support pointer, touch, and keyboard activation without double playback.
9. Run the project's formatter, typecheck, tests, and production build. Report the final action-to-cue map.

## Async outcomes and loops

Play \`success\` only after an operation resolves and \`error\` only after it fails. Play \`delete\` after deletion is committed. Choose toggle and selection cues from the resulting state.

The six loop cues are \`loading\`, \`processing\`, \`recording\`, \`connecting\`, \`scanning\`, and \`streaming\`. Keep the returned handle, distinguish cancellation from failure, stop before playing an outcome, and guarantee cleanup with \`finally\`:

\`\`\`ts
let processing = ui.play('processing')
let completed = false
let caught = false
let cancelled = false
let failure: unknown

try {
  await runTask({ signal })
  completed = true
} catch (error) {
  caught = true
  failure = error
  cancelled = signal.aborted || isAbortError(error)
} finally {
  processing?.stop()
  processing = null
}

if (completed) ui.play('complete')
if (caught) {
  if (!cancelled) ui.play('error')
  // Keep the product's existing cancellation propagation policy.
  throw failure
}
\`\`\`

Make loop starts idempotent. Stop loops and clear retained handles on success, failure, cancellation, timeout, navigation, replacement, unmount, mute, disable, and \`finally\`. Use cancellation classification only to suppress an inappropriate error cue; preserve the product's existing cancellation propagation policy. Before \`ui.setEnabled(false)\`, stop retained loops and call \`ui.stopAll()\`. Use \`destroy()\` only when the app-level service is disposed. A caller-owned \`AudioContext\` is not closed by \`ui.destroy()\`; close it separately after destroying the player.

## API summary

- \`createUISFX({ pack, volume, enabled, context })\`
- \`player.play(cue, { volume, loop, playbackRate })\` returns \`{ stop, ended }\` or \`null\`
- \`player.preload(cues?)\`
- \`player.setPack(pack)\`, \`player.getPack()\`
- \`player.setVolume(value)\`, \`player.setEnabled(value)\`
- \`player.stopAll()\`, \`player.destroy()\`
- \`bindUISFX(root?, options?)\` for simple declarative DOM interactions
- \`CUES\`, \`PACKS\`, \`CATEGORIES\`, \`cueNames\`, \`packNames\`, \`getCue\`, \`getPack\`, and \`getPlaybackMode\`

## Sound packs

${packTable()}

## Semantic cue catalog

${cueSections()}

## Copy-ready coding-agent prompt

The same canonical prompt is available as plain text at [${SITE_URL}/agent-prompt.txt?pack=${pack}](${SITE_URL}/agent-prompt.txt?pack=${pack}).

\`\`\`text
${buildAgentImplementationPrompt(pack)}
\`\`\`

## Machine-readable references

- Compact semantic catalog: ${SITE_URL}/uisfx-catalog.json
- Complete asset manifest: ${SITE_URL}/uisfx-manifest.json
- LLM index: ${SITE_URL}/llms.txt
- Full LLM context: ${SITE_URL}/llms-full.txt

## Licenses

The TypeScript runtime is MIT licensed. The generated audio files are dedicated to the public domain under CC0 1.0. Attribution is appreciated but not required. Sound should reinforce visible feedback, never replace it.
`
}

export function buildLlmsFull() {
  return `# UI SFX full context

> Complete machine-readable context for UI SFX, an open-source semantic interface sound system for product teams and coding agents.

Last updated: 2026-07-13

## Product facts

- Package: \`uisfx\`
- Install: \`npm install uisfx\`
- Runtime: zero-dependency TypeScript and Web Audio
- Library: ${CUES.length} semantic cues × ${PACKS.length} packs = ${CUES.length * PACKS.length} sounds
- Playback: ${CUES.filter(cue => getPlaybackMode(cue.name) === 'one-shot').length} one-shots and ${CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length} seamless loops
- Code license: MIT
- Audio license: CC0-1.0
- Website: ${SITE_URL}/
- npm: https://www.npmjs.com/package/uisfx
- Source: https://github.com/romainsimon/uisfx

## Design model

UI SFX separates interaction semantics from sound style. Application logic calls stable cue names such as \`open\`, \`success\`, \`error\`, or \`recording\`. The selected pack changes the sonic personality without changing event logic. Sounds are generated locally from deterministic recipes; the Web Audio runtime fetches no remote audio files.

## Runtime API

- \`createUISFX(options)\` creates a player with a pack, volume, enabled state, or custom AudioContext.
- \`play(cue, options)\` plays a typed semantic cue and returns a stoppable handle.
- \`preload(cues?)\` renders and caches selected cues.
- \`setPack\`, \`setVolume\`, and \`setEnabled\` update the shared player.
- \`stopAll\` stops active audio; \`destroy\` releases the player.
- \`bindUISFX\` wires simple DOM data attributes; imperative playback is preferred for async outcomes and loops.

## Sound packs

${packTable()}

## Semantic cue catalog

${cueSections()}

## Agent implementation contract

${buildAgentImplementationPrompt('minimal')}

## Canonical resources

- Agent guide: ${SITE_URL}/docs/agent-guide.md
- Customizable prompt: ${SITE_URL}/agent-prompt.txt?pack=minimal
- Semantic catalog: ${SITE_URL}/uisfx-catalog.json
- Complete asset manifest: ${SITE_URL}/uisfx-manifest.json
- Package README: https://github.com/romainsimon/uisfx/blob/main/packages/uisfx/README.md
- Cue taxonomy: https://github.com/romainsimon/uisfx/blob/main/docs/taxonomy.md
`
}

export function buildUiSoundDesignMarkdown() {
  return `# UI sound design and interface sound effects

> UI SFX is an open-source library of ${CUES.length * PACKS.length} interface sound effects: ${CUES.length} semantic UI cues in ${PACKS.length} interchangeable sonic styles.

UI sound design is the practice of using brief, intentional audio cues to reinforce interaction, status, navigation, progress, and outcomes. Good interface sound effects clarify what happened without replacing visual, textual, haptic, or accessible feedback.

## What UI SFX provides

- ${CUES.length} semantic cues across ${CATEGORIES.length} interaction categories
- ${PACKS.length} complete sound packs for different product personalities
- ${CUES.filter(cue => getPlaybackMode(cue.name) === 'one-shot').length} brief one-shots and ${CUES.filter(cue => getPlaybackMode(cue.name) === 'loop').length} seamless loops
- MP3 and Ogg assets for native apps and games
- A zero-dependency Web Audio runtime for browser products
- MIT-licensed code and CC0 audio

## Install

\`\`\`bash
npm install uisfx
\`\`\`

\`\`\`ts
import { createUISFX } from 'uisfx'

const ui = createUISFX({ pack: 'minimal', volume: 0.7 })
ui.play('success')
\`\`\`

Use one shared client-side player. Start audio after user interaction, add a persistent sound preference, and stop loop cues with the visible state they represent.

## Sound packs

${packTable()}

## Documentation

- Interactive showcase: ${SITE_URL}/
- UI sound design guide: ${SITE_URL}/ui-sound-design
- Coding-agent guide: ${SITE_URL}/docs/agent-guide.md
- Semantic catalog: ${SITE_URL}/uisfx-catalog.json
- npm package: https://www.npmjs.com/package/uisfx
- Source: https://github.com/romainsimon/uisfx
`
}
