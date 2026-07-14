import { createUISFX, type UISFXOptions, type UISFXPlayer } from './player'
import { cueNames, packNames, type CueName, type PackName } from './catalog'

export interface BindOptions extends UISFXOptions {
  player?: UISFXPlayer
}

export interface UISFXBinding {
  player: UISFXPlayer
  unbind: () => void
}

function isCue(value: string | undefined): value is CueName {
  return Boolean(value && cueNames.includes(value as CueName))
}

function isPack(value: string | undefined): value is PackName {
  return Boolean(value && packNames.includes(value as PackName))
}

function cueTargetFromEventTarget(target: EventTarget | null, attribute: string) {
  if (!(target instanceof Element)) return undefined
  const element = target.closest<HTMLElement>(`[${attribute}]`)
  const value = element?.dataset[attribute.replace('data-', '').replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())]
  return element && isCue(value) ? { element, cue: value } : undefined
}

function cueFromTarget(target: EventTarget | null, attribute: string) {
  return cueTargetFromEventTarget(target, attribute)?.cue
}

export function bindUISFX(root: Document | HTMLElement = document, options: BindOptions = {}): UISFXBinding {
  const player = options.player ?? createUISFX(options)

  const click = (event: Event) => {
    if (!(event.target instanceof Element)) return
    const element = event.target.closest<HTMLElement>('[data-uisfx]')
    const cue = element?.dataset.uisfx
    const pack = element?.dataset.uisfxPack
    if (isPack(pack)) player.setPack(pack)
    if (isCue(cue)) player.play(cue)
  }

  const pointerOver = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.pointerType === 'touch') return
    const current = cueTargetFromEventTarget(event.target, 'data-uisfx-hover')
    const previous = cueTargetFromEventTarget(event.relatedTarget, 'data-uisfx-hover')
    if (current && current.element !== previous?.element) player.play(current.cue)
  }

  const pointerDown = (event: Event) => {
    const cue = cueFromTarget(event.target, 'data-uisfx-press')
    if (cue) player.play(cue)
  }

  const pointerUp = (event: Event) => {
    const cue = cueFromTarget(event.target, 'data-uisfx-release')
    if (cue) player.play(cue)
  }

  root.addEventListener('click', click)
  root.addEventListener('pointerover', pointerOver)
  root.addEventListener('pointerdown', pointerDown)
  root.addEventListener('pointerup', pointerUp)

  return {
    player,
    unbind() {
      root.removeEventListener('click', click)
      root.removeEventListener('pointerover', pointerOver)
      root.removeEventListener('pointerdown', pointerDown)
      root.removeEventListener('pointerup', pointerUp)
    },
  }
}
