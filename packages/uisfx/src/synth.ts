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
  const tail = recipe.loop ? 0 : Math.max(0.028, recipe.echo * 1.6)
  const frameCount = Math.max(1, Math.ceil((recipe.duration + tail) * sampleRate))
  const left = new Float32Array(frameCount)
  const right = new Float32Array(frameCount)
  const random = mulberry32(hashString(`${recipe.pack}:${recipe.cue}`))
  let filteredNoise = 0
  let peak = 0

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
    let sample = tonal * 0.58 + noise * 0.62 + transient * 0.48

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

  for (let frame = 0; frame < frameCount; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  // Leave generous headroom because short, bright transients can overshoot
  // after low-bitrate MP3 encoding even when the source PCM is below 0 dBFS.
  const targetPeak = recipe.cue === 'hover' || recipe.cue === 'loading' ? 0.34 : 0.48
  const scale = peak > 0 ? Math.min(1.8, targetPeak / peak) : 1
  peak = 0
  for (let frame = 0; frame < frameCount; frame += 1) {
    left[frame] = softLimit(left[frame] * scale)
    right[frame] = softLimit(right[frame] * scale)
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]))
  }

  return { sampleRate, duration: frameCount / sampleRate, left, right, peak }
}
