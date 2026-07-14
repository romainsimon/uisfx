import { describe, expect, it } from 'vitest'
import { createUISFX } from '../src'

type GainAutomationEvent = {
  type: 'cancel' | 'set' | 'ramp'
  time: number
  value?: number
}

class FakeAudioParam {
  value = 1
  readonly events: GainAutomationEvent[] = []

  cancelScheduledValues(time: number) {
    this.events.push({ type: 'cancel', time })
    return this as unknown as AudioParam
  }

  setValueAtTime(value: number, time: number) {
    this.value = value
    this.events.push({ type: 'set', value, time })
    return this as unknown as AudioParam
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.value = value
    this.events.push({ type: 'ramp', value, time })
    return this as unknown as AudioParam
  }
}

class FakeGainNode {
  readonly gain = new FakeAudioParam()
  readonly connections: unknown[] = []

  connect(destination: unknown) {
    this.connections.push(destination)
    return destination as AudioNode
  }

  disconnect() {}
}

class FakeBufferSourceNode {
  buffer: AudioBuffer | null = null
  loop = false
  readonly playbackRate = { value: 1 }
  readonly connections: unknown[] = []
  readonly stopTimes: number[] = []
  readonly startTimes: Array<number | undefined> = []
  private endedListener?: () => void

  connect(destination: unknown) {
    this.connections.push(destination)
    return destination as AudioNode
  }

  addEventListener(type: string, listener: () => void) {
    if (type === 'ended') this.endedListener = listener
  }
  disconnect() {}
  start(time?: number) {
    this.startTimes.push(time)
  }
  stop(time = 0) {
    this.stopTimes.push(time)
  }

  finish() {
    this.endedListener?.()
  }
}

class FakeAudioContext {
  readonly sampleRate = 8_000
  readonly currentTime = 4
  state: AudioContextState = 'running'
  readonly destination = { type: 'destination' }
  readonly gains: FakeGainNode[] = []
  readonly sources: FakeBufferSourceNode[] = []
  bufferCount = 0
  resumeCount = 0

  createGain() {
    const gain = new FakeGainNode()
    this.gains.push(gain)
    return gain as unknown as GainNode
  }

  createBufferSource() {
    const source = new FakeBufferSourceNode()
    this.sources.push(source)
    return source as unknown as AudioBufferSourceNode
  }

  createBuffer(numberOfChannels: number, length: number) {
    this.bufferCount += 1
    const channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    )
    return {
      getChannelData(channel: number) {
        const samples = channels[channel]
        if (!samples) throw new RangeError(`Missing channel ${channel}`)
        return samples
      },
    } as AudioBuffer
  }

  resume() {
    this.resumeCount += 1
    this.state = 'running'
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }
}

function setupPlayer(volume = 1) {
  const context = new FakeAudioContext()
  const player = createUISFX({
    context: context as unknown as AudioContext,
    volume,
  })
  return { context, player }
}

function getMasterGain(context: FakeAudioContext) {
  const masterGains = context.gains.filter((gain) => (
    gain.connections.includes(context.destination)
  ))
  expect(masterGains).toHaveLength(1)
  return masterGains[0] as FakeGainNode
}

describe('UI SFX player volume', () => {
  it('changes the shared master gain for sounds that are already playing', () => {
    const { context, player } = setupPlayer()

    player.play('loading', { loop: true })
    const masterGain = getMasterGain(context)
    const firstSourceGain = context.gains[0] as FakeGainNode

    player.setVolume(0.35)

    expect(firstSourceGain.connections).toContain(masterGain)
    expect(masterGain.gain.events).toEqual([
      { type: 'cancel', time: 4 },
      { type: 'set', value: 1, time: 4 },
      { type: 'ramp', value: 0.35, time: 4.02 },
    ])

    player.play('success')
    const secondSourceGain = context.gains[2] as FakeGainNode
    expect(secondSourceGain.connections).toContain(masterGain)
    expect(getMasterGain(context)).toBe(masterGain)
  })

  it('keeps the last valid level when setVolume receives NaN', () => {
    const { context, player } = setupPlayer(0.6)

    player.play('loading', { loop: true })
    const masterGain = getMasterGain(context)
    player.setVolume(Number.NaN)

    expect(masterGain.gain.value).toBe(0.6)
    expect(masterGain.gain.events.at(-1)).toEqual({
      type: 'ramp',
      value: 0.6,
      time: 4.02,
    })
    expect(Number.isFinite(masterGain.gain.value)).toBe(true)
  })
})

describe('UI SFX playback policy', () => {
  it('reuses an active semantic loop instead of layering a duplicate', () => {
    const { context, player } = setupPlayer()

    const first = player.play('loading')
    const second = player.play('loading')

    expect(first).not.toBeNull()
    expect(second).toBe(first)
    expect(context.sources).toHaveLength(1)
  })

  it('restarts a repeated outcome instead of layering the same cue', () => {
    const { context, player } = setupPlayer()

    player.play('success')
    player.play('success')

    expect(context.sources).toHaveLength(2)
    expect(context.sources[0]?.stopTimes).toEqual([4.018])
    expect(context.sources[1]?.stopTimes).toEqual([])
  })

  it('rate-limits high-frequency semantic cues by default', () => {
    const { context, player } = setupPlayer()

    const first = player.play('hover')
    const second = player.play('hover')

    expect(second).toBe(first)
    expect(context.sources).toHaveLength(1)
  })

  it('bounds polyphony and starts the replacement only after the oldest one-shot retires', () => {
    const { context, player } = setupPlayer()
    const cues = ['hover', 'press', 'release', 'focus', 'select', 'success', 'error', 'notification', 'open'] as const

    for (const cue of cues) player.play(cue)

    expect(context.sources).toHaveLength(9)
    expect(context.sources[0]?.stopTimes).toEqual([4.018])
    expect(context.sources[8]?.startTimes).toEqual([4.018])
    expect(context.sources.slice(1).every((source) => source.stopTimes.length === 0)).toBe(true)
  })

  it('moves an active loop to a new pack without invalidating its handle', () => {
    const { context, player } = setupPlayer()
    const loop = player.play('loading')

    player.setPack('soft')

    expect(player.getPack()).toBe('soft')
    expect(context.sources).toHaveLength(2)
    expect(context.sources[0]?.stopTimes).toEqual([4.018])

    loop?.stop()
    expect(context.sources[1]?.stopTimes).toEqual([4.018])
  })
})

describe('UI SFX startup', () => {
  it('explicitly unlocks a suspended audio context from user intent', async () => {
    const { context, player } = setupPlayer()
    context.state = 'suspended'

    await expect(player.unlock()).resolves.toBe(true)
    expect(context.resumeCount).toBe(1)
  })

  it('preloads cooperatively instead of rendering a pack in the calling task', async () => {
    const { context, player } = setupPlayer()

    const preload = player.preload(['hover', 'success'])
    expect(context.bufferCount).toBe(0)

    await preload
    expect(context.bufferCount).toBe(2)
  })

  it('cancels cooperative preload work that is no longer needed', async () => {
    const { context, player } = setupPlayer()
    const controller = new AbortController()
    controller.abort()

    await player.preload(['hover', 'success'], { signal: controller.signal })

    expect(context.bufferCount).toBe(0)
  })

  it('restores and persists the user sound preference through an explicit storage adapter', () => {
    const context = new FakeAudioContext()
    const values = new Map<string, string>([
      ['product:sound', JSON.stringify({ pack: 'soft', volume: 0.35, enabled: false })],
    ])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const player = createUISFX({
      context: context as unknown as AudioContext,
      preferences: { storage, key: 'product:sound' },
    })

    expect(player.getPack()).toBe('soft')
    expect(player.getVolume()).toBe(0.35)
    expect(player.isEnabled()).toBe(false)
    expect(player.play('success')).toBeNull()

    player.setEnabled(true)
    player.setPack('zen')
    player.setVolume(0.2)

    expect(JSON.parse(values.get('product:sound') ?? '')).toEqual({
      pack: 'zen',
      volume: 0.2,
      enabled: true,
    })
  })
})
