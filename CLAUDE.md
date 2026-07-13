# CLAUDE.md

## Project Overview

UI SFX is an open-source semantic sound system for interfaces. One typed 78-cue vocabulary maps to eleven interchangeable feel packs and 858 pre-rendered assets. The core package also synthesizes cues at runtime without downloading audio files.

**Primary metric**: adoption in Yuki Capital products and third-party GitHub/npm usage.
**User profile**: product engineers and designers working across web, mobile, SaaS, education, media, and games.

Read `.impeccable.md` before UI work.

## Commands

```bash
npm run dev             # Nuxt showcase
npm run generate        # Render all WAV/MP3/Ogg assets from recipes
npm run test            # Package tests
npm run typecheck       # Package and showcase type checks
npm run build           # Package and showcase production builds
npm run check           # Full quality gate
```

Use Node 22.20 (`nvm use`) for Nuxt 4.4 compatibility.

## Architecture

- `packages/uisfx`: framework-agnostic TypeScript runtime, recipes, bindings, assets, and manifest.
- `apps/showcase`: Nuxt 4 interactive sound specimen.
- `scripts`: deterministic renderer and audio integrity report.

## Development Rules

- Keep cue names semantic. App-specific aliases belong in product integrations, not the core taxonomy.
- Any new cue must exist in all eleven packs and be documented in `docs/taxonomy.md`.
- Runtime synthesis and rendered assets must derive from the same recipe.
- Code is MIT. Procedurally generated assets are CC0. Never add generated assets whose provider terms prevent commercial redistribution.
- Keep the minified + compressed core under 20 kB and the Ogg library under 2 MB.
- Audio previews must respect mute, reduced motion, and browser autoplay rules.
- No em dashes in public copy.

## Quality Gates

- `npm run check` passes.
- 858 MP3 and 858 Ogg files exist.
- No asset clips above -1 dBFS or contains more than 80 ms leading silence.
- All interactive showcase controls have accessible names and visible focus.
- No hardcoded credentials.
