<p align="center">
  <a href="https://uisfx.com">
    <img src="https://raw.githubusercontent.com/romainsimon/uisfx/main/docs/assets/uisfx-banner.webp" alt="UI SFX — open-source interface sound effects" width="100%">
  </a>
</p>

<p align="center">
  <a href="https://uisfx.com"><strong>Preview all 858 sounds</strong></a>
  ·
  <a href="https://github.com/romainsimon/uisfx">GitHub</a>
  ·
  <a href="https://uisfx.com/#sound-library">Browse cues</a>
</p>

# UI SFX — open-source interface sound effects

A zero-dependency semantic sound system for web apps, mobile apps, SaaS, education, media, and games. Call `success` once, then change the whole product's sonic personality without changing its logic.

## Install

```bash
npm install uisfx
```

## Try it in 30 seconds

```ts
import { createUISFX } from 'uisfx'

const ui = createUISFX({ pack: 'minimal', volume: 0.7 })

saveButton.addEventListener('click', async () => {
  const processing = ui.play('processing')

  try {
    await saveChanges()
    processing?.stop()
    ui.play('success')
  } catch {
    processing?.stop()
    ui.play('error')
  }
})
```

The `AudioContext` is created lazily. Sounds are synthesized and cached locally from deterministic recipes, so the runtime fetches no audio files.

## What ships

- 78 semantic cues across 13 interaction categories
- 11 interchangeable sound packs
- 858 portable sounds in both MP3 and Ogg
- 72 brief one-shots and 6 seamless state loops
- An 8.9 kB compressed Web Audio runtime
- Zero runtime dependencies
- MIT code and CC0 audio

## One API, eleven sonic personalities

Every pack implements every cue. Product logic stays stable while the sound design changes instantly.

```ts
ui.play('complete')

ui.setPack('arcade')
ui.play('complete') // Same meaning, entirely different feel.
```

| Pack | Character | Good fit |
| --- | --- | --- |
| `minimal` | Dry, precise, almost invisible | Productivity, SaaS, system UI |
| `soft` | Rounded, warm, reassuring | Mobile, wellness, friendly SaaS |
| `glass` | Bright, crystalline, premium | Media, finance, luxury products |
| `arcade` | Chunky pixels and cheerful voltage | Games, streaks, gamified learning |
| `mechanical` | Switches, relays, firm detents | Devtools, hardware, industrial UI |
| `organic` | Wood, water, breath, small stones | Education, kids, calm games |
| `dreamy` | Airy blooms and slow sparkle | Creative tools, wellness, ambient apps |
| `scifi` | Holographic scans and data chirps | AI tools, spatial UI, futuristic games |
| `rubber` | Elastic pops and friendly squish | Kids, playful mobile, casual games |
| `cinematic` | Deep impacts and polished tails | Premium media and dramatic moments |
| `studio` | Tactile precision with warm restraint | Film, audio, and AI creative tools |

[Hear every pack on the interactive website →](https://uisfx.com)

## Common UI patterns

### Discrete outcomes

Use one-shots for meaningful state changes, not decoration.

```ts
ui.play('toggle-on')
ui.play('add-to-cart')
ui.play('purchase')
ui.play('level-up')
```

### Long-running states

Loop cues continue until the visible interface state resolves. Always stop them on success, failure, or cancellation.

```ts
const recording = ui.play('recording')

// When recording ends:
recording?.stop()
ui.play('complete')
```

The six built-in loops are `loading`, `processing`, `recording`, `connecting`, `scanning`, and `streaming`.

### Packs, volume, and mute preferences

```ts
ui.setPack('studio')
ui.setVolume(0.5)
ui.setEnabled(userPreferences.soundEnabled)

ui.stopAll()
await ui.destroy()
```

## Add sound with HTML

Use declarative bindings when data attributes fit your app better than event handlers.

```ts
import { bindUISFX } from 'uisfx'

const { player, unbind } = bindUISFX(document, { pack: 'soft' })

// Later, when the view is destroyed:
unbind()
await player.destroy()
```

```html
<a data-uisfx-hover="hover">Documentation</a>
<button data-uisfx-press="press" data-uisfx-release="release">Hold me</button>
<button data-uisfx="success" data-uisfx-pack="soft">Save changes</button>
```

Touch pointers automatically skip hover sounds.

## Use the audio files anywhere

The package includes every sound as MP3 and Ogg for native apps, games, video, and environments without Web Audio.

```ts
import successUrl from 'uisfx/sounds/soft/success.mp3?url'

const success = new Audio(successUrl)
await success.play()
```

Asset paths follow `sounds/{pack}/{cue}.{mp3|ogg}`. The `uisfx/manifest` export describes each path, size, duration, loop flag, default volume, cue, category, and pack.

## API at a glance

| API | Purpose |
| --- | --- |
| `createUISFX(options)` | Create a player with a pack, volume, enabled state, or custom `AudioContext` |
| `player.play(cue, options)` | Play a typed semantic cue and receive `stop()` plus an `ended` promise |
| `player.preload(cues?)` | Render and cache selected cues before they are needed |
| `player.setPack(pack)` | Change the sonic personality without changing cue names |
| `player.setVolume(value)` | Set master volume between `0` and `1` |
| `player.setEnabled(value)` | Respect a persistent sound preference and stop active audio when disabled |
| `bindUISFX(root?, options?)` | Wire semantic cues to HTML data attributes |
| `cueNames`, `packNames` | Build typed selectors, settings, and sound browsers |

TypeScript exports `CueName`, `PackName`, `UISFXPlayer`, `PlayingSFX`, and the complete `CUES`, `PACKS`, and `CATEGORIES` catalogs.

## Accessibility

Sound should reinforce visible feedback, never replace it.

- Give people a persistent mute setting and respect device volume.
- Never make audio the only distinction between success, warning, and error.
- Keep hover feedback quiet or disable it in dense interfaces.
- Start audio only after an explicit interaction.
- Debounce frequent notifications and stop loops with their visible state.

## Documentation and license

- [Interactive sound library and examples](https://uisfx.com)
- [Full cue taxonomy](https://github.com/romainsimon/uisfx/blob/main/docs/taxonomy.md)
- [Source code and contribution guide](https://github.com/romainsimon/uisfx)
- [Issues and feature requests](https://github.com/romainsimon/uisfx/issues)
- [Sponsor ongoing maintenance](https://github.com/sponsors/romainsimon)

The TypeScript code is [MIT licensed](https://github.com/romainsimon/uisfx/blob/main/LICENSE). The generated audio library is dedicated to the public domain under [CC0 1.0](https://github.com/romainsimon/uisfx/blob/main/LICENSE-AUDIO).
