# UI SFX agent guide

This repository contains the `uisfx` npm package and its Nuxt showcase. UI SFX is an open-source semantic interface sound system: product logic calls stable cue names, while interchangeable packs control the sonic personality.

## Repository map

- `packages/uisfx/`: zero-dependency TypeScript runtime, synthesis recipes, generated audio assets, manifest, and package README.
- `apps/showcase/`: the SSR website at `uisfx.com`.
- `scripts/`: deterministic library generation and audio-quality reports.
- `docs/`: taxonomy, specification, SEO notes, and public visual assets.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run `npm run check` before a release; it also regenerates the library, runs privacy checks, audio-quality checks, and reports.

## Implementation rules

- Preserve semantic cue names and the complete pack × cue matrix.
- Do not add remote runtime dependencies or network audio fetches.
- Treat one-shots and loops differently. Every loop must remain seamless and must stop cleanly.
- Keep browser playback client-side and behind user interaction.
- Sound reinforces visible and accessible feedback; it never replaces it.
- Preserve a persistent mute or sound preference in product integrations.
- Do not expose secrets, private paths, local usernames, credentials, or private project references.

## Generated files

Audio assets and `packages/uisfx/manifest.json` are generated from deterministic recipes. Prefer changing source recipes and running the generator instead of hand-editing generated output.

## Licenses

- TypeScript runtime and repository code: MIT.
- Generated audio library: CC0-1.0.
- Pack artwork: CC0-1.0.

Public machine-readable documentation is available from `https://uisfx.com/llms.txt`.
