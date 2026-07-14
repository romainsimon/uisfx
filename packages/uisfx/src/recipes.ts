import { getCue, getPack, type CueName, type PackName, type PatternNote } from './catalog'

export interface RenderNote extends PatternNote {
  frequency: number
  endFrequency: number
}

export interface SoundRecipe {
  cue: CueName
  pack: PackName
  duration: number
  notes: RenderNote[]
  waveform: 'sine' | 'triangle' | 'square' | 'saw'
  harmonics: readonly [number, number][]
  attack: number
  decay: number
  noise: number
  transient: number
  brightness: number
  echo: number
  bitDepth: number
  panFrom: number
  panTo: number
  loop: boolean
  defaultVolume: number
  fmRatio: number
  fmDepth: number
  elasticity: number
  paper: number
  brush: number
  wood: number
  chime: number
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12)
}

const STUDIO_DETENT_CUES = new Set<CueName>([
  'press', 'release', 'double-click', 'long-press',
  'select', 'deselect', 'toggle-on', 'toggle-off', 'check', 'uncheck',
  'open', 'close', 'copy', 'paste', 'delete', 'cancel',
  'drag-start', 'drop', 'snap', 'reorder',
  'play', 'pause', 'seek', 'skip-next', 'skip-previous',
  'lock', 'unlock', 'add-to-cart', 'remove-from-cart', 'checkout', 'purchase',
])

const STUDIO_MILESTONE_CUES = new Set<CueName>([
  'success', 'complete', 'checkpoint', 'reward', 'level-up', 'achievement', 'bonus',
])

const MECHANICAL_DETENT_CUES = new Set<CueName>([
  ...STUDIO_DETENT_CUES,
  'blocked', 'progress-step', 'stop', 'invalid-drop',
])

const ORGANIC_BODY_CUES = new Set<CueName>([
  'press', 'release', 'long-press', 'delete', 'paste',
  'drag-start', 'drop', 'reorder', 'invalid-drop',
  'send', 'receive', 'notification', 'success', 'error', 'warning', 'blocked',
  'start', 'stop', 'complete', 'connect', 'disconnect', 'lock',
  'reward', 'level-up', 'achievement', 'bonus', 'purchase', 'refund',
])

const SHIMMER_CUES = new Set<CueName>([
  'open', 'expand', 'copy',
  'send', 'receive', 'notification', 'mention', 'reaction',
  'success', 'info', 'complete', 'checkpoint', 'connect', 'unlock', 'wake',
  'reward', 'level-up', 'achievement', 'streak', 'badge', 'bonus',
  'checkout', 'purchase', 'coupon',
])

const CINEMATIC_WEIGHT_CUES = new Set<CueName>([
  'long-press', 'delete', 'cancel', 'drop', 'invalid-drop',
  'send', 'receive', 'success', 'error', 'warning', 'blocked',
  'start', 'stop', 'complete', 'connect', 'disconnect', 'lock', 'sleep',
  'reward', 'level-up', 'achievement', 'badge', 'bonus', 'purchase', 'refund',
])

const RUBBER_EXPRESSIVE_CUES = new Set<CueName>([
  'press', 'release', 'double-click', 'long-press',
  'toggle-on', 'toggle-off', 'check', 'uncheck',
  'drag-start', 'drop', 'snap', 'reorder', 'invalid-drop',
  'reaction', 'success', 'blocked', 'retry',
  'play', 'pause', 'lock', 'unlock',
  'reward', 'level-up', 'achievement', 'streak', 'badge', 'bonus',
  'add-to-cart', 'remove-from-cart', 'purchase',
])

const ZEN_PAPER_CUES = new Set<CueName>([
  'copy', 'paste', 'open', 'close', 'expand', 'collapse',
  'drag-start', 'drop', 'swipe', 'reorder',
  'send', 'receive', 'add-to-cart', 'remove-from-cart', 'checkout', 'refund',
])

const ZEN_BRUSH_CUES = new Set<CueName>([
  'undo', 'redo', 'back', 'forward', 'swipe', 'send', 'receive', 'wake', 'sleep',
])

const ZEN_WOOD_CUES = new Set<CueName>([
  'press', 'release', 'double-click', 'long-press', 'select', 'deselect', 'toggle-on', 'toggle-off', 'check', 'uncheck',
  'delete', 'paste', 'drop', 'snap', 'invalid-drop', 'notification', 'mention',
  'success', 'error', 'warning', 'blocked', 'retry', 'checkpoint',
  'connect', 'disconnect', 'lock', 'unlock', 'reward', 'badge',
  'add-to-cart', 'remove-from-cart', 'checkout', 'purchase',
])

const ZEN_CHIME_CUES = new Set<CueName>([
  'send', 'receive', 'notification', 'mention', 'reaction',
  'success', 'error', 'warning', 'info', 'retry', 'complete', 'checkpoint',
  'connect', 'disconnect', 'wake', 'reward', 'level-up', 'achievement', 'streak', 'badge', 'bonus',
  'checkout', 'purchase', 'coupon', 'refund',
])

const ZEN_FREQUENT_CUES = new Set<CueName>([
  'hover', 'press', 'release', 'double-click', 'focus',
  'select', 'deselect', 'toggle-on', 'toggle-off', 'check', 'uncheck',
  'snap', 'typing', 'progress-step', 'seek', 'volume-change',
])

function zenVariation(cue: CueName, channel: number) {
  let hash = 2166136261 ^ channel
  for (let index = 0; index < cue.length; index += 1) {
    hash ^= cue.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function zenMaterialMix(cue: CueName) {
  return {
    paper: ZEN_PAPER_CUES.has(cue) ? 0.72 + zenVariation(cue, 1) * 0.28 : 0,
    brush: ZEN_BRUSH_CUES.has(cue) ? 0.68 + zenVariation(cue, 2) * 0.32 : 0,
    wood: ZEN_WOOD_CUES.has(cue) ? 0.7 + zenVariation(cue, 3) * 0.3 : 0,
    chime: ZEN_CHIME_CUES.has(cue) ? 0.64 + zenVariation(cue, 4) * 0.36 : 0,
  }
}

function arrangeNotes(pack: PackName, cue: CueName, source: readonly PatternNote[], loop: boolean): PatternNote[] {
  const notes = source.map((note) => ({ ...note }))
  switch (pack) {
    case 'soft':
      return notes.map((note, index) => ({
        ...note,
        at: loop ? note.at : note.at * 1.06 + index * 0.006,
        length: note.length * 1.13,
        semitone: note.semitone * 0.94,
      }))
    case 'glass': {
      if (loop || notes.length === 0 || !SHIMMER_CUES.has(cue)) return notes
      const last = notes[notes.length - 1]
      return last ? [...notes, {
        ...last,
        at: last.at + Math.min(0.08, last.length * 0.28),
        semitone: last.semitone + 12,
        length: last.length * 0.68,
        gain: (last.gain ?? 1) * 0.18,
      }] : notes
    }
    case 'arcade':
      return notes.map((note, index) => ({
        ...note,
        at: loop ? note.at : Math.round(note.at / 0.04) * 0.04,
        length: Math.max(0.06, Math.round(note.length / 0.04) * 0.04) * 0.82,
        semitone: Math.round(note.semitone) + (index % 2 === 1 ? 0.25 : 0),
      }))
    case 'mechanical':
      return [
        ...(loop || !MECHANICAL_DETENT_CUES.has(cue) ? [] : [{ at: 0, semitone: -12, length: 0.055, glide: -3, gain: 0.28 }]),
        ...notes.map((note) => ({ ...note, length: note.length * 0.62, gain: (note.gain ?? 1) * 0.82 })),
      ]
    case 'organic':
      return notes.flatMap((note, index) => {
        const body = {
          ...note,
          at: loop ? note.at : note.at + index * 0.009,
          semitone: note.semitone + (index % 2 === 0 ? -0.16 : 0.11),
        }
        if (loop || index !== 0 || !ORGANIC_BODY_CUES.has(cue)) return [body]
        return [body, {
          ...note,
          at: note.at + 0.018,
          semitone: note.semitone - 12.08,
          length: note.length * 0.52,
          gain: (note.gain ?? 1) * 0.2,
        }]
      })
    case 'dreamy':
      return notes.flatMap((note, index) => [
        { ...note, at: loop ? note.at : note.at * 1.08, length: note.length * 1.18, gain: (note.gain ?? 1) * 0.78 },
        ...(loop || !SHIMMER_CUES.has(cue) ? [] : [{ ...note, at: note.at * 1.08 + 0.07 + index * 0.012, semitone: note.semitone + 12.02, length: note.length * 0.82, gain: (note.gain ?? 1) * 0.13 }]),
      ])
    case 'scifi':
      return notes.map((note, index) => ({
        ...note,
        at: loop ? note.at : Math.round(note.at / 0.01) * 0.01,
        length: note.length * 0.72,
        semitone: note.semitone + (index % 2 === 0 ? -0.04 : 0.16),
        glide: (note.glide ?? 0) * 0.58 + (note.glide === undefined ? (index % 2 === 0 ? 0.45 : -0.25) : 0),
        gain: (note.gain ?? 1) * (index === 0 ? 1 : 0.9),
      }))
    case 'rubber':
      return notes.map((note, index) => ({
        ...note,
        at: loop ? note.at : note.at * 0.98 + index * 0.004,
        length: note.length * 0.84,
        semitone: note.semitone + (index % 2 === 0 ? -0.18 : 0.08),
        glide: (note.glide ?? 0) * 0.52,
        gain: (note.gain ?? 1) * (index === 0 ? 1 : 0.88),
      }))
    case 'cinematic':
      return [
        ...notes.map((note) => ({ ...note, length: note.length * 1.16, gain: (note.gain ?? 1) * 0.72 })),
        ...(loop || notes.length === 0 || !CINEMATIC_WEIGHT_CUES.has(cue) ? [] : [{ at: 0, semitone: -24, length: Math.min(0.38, Math.max(...notes.map((note) => note.length))), glide: -2, gain: 0.28 }]),
      ]
    case 'studio': {
      const body = notes.map((note) => ({
        ...note,
        at: loop ? note.at : note.at * 0.92,
        length: note.length * 0.82,
        gain: (note.gain ?? 1) * (loop ? 0.55 : 0.8),
      }))
      if (loop || body.length === 0) return body
      if (STUDIO_DETENT_CUES.has(cue)) {
        return [{ at: 0, semitone: -12, length: 0.045, glide: -2, gain: 0.12 }, ...body]
      }
      if (STUDIO_MILESTONE_CUES.has(cue)) {
        const last = body[body.length - 1]
        return last ? [...body, {
          ...last,
          at: last.at + 0.055,
          semitone: last.semitone + 12,
          length: last.length * 0.55,
          gain: (last.gain ?? 1) * 0.1,
        }] : body
      }
      return body
    }
    case 'zen': {
      const variation = zenVariation(cue, 0)
      const lengthScale = loop ? 0.68 : ZEN_FREQUENT_CUES.has(cue) ? 0.46 : 0.68
      return notes.map((note, index) => ({
        ...note,
        at: loop ? note.at : note.at * (0.9 + variation * 0.025) + index * 0.002,
        length: note.length * lengthScale * (0.96 + variation * 0.05),
        semitone: note.semitone + (variation - 0.5) * 0.22 + (index % 2 === 0 ? -0.035 : 0.025),
        glide: note.glide === undefined ? undefined : note.glide * 0.28,
        gain: (note.gain ?? 1) * (loop ? 0.32 : ZEN_FREQUENT_CUES.has(cue) ? 0.48 : 0.52),
      }))
    }
    default:
      return notes
  }
}

export function createRecipe(packName: PackName, cueName: CueName): SoundRecipe {
  const cue = getCue(cueName)
  const pack = getPack(packName)
  const durationScale = cue.loop ? 1 : pack.duration
  const arrangedNotes = arrangeNotes(packName, cueName, cue.notes, cue.loop ?? false)
  let notes = arrangedNotes.map((note) => {
    const startMidi = cue.baseMidi + note.semitone + 12 * Math.log2(pack.pitch)
    const endMidi = startMidi + (note.glide ?? 0)
    return {
      ...note,
      at: note.at * durationScale,
      length: note.length * durationScale,
      frequency: midiToFrequency(startMidi),
      endFrequency: midiToFrequency(endMidi),
    }
  })
  let duration = cue.loop
    ? cue.duration
    : Math.max(cue.duration * durationScale, ...notes.map((note) => note.at + note.length + 0.02))
  const maximumOneShotBody = 1.5 - 0.024 - pack.echo * 1.6
  if (!cue.loop && duration > maximumOneShotBody) {
    const fit = (maximumOneShotBody - 0.02) / (duration - 0.02)
    notes = notes.map((note) => ({ ...note, at: note.at * fit, length: note.length * fit }))
    duration = maximumOneShotBody
  }
  const packTexture = pack.noise
  const cueTexture = cue.noise ?? 0
  const transient = Math.min(1, (cue.transient ?? 0) * (0.7 + pack.transient * 0.3) + pack.transient * 0.45)
    * (cue.loop ? 0.58 : 1)
  const fmDepth = (pack.fmDepth ?? 0) * (cue.loop ? 0.58 : cue.category === 'reward' ? 1.12 : 1)
  const elasticity = (pack.elasticity ?? 0) * (cue.loop ? 0.18 : RUBBER_EXPRESSIVE_CUES.has(cueName) ? 1 : 0.36)
  const zenMaterials = packName === 'zen' ? zenMaterialMix(cueName) : undefined

  return {
    cue: cueName,
    pack: packName,
    duration,
    notes,
    waveform: pack.waveform,
    harmonics: pack.harmonics,
    attack: pack.attack,
    decay: pack.decay,
    // Texture is event-bound in the renderer. Pack character modulates a cue's
    // intentional texture instead of adding a permanent ambient noise floor.
    noise: packName === 'zen' ? 0 : Math.min(0.42, cueTexture * (0.55 + packTexture) + packTexture * 0.025),
    transient: packName === 'zen' ? Math.min(0.12, transient * 0.28) : transient,
    brightness: pack.brightness,
    // Per-keystroke feedback must end before the next ordinary key event.
    // Cap long pack tails so expressive feels stay crisp at typing cadence.
    echo: cueName === 'typing' ? Math.min(pack.echo, 0.004) : pack.echo,
    bitDepth: pack.bitDepth,
    panFrom: cue.panFrom ?? 0,
    panTo: cue.panTo ?? cue.panFrom ?? 0,
    loop: cue.loop ?? false,
    defaultVolume: cue.defaultVolume,
    fmRatio: pack.fmRatio ?? 1,
    fmDepth,
    elasticity,
    paper: (pack.paper ?? 0) * (zenMaterials?.paper ?? 0),
    brush: (pack.brush ?? 0) * (zenMaterials?.brush ?? 0),
    wood: (pack.wood ?? 0) * (zenMaterials?.wood ?? 0),
    chime: (pack.chime ?? 0) * (zenMaterials?.chime ?? 0),
  }
}
