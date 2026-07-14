import type { PackName } from 'uisfx'

export function buildAgentImplementationPrompt(pack: PackName = 'minimal') {
  return `Implement UI SFX throughout this product using the \`uisfx\` npm package and the "${pack}" sound pack.

Do the implementation, not just an example. First inspect the framework, shared UI primitives, state management, async workflows, accessibility patterns, existing settings, and tests. Then add sound only where it gives meaningful feedback. Do not sonify every click.

1. Install and centralize the player

Run \`npm install uisfx\`. For a browser app, create one shared, client-only player with \`createUISFX({ pack: '${pack}', volume: 0.7, enabled: savedSoundPreference })\`. Do not instantiate or play audio during SSR. Avoid duplicate players during remounts or React Strict Mode. Unlock Web Audio from a genuine user gesture: either call the first \`ui.play()\` synchronously inside a pointer or keyboard handler, before any \`await\`, or create, retain, and resume an \`AudioContext\` in that handler and pass it to \`createUISFX\`. If the app creates that context, close it with \`await context.close()\` after \`await ui.destroy()\` during final app teardown. Never autoplay on page load. Until audio is unlocked, suppress background and asynchronous cues instead of queueing stale feedback. Handle \`ui.play()\` returning \`null\`.

For native mobile, React Native, game engines, or environments without Web Audio, use the packaged assets at \`uisfx/sounds/${pack}/{cue}.mp3\` or \`.ogg\` while preserving the same semantic and lifecycle rules.

2. Map real product events to semantic cues

Choose the cue that describes what happened, not what the control looks like. Play outcomes only when the state change succeeds or fails. Usually use one cue per interaction; do not stack press, select, and success for one ordinary action.

Prioritize meaningful state transitions: confirmed saves, validation outcomes, toggles, tabs, dialogs, completed destructive actions, undo/redo, drag and drop results, uploads, generation, recording, messages, media controls, purchases, milestones, and connection state. Avoid sound for scrolling, passive layout changes, disabled controls, dense-list repetition, background refreshes, and routine hover. When keyboard sonification is enabled, play the brief \`typing\` cue once for every local text-entry \`input\` event at low volume; do not replace it with a long typing loop. Use hover only on sparse important controls with a fine pointer, never touch. Throttle rapid seek, volume, hover, progress, and notification events, but do not throttle \`typing\`.

Use only valid cue names from https://uisfx.com/uisfx-catalog.json. The catalog groups cues into input, selection, navigation, editing, movement, communication, feedback, progress, loops, media, system, reward, and commerce.

3. Manage loops correctly

The loop cues are loading, processing, recording, connecting, scanning, and streaming. Keep the \`PlayingSFX\` handle for each active visible process. Make loop starts idempotent. Stop every loop on success, failure, cancellation, timeout, route change, component cleanup, mute or disable, and all \`finally\` paths. Clear each retained handle after stopping it. After stopping, play the real outcome when appropriate. Never leave an invisible loop running.

Use \`ui.stopAll()\` for global transitions such as logout. Call \`await ui.destroy()\` only when the app-level service is disposed. A caller-owned \`AudioContext\` is not closed by \`ui.destroy()\`; close it separately after destroying the player. If using \`bindUISFX\`, call both \`unbind()\` and \`player.destroy()\` on final teardown. Do not combine declarative binding and manual playback on the same element.

4. Add an accessible sound preference

Add or reuse a clearly labeled sound toggle. Persist enabled state and volume in the product's preference system, falling back to local storage only if necessary. Before \`ui.setEnabled(false)\`, stop active loops, clear their retained handles, and call \`ui.stopAll()\` so mute is immediate. Apply changes with \`ui.setEnabled()\`, \`ui.setVolume()\`, and \`ui.setPack('${pack}')\`. Keep visual, textual, motion, haptic, and ARIA feedback intact: sound reinforces meaning and is never the only signal. Do not treat \`prefers-reduced-motion\` as an audio preference.

5. Preserve interaction quality

Support mouse, touch, and keyboard activation without duplicate playback. For async actions, play success only after resolution and error only after failure. Play delete only after deletion is committed. Choose toggle and selection cues from the resulting state. Use \`bindUISFX\` data attributes only for simple one-shot DOM interactions; use the imperative player for async outcomes, application state, loops, and lifecycle-sensitive behavior.

6. Test and report

Add or update tests for semantic cue mapping, real success/error timing, loop cleanup on every exit, mute persistence, keyboard/pointer deduplication, SSR safety, and remount cleanup. Run the formatter, typecheck, tests, and production build. Finish with a concise action-to-cue map, files changed, selected pack, sound-preference behavior, loop cleanup, and verification performed.

Canonical documentation:
- https://uisfx.com/docs/agent-guide.md?pack=${pack}
- https://uisfx.com/llms.txt
- https://uisfx.com/uisfx-catalog.json
- https://www.npmjs.com/package/uisfx
- https://github.com/romainsimon/uisfx`
}
