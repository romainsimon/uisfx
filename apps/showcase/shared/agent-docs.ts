export const UI_SFX_URL = 'https://uisfx.com'
export const UI_SFX_NPM_URL = 'https://www.npmjs.com/package/uisfx'
export const UI_SFX_REPOSITORY_URL = 'https://github.com/romainsimon/uisfx'

/**
 * A portable prompt for coding agents. It intentionally accepts no pack or
 * framework argument: the agent must first understand the product and then
 * make a reasoned sound-design choice.
 */
export function buildAgentImplementationPrompt(): string {
  return `Add UI SFX thoughtfully to this project.

Before making sound or implementation decisions, inspect the product and its codebase. Understand its purpose, audience, interaction patterns, visual and motion language, architecture, state flows, and existing accessibility, feedback, or preference settings.

Based on that analysis:
1. Decide which interactions and state changes would genuinely benefit from sound, and where silence is the better choice.
2. Review the available UI SFX feels and semantic cues at ${UI_SFX_URL}/catalog.md, then audition likely candidates on ${UI_SFX_URL}.
3. Choose the sound direction that best fits this specific product. No feel, cue set, or integration pattern is preselected. Decide whether one feel, a deliberate combination, or another supported approach makes the most sense, and explain why.
4. Choose semantic cues based on the meaning of each product event. Decide how to integrate them only after inspecting the project's architecture, then follow its existing conventions.
5. Preserve accessibility and user control. Sound should reinforce the interface, never replace visible or haptic feedback, and the experience must remain complete when muted.
6. Validate the important flows and refine the result until it feels intentional, restrained, and consistent with the product.

When finished, briefly report what you learned about the product, the sound and integration choices you made, why they fit, what you changed, and how you validated the result.

Documentation: ${UI_SFX_URL}/agent-guide.md
Catalog: ${UI_SFX_URL}/catalog.md
Machine-readable manifest: ${UI_SFX_URL}/manifest.json
Package: ${UI_SFX_NPM_URL}
Source: ${UI_SFX_REPOSITORY_URL}`
}
