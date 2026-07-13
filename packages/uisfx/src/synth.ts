import type { SoundRecipe } from './recipes'

export interface RenderedSound {
  sampleRate: number
  duration: number
  left: Float32Array
  right: Float32Array
  peak: number
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function polyBlep(time: number, delta: number) {
  if (delta <= 0 || delta >= 0.5) return 0
  if (time < delta) {
    const progress = time / delta
    return progress + progress - progress * progress - 1
  }
  if (time > 1 - delta) {
    const progress = (time - 1) / delta
    return progress * progress + progress + progress + 1
  }
  return 0
}

function oscillator(phase: number, waveform: SoundRecipe['waveform'], phaseDelta: number) {
  const normalized = phase / (Math.PI * 2)
  const cycle = normalized - Math.floor(normalized)
  switch (waveform) {
    case 'square': {
      const raw = cycle < 0.5 ? 1 : -1
      return raw + polyBlep(cycle, phaseDelta) - polyBlep((cycle + 0.5) % 1, phaseDelta)
    }
    case 'saw':
      return 2 * cycle - 1 - polyBlep(cycle, phaseDelta)
    case 'triangle':
      return 2 * Math.abs(2 * (normalized - Math.floor(normalized + 0.5))) - 1
    default:
      return Math.sin(phase)
  }
}

function envelope(time: number, length: number, attack: number, decay: number) {
  if (time < 0 || time > length) return 0
  if (time < attack) return time / Math.max(attack, 0.0001)
  const progress = (time - attack) / Math.max(length - attack, 0.0001)
  return Math.max(0, 1 - progress) ** decay
}

function softLimit(value: number) {
  return Math.tanh(value * 1.2) / Math.tanh(1.2)
}

export function renderRecipe(recipe: SoundRecipe, sampleRate = 44_100): RenderedSound {
  const finalNoteEnd = Math.max(0, ...recipe.notes.map((note) => note.at + note.length))
  const cleanHold = 0.024
  const bodyDuration = recipe.loop
    ? recipe.duration
    : Math.min(recipe.duration, finalNoteEnd + (recipe.pack === 'zen' ? 0.36 : 0.06))
  const tail = recipe.loop ? 0 : cleanHold + recipe.echo * 1.6
  const frameCount = Math.max(1, Math.round((bodyDuration + tail) * sampleRate))
  const left = new Float32Array(frameCount)
  const right = new Float32Array(frameCount)
  const random = mulberry32(hashString(`${recipe.pack}:${recipe.cue}`))
  const materialRandom = mulberry32(hashString(`${recipe.pack}:${recipe.cue}:materials`))
  const phases = new Float64Array(recipe.notes.length)
  let lowNoise = 0
  let paperNoise = 0
  let brushNoise = 0
  let peak = 0
  const effectiveAttack = recipe.loop ? Math.max(0.0018, recipe.attack) : recipe.attack
  const hasMaterials = recipe.paper > 0 || recipe.brush > 0 || recipe.wood > 0 || recipe.chime > 0

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate
    let tonal = 0
    let textureEnvelope = 0
    let transientEnvelope = 0
    let material = 0

    for (let noteIndex = 0; noteIndex < recipe.notes.length; noteIndex += 1) {
      const note = recipe.notes[noteIndex]
      if (!note) continue
      const localTime = time - note.at
      if (localTime < 0 || localTime > note.length) continue

      const progress = localTime / note.length
      const glideFrequency = note.frequency * (note.endFrequency / note.frequency) ** progress
      const elasticSemitones = recipe.elasticity
        * Math.exp(-localTime * 19)
        * Math.cos(Math.PI * 2 * 12.5 * localTime)
      const frequency = glideFrequency * 2 ** (elasticSemitones / 12)
      phases[noteIndex] = (phases[noteIndex] ?? 0) + Math.PI * 2 * frequency / sampleRate
      const phase = phases[noteIndex] ?? 0
      const phaseModulation = recipe.fmDepth > 0
        ? Math.sin(phase * recipe.fmRatio) * recipe.fmDepth * Math.exp(-localTime * 7.5)
        : 0
      let voice = 0
      for (const [ratio, amount] of recipe.harmonics) {
        voice += oscillator(
          phase * ratio + phaseModulation,
          recipe.waveform,
          Math.min(0.49, frequency * ratio / sampleRate),
        ) * amount
      }
      const noteGain = note.gain ?? 1
      const noteEnvelope = envelope(localTime, note.length, effectiveAttack, recipe.decay)
      tonal += voice * noteEnvelope * noteGain
      textureEnvelope += envelope(
        localTime,
        note.length,
        Math.min(0.004, effectiveAttack),
        Math.max(2.35, recipe.decay * 1.25),
      ) * noteGain
      const transientAttack = 1 - Math.exp(-localTime * 800)
      transientEnvelope += transientAttack
        * Math.exp(-localTime * (105 + recipe.brightness * 170))
        * noteGain
    }

    const rawNoise = random() * 2 - 1
    const materialRaw = materialRandom() * 2 - 1
    paperNoise += (materialRaw - paperNoise) * 0.13
    brushNoise += (materialRaw - brushNoise) * 0.035
    const paperGrain = materialRaw - paperNoise

    if (hasMaterials) {
      for (const note of recipe.notes) {
        const localTime = time - note.at
        if (localTime < 0) continue

        if (recipe.paper > 0) {
          const length = Math.min(note.length, 0.18, Math.max(0.075, note.length * 0.72))
          if (localTime <= length) {
            const progress = localTime / length
            const fold = Math.sin(Math.PI * progress) ** 0.62 * (1 - progress * 0.36)
            const firstCrease = Math.exp(-(((localTime - length * 0.2) / 0.007) ** 2))
            const secondCrease = Math.exp(-(((localTime - length * 0.62) / 0.011) ** 2))
            material += paperGrain * recipe.paper * fold * (0.38 + firstCrease * 0.66 + secondCrease * 0.38)
          }
        }

        if (recipe.brush > 0) {
          const length = Math.min(note.length, 0.3, Math.max(0.12, note.length * 1.16))
          if (localTime <= length) {
            const progress = localTime / length
            const stroke = Math.sin(Math.PI * progress) ** 0.82
            const bristle = materialRaw * 0.3 + brushNoise * 0.7
            material += bristle * recipe.brush * stroke * (0.72 + progress * 0.18)
          }
        }

        if (recipe.wood > 0) {
          const length = Math.min(note.length, 0.22, Math.max(0.09, note.length * 0.8))
          if (localTime <= length) {
            const onset = 1 - Math.exp(-localTime * 480)
            const decay = Math.exp(-localTime * 18)
            const fundamental = Math.sin(Math.PI * 2 * note.frequency * 0.31 * localTime)
            const grain = Math.sin(Math.PI * 2 * note.frequency * 0.47 * localTime + 0.3) * 0.34
            material += (fundamental + grain) * recipe.wood * onset * decay
          }
        }

        if (recipe.chime > 0) {
          const length = Math.min(note.length, 0.42, Math.max(0.16, note.length * 1.25))
          if (localTime <= length) {
            const onset = 1 - Math.exp(-localTime * 520)
            const decay = Math.exp(-localTime * 7.4)
            const shimmer = Math.sin(Math.PI * 2 * note.frequency * 2.01 * localTime)
              + Math.sin(Math.PI * 2 * note.frequency * 3.87 * localTime + 0.4) * 0.28
            material += shimmer * recipe.chime * onset * decay
          }
        }
      }
    }
    const cutoff = 520 + recipe.brightness * 4_800
    const smoothing = 1 - Math.exp(-Math.PI * 2 * cutoff / sampleRate)
    lowNoise += (rawNoise - lowNoise) * smoothing
    const highNoise = rawNoise - lowNoise
    const textureNoise = highNoise * (0.52 + recipe.brightness * 0.28)
      + lowNoise * (0.18 - recipe.brightness * 0.08)
    const texture = textureNoise * recipe.noise * Math.min(1.4, textureEnvelope)
    const transient = highNoise * recipe.transient * Math.min(1.35, transientEnvelope)
    const zen = recipe.pack === 'zen'
    let sample = tonal * (zen ? 0.38 : 0.62)
      + texture * (zen ? 0.2 : 0.32)
      + transient * (zen ? 0.2 : 0.3)
      + material * (zen ? 0.72 : 0)

    if (recipe.bitDepth < 16) {
      const levels = 2 ** recipe.bitDepth
      sample = Math.round(sample * levels) / levels
    }

    const panProgress = Math.min(1, time / Math.max(recipe.duration, 0.001))
    const pan = recipe.loop
      ? (recipe.panFrom + recipe.panTo) / 2
        - (recipe.panTo - recipe.panFrom) / 2 * Math.cos(Math.PI * 2 * panProgress)
      : recipe.panFrom + (recipe.panTo - recipe.panFrom) * panProgress
    const angle = ((pan + 1) * Math.PI) / 4
    const limited = softLimit(sample)
    left[frame] = limited * Math.cos(angle)
    right[frame] = limited * Math.sin(angle)
  }

  if (recipe.echo > 0 && !recipe.loop) {
    const delayFrames = Math.floor((0.035 + recipe.echo * 0.38) * sampleRate)
    const amount = Math.min(0.22, recipe.echo * 1.65)
    for (let frame = delayFrames; frame < frameCount; frame += 1) {
      left[frame] += left[frame - delayFrames] * amount
      right[frame] += right[frame - delayFrames] * amount
    }
  }

  if (!recipe.loop) {
    const fadeFrames = Math.min(frameCount, Math.round(0.028 * sampleRate))
    const fadeStart = frameCount - fadeFrames
    for (let frame = fadeStart; frame < frameCount; frame += 1) {
      const remaining = (frameCount - 1 - frame) / Math.max(1, fadeFrames - 1)
      const gain = Math.sin(remaining * Math.PI / 2) ** 2
      left[frame] *= gain
      right[frame] *= gain
    }
  }

  for (let frame = 0; frame < frameCount; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  // Leave generous headroom because short, bright transients can overshoot
  // after low-bitrate MP3 encoding even when the source PCM is below 0 dBFS.
  const targetPeak = recipe.pack === 'zen'
    ? recipe.loop ? 0.23 : recipe.cue === 'hover' ? 0.22 : 0.34
    : recipe.loop ? 0.32 : recipe.cue === 'hover' ? 0.3 : 0.42
  const scale = peak > 0 ? Math.min(2.2, targetPeak / peak) : 1
  peak = 0
  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] *= scale
    right[frame] *= scale
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  return { sampleRate, duration: frameCount / sampleRate, left, right, peak }
}
