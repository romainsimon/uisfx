# Contributing

UI SFX welcomes fixes, integrations, new feel proposals, and carefully justified semantic cues.

## Development

```bash
npm install
npm run generate
npm run check
```

You need Node 22.20 or later and `ffmpeg` on your path. Versions 24.0 through 24.10 are excluded by Nuxt 4.4, so use the checked-in `.nvmrc` when in doubt.

## Sound changes

- Change recipes in `packages/uisfx/src/catalog.ts` or the renderer in `packages/uisfx/src/synth.ts`.
- Run `npm run generate` and inspect all affected packs, not only your preferred one.
- Keep peaks controlled, onset immediate, and tails short.
- Do not submit copyrighted samples or provider output without redistribution rights and provenance.
- Explain what interaction meaning becomes clearer after the change.

## Pull requests

Keep changes focused. Include the commands you ran, the affected cues and packs, and before/after audio when the sound itself changes.
