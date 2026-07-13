# uisfx

The zero-dependency runtime and complete portable audio library for [UI SFX](https://github.com/romainsimon/uisfx).

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
- 11 interchangeable sound packs
- 858 sounds in MP3 and Ogg
- 72 one-shots and 6 seamless loops
- Zero runtime dependencies
- MIT code and CC0 audio

HTML bindings are available through `bindUISFX()`. Portable assets live at `sounds/{pack}/{cue}.mp3` and `.ogg`; `uisfx/manifest` describes exact paths, sizes, durations, loop flags, and default volumes.

Sound should reinforce visible feedback, never replace it. Give users a persistent mute setting and do not use audio as the only distinction between outcomes.

See the [full documentation and taxonomy](https://github.com/romainsimon/uisfx#readme).
