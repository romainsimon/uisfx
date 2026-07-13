import type { CueName, PackName } from 'uisfx'

export interface ActiveLoop {
  cue: CueName
  pack: PackName
}

export interface PackSwitchInput {
  nextPack: PackName
  previewCue: CueName
  activeLoop: ActiveLoop | null
  preserveActiveLoop?: boolean
}

export type PackSwitchPlan = {
  kind: 'restart-loop' | 'keep-loop' | 'preview'
  cue: CueName
  pack: PackName
}

export function planPackSwitch(input: PackSwitchInput): PackSwitchPlan {
  if (!input.activeLoop || input.preserveActiveLoop === false) {
    return {
      kind: 'preview',
      cue: input.previewCue,
      pack: input.nextPack,
    }
  }

  if (input.activeLoop.pack === input.nextPack) {
    return {
      kind: 'keep-loop',
      cue: input.activeLoop.cue,
      pack: input.nextPack,
    }
  }

  return {
    kind: 'restart-loop',
    cue: input.activeLoop.cue,
    pack: input.nextPack,
  }
}
