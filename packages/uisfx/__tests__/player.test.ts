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

  connect(destination: unknown) {
    this.connections.push(destination)
    return destination as AudioNode
  }

  addEventListener() {}
  disconnect() {}
  start() {}
  stop() {}
}

class FakeAudioContext {
  readonly sampleRate = 8_000
  readonly currentTime = 4
  readonly state = 'running'
  readonly destination = { type: 'destination' }
  readonly gains: FakeGainNode[] = []
  readonly sources: FakeBufferSourceNode[] = []

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
