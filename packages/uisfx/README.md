<p align="center">
  <a href="https://uisfx.com"><img src="https://raw.githubusercontent.com/romainsimon/uisfx/main/docs/assets/uisfx-banner.webp" alt="UI SFX, open-source interface sound effects" width="100%"></a>
</p>

# uisfx

The zero-dependency runtime and complete portable audio library for [UI SFX](https://uisfx.com), an open-source semantic sound system for interfaces.

```bash
npm install uisfx
```

```ts
import { createUISFX } from 'uisfx'

const ui = createUISFX({ pack: 'minimal' })
ui.play('success')

const loading = ui.play('loading')
loading?.stop()
```

- 78 semantic cues across 13 categories
- 12 interchangeable sound packs
- 936 sounds in MP3 and Ogg
- 72 one-shots and 6 seamless loops
- Zero runtime dependencies
- MIT code and CC0 audio

Switch a complete product from restrained to playful without changing its event mapping:

```ts
ui.setPack('zen')
ui.play('complete')
```

HTML bindings are available through `bindUISFX()`. Portable assets live at `sounds/{pack}/{cue}.mp3` and `.ogg`; `uisfx/manifest` describes exact paths, sizes, durations, loop flags, and default volumes.

Sound should reinforce visible feedback, never replace it. Give users a persistent mute setting and do not use audio as the only distinction between outcomes.

Listen before choosing a feel on the [interactive showcase](https://uisfx.com). See the [full documentation](https://github.com/romainsimon/uisfx#readme), [semantic catalog](https://uisfx.com/catalog.md), and [agent implementation guide](https://uisfx.com/agent-guide.md).

If UI SFX helps your product, you can [sponsor its maintenance](https://github.com/sponsors/romainsimon).
