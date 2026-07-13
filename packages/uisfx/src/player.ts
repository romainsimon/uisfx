import { CUES, type CueName, type PackName } from './catalog'
import { createRecipe } from './recipes'
import { renderRecipe } from './synth'

export interface PlayOptions {
  volume?: number
  loop?: boolean
  playbackRate?: number
}

export interface UISFXOptions {
  pack?: PackName
  volume?: number
  enabled?: boolean
  context?: AudioContext
}

export interface PlayingSFX {
  stop: () => void
  ended: Promise<void>
}

export interface UISFXPlayer {
  play: (cue: CueName, options?: PlayOptions) => PlayingSFX | null
  preload: (cues?: readonly CueName[]) => Promise<void>
  setPack: (pack: PackName) => void
  getPack: () => PackName
  setVolume: (volume: number) => void
  setEnabled: (enabled: boolean) => void
  stopAll: () => void
  destroy: () => Promise<void>
}

type AudioContextConstructor = typeof AudioContext

function getAudioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const audioWindow = window as typeof window & { webkitAudioContext?: AudioContextConstructor }
  return window.AudioContext ?? audioWindow.webkitAudioContext
}

function clampUnit(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
}

export function createUISFX(options: UISFXOptions = {}): UISFXPlayer {
  let pack: PackName = options.pack ?? 'minimal'
  let masterVolume = clampUnit(options.volume, 1)
  let enabled = options.enabled ?? true
  let context = options.context
  let masterGain: GainNode | undefined
  const buffers = new Map<string, AudioBuffer>()
  const activeSources = new Map<AudioBufferSourceNode, GainNode>()
  const stoppedSources = new WeakSet<AudioBufferSourceNode>()

  function stopSource(source: AudioBufferSourceNode) {
    const gain = activeSources.get(source)
    if (!gain || stoppedSources.has(source)) return
    stoppedSources.add(source)
    const now = context?.currentTime ?? 0
    try {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + 0.015)
      source.stop(now + 0.018)
    } catch { /* The source may already have ended between frames. */ }
  }

  function ensureContext() {
    if (context) return context
    const Context = getAudioContextConstructor()
    if (!Context) return undefined
    context = new Context({ latencyHint: 'interactive' })
    return context
  }

  function ensureMasterGain(audioContext: AudioContext) {
    if (masterGain) return masterGain
    masterGain = audioContext.createGain()
    masterGain.gain.value = masterVolume
    masterGain.connect(audioContext.destination)
    return masterGain
  }

  function getBuffer(cue: CueName) {
    const audioContext = ensureContext()
    if (!audioContext) return undefined
    const key = `${pack}:${cue}:${audioContext.sampleRate}`
    const cached = buffers.get(key)
    if (cached) return cached

    const rendered = renderRecipe(createRecipe(pack, cue), audioContext.sampleRate)
    const buffer = audioContext.createBuffer(2, rendered.left.length, rendered.sampleRate)
    buffer.getChannelData(0).set(rendered.left)
    buffer.getChannelData(1).set(rendered.right)
    buffers.set(key, buffer)
    return buffer
  }

  function play(cue: CueName, playOptions: PlayOptions = {}): PlayingSFX | null {
    if (!enabled) return null
    const audioContext = ensureContext()
    const buffer = getBuffer(cue)
    if (!audioContext || !buffer) return null

    if (audioContext.state === 'suspended') void audioContext.resume()

    const source = audioContext.createBufferSource()
    const gain = audioContext.createGain()
    const recipe = createRecipe(pack, cue)
    source.buffer = buffer
    source.loop = playOptions.loop ?? recipe.loop
    source.playbackRate.value = Math.max(0.25, Math.min(4, playOptions.playbackRate ?? 1))
    gain.gain.value = clampUnit(playOptions.volume, recipe.defaultVolume)
    source.connect(gain)
    gain.connect(ensureMasterGain(audioContext))

    let resolveEnded: () => void = () => undefined
    const ended = new Promise<void>((resolve) => {
      resolveEnded = resolve
    })
    const stop = () => {
      stopSource(source)
    }

    source.addEventListener('ended', () => {
      activeSources.delete(source)
      source.disconnect()
      gain.disconnect()
      resolveEnded()
    }, { once: true })

    activeSources.set(source, gain)
    source.start()
    return { stop, ended }
  }

  async function preload(cues: readonly CueName[] = CUES.map((cue) => cue.name)) {
    const audioContext = ensureContext()
    if (!audioContext) return
    for (const cue of cues) getBuffer(cue)
  }

  function stopAll() {
    for (const source of [...activeSources.keys()]) stopSource(source)
  }

  return {
    play,
    preload,
    setPack(nextPack) {
      pack = nextPack
    },
    getPack() {
      return pack
    },
    setVolume(volume) {
      masterVolume = clampUnit(volume, masterVolume)
      if (!masterGain || !context) return
      const now = context.currentTime
      if (typeof masterGain.gain.cancelAndHoldAtTime === 'function') {
        masterGain.gain.cancelAndHoldAtTime(now)
      } else {
        masterGain.gain.cancelScheduledValues(now)
        masterGain.gain.setValueAtTime(masterGain.gain.value, now)
      }
      masterGain.gain.linearRampToValueAtTime(masterVolume, now + 0.02)
    },
    setEnabled(nextEnabled) {
      enabled = nextEnabled
      if (!enabled) stopAll()
    },
    stopAll,
    async destroy() {
      stopAll()
      buffers.clear()
      masterGain?.disconnect()
      masterGain = undefined
      if (context && context !== options.context) await context.close()
      context = undefined
    },
  }
}

export function soundUrl(pack: PackName, cue: CueName, format: 'mp3' | 'ogg' = 'mp3') {
  return `sounds/${pack}/${cue}.${format}`
}
