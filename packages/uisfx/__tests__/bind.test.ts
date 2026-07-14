import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindUISFX, type UISFXPlayer } from '../src'

class FakeElement {
  readonly dataset: Record<string, string>
  private readonly control: FakeElement

  constructor(dataset: Record<string, string> = {}, control?: FakeElement) {
    this.dataset = dataset
    this.control = control ?? this
  }

  closest(selector: string) {
    if (selector === '[data-uisfx-hover]' && this.control.dataset.uisfxHover) return this.control
    return null
  }
}

class FakePointerEvent {
  constructor(
    readonly target: FakeElement,
    readonly relatedTarget: FakeElement | null,
    readonly pointerType = 'mouse',
  ) {}
}

class FakeRoot {
  readonly listeners = new Map<string, (event: Event) => void>()

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.listeners.set(type, listener as (event: Event) => void)
  }

  removeEventListener(type: string) {
    this.listeners.delete(type)
  }

  emit(type: string, event: FakePointerEvent) {
    this.listeners.get(type)?.(event as unknown as Event)
  }
}

const originalElement = globalThis.Element
const originalPointerEvent = globalThis.PointerEvent

beforeEach(() => {
  Object.assign(globalThis, {
    Element: FakeElement,
    PointerEvent: FakePointerEvent,
  })
})

afterEach(() => {
  Object.assign(globalThis, {
    Element: originalElement,
    PointerEvent: originalPointerEvent,
  })
})

describe('bindUISFX hover semantics', () => {
  it('plays once when the pointer enters a control, not again between its descendants', () => {
    const play = vi.fn()
    const player = { play } as unknown as UISFXPlayer
    const root = new FakeRoot()
    const control = new FakeElement({ uisfxHover: 'hover' })
    const label = new FakeElement({}, control)
    const icon = new FakeElement({}, control)
    bindUISFX(root as unknown as HTMLElement, { player })

    root.emit('pointerover', new FakePointerEvent(label, null))
    root.emit('pointerover', new FakePointerEvent(icon, label))

    expect(play).toHaveBeenCalledTimes(1)
    expect(play).toHaveBeenCalledWith('hover')
  })
})
