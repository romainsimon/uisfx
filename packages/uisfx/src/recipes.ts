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
}

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12)
}

function arrangeNotes(pack: PackName, source: readonly PatternNote[], loop: boolean): PatternNote[] {
  const notes = source.map((note) => ({ ...note }))
  switch (pack) {
    case 'soft':
      return notes.map((note, index) => ({
        ...note,
        at: note.at * 1.06 + index * 0.006,
        length: note.length * 1.13,
        semitone: note.semitone * 0.94,
      }))
    case 'glass': {
      if (loop || notes.length === 0) return notes
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
        at: Math.round(note.at / 0.04) * 0.04,
        length: Math.max(0.06, Math.round(note.length / 0.04) * 0.04) * 0.82,
        semitone: Math.round(note.semitone) + (index % 2 === 1 ? 0.25 : 0),
      }))
    case 'mechanical':
      return [
        { at: 0, semitone: -12, length: 0.055, glide: -3, gain: 0.28 },
        ...notes.map((note) => ({ ...note, length: note.length * 0.62, gain: (note.gain ?? 1) * 0.82 })),
      ]
    case 'organic':
      return notes.flatMap((note, index) => {
        const body = {
          ...note,
          at: note.at + index * 0.009,
          semitone: note.semitone + (index % 2 === 0 ? -0.16 : 0.11),
        }
        if (loop || index !== 0) return [body]
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
        { ...note, at: note.at * 1.08, length: note.length * 1.18, gain: (note.gain ?? 1) * 0.78 },
        ...(loop ? [] : [{ ...note, at: note.at * 1.08 + 0.07 + index * 0.012, semitone: note.semitone + 12.02, length: note.length * 0.82, gain: (note.gain ?? 1) * 0.13 }]),
      ])
    case 'scifi':
      return notes.map((note, index) => ({
        ...note,
        at: Math.round(note.at / 0.03) * 0.03,
        length: note.length * 0.74,
        semitone: note.semitone + (index % 2 === 0 ? 0 : 6),
        glide: (note.glide ?? 0) + (index % 2 === 0 ? 5 : -4),
      }))
    case 'rubber':
      return notes.map((note, index) => ({
        ...note,
        at: note.at * 1.04 + index * 0.012,
        length: note.length * 1.05,
        semitone: note.semitone - (index % 2 === 0 ? 0.5 : 2),
        glide: (note.glide ?? 0) + (index % 2 === 0 ? 7 : -3),
      }))
    case 'cinematic':
      return [
        ...notes.map((note) => ({ ...note, length: note.length * 1.16, gain: (note.gain ?? 1) * 0.72 })),
        ...(loop || notes.length === 0 ? [] : [{ at: 0, semitone: -24, length: Math.min(0.38, Math.max(...notes.map((note) => note.length))), glide: -2, gain: 0.28 }]),
      ]
    default:
      return notes
  }
}

export function createRecipe(packName: PackName, cueName: CueName): SoundRecipe {
  const cue = getCue(cueName)
  const pack = getPack(packName)
  const durationScale = cue.loop ? 1 : pack.duration
  const arrangedNotes = arrangeNotes(packName, cue.notes, cue.loop ?? false)
  const notes = arrangedNotes.map((note) => {
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

  return {
    cue: cueName,
    pack: packName,
    duration: cue.loop
      ? cue.duration
      : Math.max(cue.duration * durationScale, ...notes.map((note) => note.at + note.length + 0.02)),
    notes,
    waveform: pack.waveform,
    harmonics: pack.harmonics,
    attack: pack.attack,
    decay: pack.decay,
    noise: Math.min(0.58, (cue.noise ?? 0) + pack.noise),
    transient: Math.min(1, (cue.transient ?? 0) + pack.transient),
    brightness: pack.brightness,
    echo: pack.echo,
    bitDepth: pack.bitDepth,
    panFrom: cue.panFrom ?? 0,
    panTo: cue.panTo ?? cue.panFrom ?? 0,
    loop: cue.loop ?? false,
    defaultVolume: cue.defaultVolume,
  }
}
