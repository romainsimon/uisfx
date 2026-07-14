import type { PlayOptions } from 'uisfx'

export const VOLUME_PREVIEW_PLAY_OPTIONS = {
  retrigger: 'restart',
  cooldownMs: 45,
} as const satisfies PlayOptions

export function scalePreviewVolume(defaultVolume: number, level: number) {
  const safeDefault = Number.isFinite(defaultVolume) ? Math.max(0, Math.min(1, defaultVolume)) : 0
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0
  return safeDefault * safeLevel
}
