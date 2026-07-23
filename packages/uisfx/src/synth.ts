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

function oscillator(phase: number, waveform: SoundRecipe['waveform']) {
  const normalized = phase / (Math.PI * 2)
  switch (waveform) {
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
    case 'saw':
      return 2 * (normalized - Math.floor(normalized + 0.5))
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
  const tail = recipe.loop
    ? 0
    : recipe.pack === 'zen'
      ? Math.max(0.09, recipe.echo * 1.6)
      : Math.max(0.028, recipe.echo * 1.6)
  const frameCount = Math.max(1, Math.ceil((recipe.duration + tail) * sampleRate))
  const left = new Float32Array(frameCount)
  const right = new Float32Array(frameCount)
  const random = mulberry32(hashString(`${recipe.pack}:${recipe.cue}`))
  const materialRandom = mulberry32(hashString(`${recipe.pack}:${recipe.cue}:materials`))
  let filteredNoise = 0
  let paperNoise = 0
  let brushNoise = 0
  let peak = 0
  const hasMaterials = Boolean(recipe.paper || recipe.brush || recipe.wood || recipe.chime)

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate
    let tonal = 0

    for (const note of recipe.notes) {
      const localTime = time - note.at
      if (localTime < 0 || localTime > note.length) continue

      const progress = localTime / note.length
      const frequency = note.frequency * (note.endFrequency / note.frequency) ** progress
      const phase = Math.PI * 2 * frequency * localTime
      let voice = 0
      for (const [ratio, amount] of recipe.harmonics) {
        voice += oscillator(phase * ratio, recipe.waveform) * amount
      }
      tonal += voice * envelope(localTime, note.length, recipe.attack, recipe.decay) * (note.gain ?? 1)
    }

    const rawNoise = random() * 2 - 1
    const smoothing = 0.025 + recipe.brightness * 0.34
    filteredNoise += (rawNoise - filteredNoise) * smoothing
    const bodyEnvelope = Math.max(0, 1 - time / Math.max(recipe.duration, 0.001)) ** 1.7
    const noise = filteredNoise * recipe.noise * bodyEnvelope
    const transientEnvelope = Math.exp(-time * (95 + recipe.brightness * 160))
    const transient = rawNoise * recipe.transient * transientEnvelope
    let material = 0

    if (hasMaterials) {
      const materialRaw = materialRandom() * 2 - 1
      paperNoise += (materialRaw - paperNoise) * 0.13
      brushNoise += (materialRaw - brushNoise) * 0.035
      const paperGrain = materialRaw - paperNoise

      for (const note of recipe.notes) {
        const localTime = time - note.at
        if (localTime < 0) continue

        if (recipe.paper) {
          const length = Math.min(0.18, Math.max(0.075, note.length * 0.72))
          if (localTime <= length) {
            const progress = localTime / length
            const fold = Math.sin(Math.PI * progress) ** 0.62 * (1 - progress * 0.36)
            const firstCrease = Math.exp(-(((localTime - length * 0.2) / 0.007) ** 2))
            const secondCrease = Math.exp(-(((localTime - length * 0.62) / 0.011) ** 2))
            material += paperGrain * recipe.paper * fold * (0.38 + firstCrease * 0.66 + secondCrease * 0.38)
          }
        }

        if (recipe.brush) {
          const length = Math.min(0.3, Math.max(0.12, note.length * 1.16))
          if (localTime <= length) {
            const progress = localTime / length
            const stroke = Math.sin(Math.PI * progress) ** 0.82
            const bristle = materialRaw * 0.3 + brushNoise * 0.7
            material += bristle * recipe.brush * stroke * (0.72 + progress * 0.18)
          }
        }

        if (recipe.wood) {
          const length = Math.min(0.22, Math.max(0.09, note.length * 0.8))
          if (localTime <= length) {
            const onset = 1 - Math.exp(-localTime * 480)
            const decay = Math.exp(-localTime * 18)
            const fundamental = Math.sin(Math.PI * 2 * note.frequency * 0.31 * localTime)
            const grain = Math.sin(Math.PI * 2 * note.frequency * 0.47 * localTime + 0.3) * 0.34
            material += (fundamental + grain) * recipe.wood * onset * decay
          }
        }

        if (recipe.chime) {
          const length = Math.min(0.42, Math.max(0.16, note.length * 1.25))
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

    const zen = recipe.pack === 'zen'
    let sample = tonal * (zen ? 0.34 : 0.58)
      + noise * (zen ? 0.28 : 0.62)
      + transient * (zen ? 0.34 : 0.48)
      + material * (zen ? 0.72 : 0)

    if (recipe.bitDepth < 16) {
      const levels = 2 ** recipe.bitDepth
      sample = Math.round(sample * levels) / levels
    }

    const panProgress = Math.min(1, time / Math.max(recipe.duration, 0.001))
    const pan = recipe.panFrom + (recipe.panTo - recipe.panFrom) * panProgress
    const angle = ((pan + 1) * Math.PI) / 4
    // Loop recipes meet silence at both buffer edges. The tiny equal-power-like
    // fade prevents a transient or noise grain from clicking at the seam.
    const loopFade = recipe.loop
      ? Math.min(1, time / 0.012, Math.max(0, (recipe.duration - time) / 0.012))
      : 1
    const limited = softLimit(sample) * loopFade
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

  if (recipe.pack === 'zen' && !recipe.loop) {
    const taperFrames = Math.max(1, Math.floor(sampleRate * 0.04))
    for (let frame = Math.max(0, frameCount - taperFrames); frame < frameCount; frame += 1) {
      const taper = (frameCount - 1 - frame) / taperFrames
      left[frame] *= Math.max(0, taper)
      right[frame] *= Math.max(0, taper)
    }
  }

  for (let frame = 0; frame < frameCount; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  // Leave generous headroom because short, bright transients can overshoot
  // after low-bitrate MP3 encoding even when the source PCM is below 0 dBFS.
  const targetPeak = recipe.pack === 'zen'
    ? recipe.cue === 'hover'
      ? 0.22
      : recipe.loop
        ? 0.23
        : 0.34
    : recipe.cue === 'hover' || recipe.cue === 'loading'
      ? 0.34
      : 0.48
  const scale = peak > 0 ? Math.min(1.8, targetPeak / peak) : 1
  peak = 0
  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] = softLimit(left[frame] * scale)
    right[frame] = softLimit(right[frame] * scale)
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  if (recipe.pack === 'zen' && peak > targetPeak) {
    const trim = targetPeak / peak
    peak = 0
    for (let frame = 0; frame < frameCount; frame += 1) {
      left[frame] *= trim
      right[frame] *= trim
      peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
    }
  }

  return { sampleRate, duration: frameCount / sampleRate, left, right, peak }
}
