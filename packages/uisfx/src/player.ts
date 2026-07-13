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

export function createUISFX(options: UISFXOptions = {}): UISFXPlayer {
  let pack: PackName = options.pack ?? 'minimal'
  let masterVolume = Math.max(0, Math.min(1, options.volume ?? 1))
  let enabled = options.enabled ?? true
  let context = options.context
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
    gain.gain.value = Math.max(0, Math.min(1, playOptions.volume ?? recipe.defaultVolume)) * masterVolume
    source.connect(gain)
    gain.connect(audioContext.destination)

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
      masterVolume = Math.max(0, Math.min(1, volume))
    },
    setEnabled(nextEnabled) {
      enabled = nextEnabled
      if (!enabled) stopAll()
    },
    stopAll,
    async destroy() {
      stopAll()
      buffers.clear()
      if (context && context !== options.context) await context.close()
      context = undefined
    },
  }
}

export function soundUrl(pack: PackName, cue: CueName, format: 'mp3' | 'ogg' = 'mp3') {
  return `sounds/${pack}/${cue}.${format}`
}
