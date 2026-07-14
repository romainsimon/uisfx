import { CUES, packNames, type CueName, type PackName } from './catalog'
import { createRecipe } from './recipes'
import { renderRecipe } from './synth'

export interface PlayOptions {
  volume?: number
  loop?: boolean
  playbackRate?: number
  retrigger?: 'restart' | 'overlap' | 'ignore'
  cooldownMs?: number
}

export interface UISFXOptions {
  pack?: PackName
  volume?: number
  enabled?: boolean
  maxVoices?: number
  cooldownMs?: number
  preferences?: UISFXPreferences
  context?: AudioContext
}

export interface UISFXPreferenceStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface UISFXPreferences {
  key?: string
  storage?: UISFXPreferenceStorage
}

export interface PlayingSFX {
  stop: () => void
  ended: Promise<void>
}

export interface PreloadOptions {
  signal?: AbortSignal
}

export interface UISFXPlayer {
  unlock: () => Promise<boolean>
  play: (cue: CueName, options?: PlayOptions) => PlayingSFX | null
  preload: (cues?: readonly CueName[], options?: PreloadOptions) => Promise<void>
  setPack: (pack: PackName) => void
  getPack: () => PackName
  setVolume: (volume: number) => void
  getVolume: () => number
  setEnabled: (enabled: boolean) => void
  isEnabled: () => boolean
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

function clampVoices(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.min(32, Math.round(value)))
    : 8
}

function yieldToMain() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

const SEMANTIC_COOLDOWNS: Partial<Record<CueName, number>> = {
  hover: 60,
  focus: 80,
  'progress-step': 80,
  'volume-change': 60,
}

const STOP_FADE_SECONDS = 0.018

function normalizeCooldown(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(10_000, value))
    : fallback
}

function resolvePreferenceStorage(preferences: UISFXPreferences | undefined) {
  if (!preferences) return undefined
  if (preferences.storage) return preferences.storage
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function readPreferences(storage: UISFXPreferenceStorage | undefined, key: string) {
  if (!storage) return {}
  try {
    const value = JSON.parse(storage.getItem(key) ?? '{}') as Record<string, unknown>
    return {
      pack: typeof value.pack === 'string' && packNames.includes(value.pack as PackName)
        ? value.pack as PackName
        : undefined,
      volume: typeof value.volume === 'number' ? clampUnit(value.volume, 1) : undefined,
      enabled: typeof value.enabled === 'boolean' ? value.enabled : undefined,
    }
  } catch {
    return {}
  }
}

export function createUISFX(options: UISFXOptions = {}): UISFXPlayer {
  const preferenceKey = options.preferences?.key ?? 'uisfx:preferences'
  const preferenceStorage = resolvePreferenceStorage(options.preferences)
  const savedPreferences = readPreferences(preferenceStorage, preferenceKey)
  let pack: PackName = options.pack ?? savedPreferences.pack ?? 'minimal'
  let masterVolume = clampUnit(options.volume ?? savedPreferences.volume, 1)
  let enabled = options.enabled ?? savedPreferences.enabled ?? true
  const maxVoices = clampVoices(options.maxVoices)
  let context = options.context
  let masterGain: GainNode | undefined
  const buffers = new Map<string, AudioBuffer>()
  const stoppedSources = new WeakSet<AudioBufferSourceNode>()

  interface ActivePlayback {
    cue: CueName
    options: PlayOptions
    loop: boolean
    retrigger: NonNullable<PlayOptions['retrigger']>
    source?: AudioBufferSourceNode
    playing: PlayingSFX
    stopped: boolean
    finished: boolean
    resolveEnded: () => void
  }

  const activeSources = new Map<AudioBufferSourceNode, { gain: GainNode; playback: ActivePlayback }>()
  const activeCues = new Map<CueName, ActivePlayback>()
  const activePlaybacks = new Set<ActivePlayback>()
  const lastStartedAt = new Map<CueName, number>()

  function persistPreferences() {
    if (!preferenceStorage) return
    try {
      preferenceStorage.setItem(preferenceKey, JSON.stringify({ pack, volume: masterVolume, enabled }))
    } catch { /* Storage can be unavailable in private or constrained browser contexts. */ }
  }

  function stopSource(source: AudioBufferSourceNode) {
    const active = activeSources.get(source)
    if (!active || stoppedSources.has(source)) return
    stoppedSources.add(source)
    const now = context?.currentTime ?? 0
    try {
      active.gain.gain.cancelScheduledValues(now)
      active.gain.gain.setValueAtTime(active.gain.gain.value, now)
      active.gain.gain.linearRampToValueAtTime(0, now + 0.015)
      source.stop(now + STOP_FADE_SECONDS)
    } catch { /* The source may already have ended between frames. */ }
  }

  function finishPlayback(playback: ActivePlayback) {
    if (playback.finished) return
    playback.finished = true
    activePlaybacks.delete(playback)
    if (activeCues.get(playback.cue) === playback) activeCues.delete(playback.cue)
    playback.resolveEnded()
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

  function startPlayback(playback: ActivePlayback) {
    const audioContext = ensureContext()
    const buffer = getBuffer(playback.cue)
    if (!audioContext || !buffer) return false

    if (audioContext.state === 'suspended') void audioContext.resume()

    const liveSources = [...activeSources.entries()]
      .filter(([source]) => !stoppedSources.has(source))
    let startAt: number | undefined
    if (liveSources.length >= maxVoices) {
      const oldestOneShot = liveSources.find(([, active]) => !active.playback.loop)
      const oldest = oldestOneShot ?? liveSources[0]
      if (oldest) {
        oldest[1].playback.playing.stop()
        startAt = audioContext.currentTime + STOP_FADE_SECONDS
      }
    }

    const recipe = createRecipe(pack, playback.cue)
    const source = audioContext.createBufferSource()
    const gain = audioContext.createGain()
    source.buffer = buffer
    source.loop = playback.loop
    source.playbackRate.value = Math.max(0.25, Math.min(4, playback.options.playbackRate ?? 1))
    gain.gain.value = clampUnit(playback.options.volume, recipe.defaultVolume)
    source.connect(gain)
    gain.connect(ensureMasterGain(audioContext))

    playback.source = source
    source.addEventListener('ended', () => {
      activeSources.delete(source)
      source.disconnect()
      gain.disconnect()
      if (playback.source !== source) return
      playback.source = undefined
      finishPlayback(playback)
    }, { once: true })

    activeSources.set(source, { gain, playback })
    if (startAt === undefined) source.start()
    else source.start(startAt)
    return true
  }

  function play(cue: CueName, playOptions: PlayOptions = {}): PlayingSFX | null {
    if (!enabled) return null
    const recipe = createRecipe(pack, cue)
    const shouldLoop = playOptions.loop ?? recipe.loop
    const retrigger = playOptions.retrigger ?? (shouldLoop ? 'ignore' : 'restart')
    const existing = activeCues.get(cue)
    const cooldownMs = normalizeCooldown(
      playOptions.cooldownMs ?? options.cooldownMs,
      SEMANTIC_COOLDOWNS[cue] ?? 0,
    )
    const now = performance.now()
    const lastStarted = lastStartedAt.get(cue)
    if (lastStarted !== undefined && now - lastStarted < cooldownMs) return existing?.playing ?? null
    if (existing && retrigger === 'ignore') return existing.playing
    if (existing && retrigger === 'restart') existing.playing.stop()

    let resolveEnded: () => void = () => undefined
    const ended = new Promise<void>((resolve) => {
      resolveEnded = resolve
    })
    let playback: ActivePlayback
    const playing: PlayingSFX = {
      stop() {
        if (playback.stopped) return
        playback.stopped = true
        if (activeCues.get(cue) === playback) activeCues.delete(cue)
        if (playback.source) stopSource(playback.source)
        else finishPlayback(playback)
      },
      ended,
    }
    playback = {
      cue,
      options: playOptions,
      loop: shouldLoop,
      retrigger,
      playing,
      stopped: false,
      finished: false,
      resolveEnded,
    }

    activePlaybacks.add(playback)
    if (retrigger !== 'overlap') activeCues.set(cue, playback)
    if (!startPlayback(playback)) {
      finishPlayback(playback)
      return null
    }
    lastStartedAt.set(cue, now)
    return playing
  }

  async function preload(
    cues: readonly CueName[] = CUES.map((cue) => cue.name),
    preloadOptions: PreloadOptions = {},
  ) {
    const audioContext = ensureContext()
    if (!audioContext) return
    for (const cue of cues) {
      if (preloadOptions.signal?.aborted) return
      await yieldToMain()
      if (preloadOptions.signal?.aborted) return
      getBuffer(cue)
    }
  }

  async function unlock() {
    const audioContext = ensureContext()
    if (!audioContext) return false
    if (audioContext.state === 'running') return true
    try {
      await audioContext.resume()
      return (audioContext.state as AudioContextState) === 'running'
    } catch {
      return false
    }
  }

  function stopAll() {
    for (const playback of [...activePlaybacks]) playback.playing.stop()
  }

  return {
    unlock,
    play,
    preload,
    setPack(nextPack) {
      if (pack === nextPack) return
      pack = nextPack
      persistPreferences()
      for (const playback of [...activePlaybacks]) {
        if (!playback.loop || playback.stopped || !playback.source) continue
        stopSource(playback.source)
        if (!startPlayback(playback)) finishPlayback(playback)
      }
    },
    getPack() {
      return pack
    },
    setVolume(volume) {
      masterVolume = clampUnit(volume, masterVolume)
      persistPreferences()
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
    getVolume() {
      return masterVolume
    },
    setEnabled(nextEnabled) {
      enabled = nextEnabled
      persistPreferences()
      if (!enabled) stopAll()
    },
    isEnabled() {
      return enabled
    },
    stopAll,
    async destroy() {
      stopAll()
      for (const playback of [...activePlaybacks]) finishPlayback(playback)
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
