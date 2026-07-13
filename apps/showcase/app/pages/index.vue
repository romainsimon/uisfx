<script setup lang="ts">
import { definePageMeta, useHead, useRuntimeConfig, useSeoMeta } from '#imports'
import { Check, Copy as CopyIcon, Volume1, Volume2, VolumeX } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { buildAgentImplementationPrompt } from '../lib/agent-prompt'
import { planPackSwitch } from '../lib/pack-switch'
import {
  CATEGORIES,
  CUES,
  PACKS,
  createUISFX,
  createRecipe,
  getPlaybackMode,
  type CategoryName,
  type CueName,
  type PackName,
  type PlaybackMode,
  type UISFXPlayer,
  type PlayingSFX,
} from 'uisfx'

type CategoryFilter = CategoryName | 'all'
type PlaybackFilter = PlaybackMode | 'all'

const DEFAULT_PREVIEW_VOLUME = 70
const AUDIO_PREFERENCE_KEY = 'uisfx:preview-audio:v1'

interface PackTheme {
  image: string
  color: string
  background: string
  ink: string
  accent: string
}

const PACK_THEMES = {
  minimal: { image: '/packs/minimal.webp', color: '#e84d2a', background: '#f3ead7', ink: '#201d18', accent: '#e84d2a' },
  soft: { image: '/packs/soft.webp', color: '#d47b83', background: '#f4cbc2', ink: '#531d2a', accent: '#9f3045' },
  glass: { image: '/packs/glass.webp', color: '#4c8ca5', background: '#d8eef0', ink: '#073e4a', accent: '#0c7893' },
  arcade: { image: '/packs/arcade.webp', color: '#7257d9', background: '#33208e', ink: '#fff0c9', accent: '#ffd02e' },
  mechanical: { image: '/packs/mechanical.webp', color: '#68736f', background: '#cbc5b5', ink: '#242824', accent: '#e96314' },
  organic: { image: '/packs/organic.webp', color: '#718b4e', background: '#d8d2ae', ink: '#26351d', accent: '#4f867f' },
  dreamy: { image: '/packs/dreamy.webp', color: '#a36cad', background: '#d9bedb', ink: '#3d2344', accent: '#e58d74' },
  scifi: { image: '/packs/scifi.webp', color: '#20a29d', background: '#071f3d', ink: '#dcfff2', accent: '#32dbca' },
  rubber: { image: '/packs/rubber.webp', color: '#d99a24', background: '#ffd765', ink: '#19367a', accent: '#ed4a2f' },
  cinematic: { image: '/packs/cinematic.webp', color: '#3f5873', background: '#081521', ink: '#f4e5c5', accent: '#c99b45' },
  studio: { image: '/packs/studio.webp', color: '#6261a8', background: '#161724', ink: '#f2eadb', accent: '#9c91e6' },
} as const satisfies Record<PackName, PackTheme>

definePageMeta({ alias: ['/ui-sound-design'] })

const pageTitle = 'UI Sound Design: 858 Interface Sound Effects | UI SFX'
const pageDescription = 'Preview 858 open-source UI sound effects for web, mobile, SaaS, and games. Compare 11 sonic styles, one-shots, and seamless loops.'
const socialTitle = 'UI SFX: 858 Open-Source Interface Sound Effects'
const socialDescription = '78 semantic UI cues in 11 switchable feels. Preview, install, and ship clean one-shots and seamless loops for web, mobile, SaaS, and games.'
const runtimeConfig = useRuntimeConfig()
const siteUrl = String(runtimeConfig.public.siteUrl || 'https://uisfx.com').replace(/\/$/, '')
const canonicalUrl = `${siteUrl}/ui-sound-design`
// Keep a versioned filename so social crawlers cannot reuse an older broken card.
const socialImage = `${siteUrl}/og-ui-sound-design.png?v=858-20260713`
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
const softwareId = `${canonicalUrl}#software`
const audioLibraryId = `${canonicalUrl}#audio-library`

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  author: 'Yuki Capital',
  ogTitle: socialTitle,
  ogDescription: socialDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogSiteName: 'UI SFX',
  ogLocale: 'en_US',
  ogImage: socialImage,
  ogImageSecureUrl: socialImage,
  ogImageType: 'image/png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'UI SFX sound design library with eleven sound styles and waveform previews',
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: socialDescription,
  twitterImage: socialImage,
  twitterImageAlt: 'UI SFX open-source interface sound effects library',
})

useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'alternate', href: `${siteUrl}/llms.txt`, type: 'text/plain', title: 'UI SFX documentation for language models' },
    { rel: 'alternate', href: `${siteUrl}/ui-sound-design.md`, type: 'text/markdown', title: 'UI SFX documentation in Markdown' },
    { rel: 'alternate', href: `${siteUrl}/docs/agent-guide.md`, type: 'text/markdown', title: 'UI SFX coding-agent integration guide' },
  ],
  meta: [
    { name: 'googlebot', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': websiteId,
          url: siteUrl,
          name: 'UI SFX',
          alternateName: ['UISFX', 'UI Sound Effects'],
          description: pageDescription,
          inLanguage: 'en-US',
          publisher: { '@id': organizationId },
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Yuki Capital',
          url: 'https://yukicapital.com',
        },
        {
          '@type': 'SoftwareApplication',
          '@id': softwareId,
          name: 'UI SFX',
          url: canonicalUrl,
          image: socialImage,
          description: pageDescription,
          applicationCategory: 'DeveloperApplication',
          applicationSubCategory: 'UI sound design library',
          operatingSystem: 'Web, iOS, Android, desktop, and game engines',
          softwareVersion: '0.3.0',
          downloadUrl: 'https://www.npmjs.com/package/uisfx',
          sameAs: [
            'https://github.com/romainsimon/uisfx',
            'https://www.npmjs.com/package/uisfx',
          ],
          releaseNotes: 'A cleaner 858-sound library with redesigned Sci-fi and Rubber feels, distinct semantic gestures, and truly seamless loops.',
          featureList: [
            '78 semantic UI sound cues',
            '11 interchangeable sound styles',
            '72 one-shot interface sounds',
            '6 seamless UI sound loops',
            'MP3 and Ogg assets',
            'Web Audio API runtime synthesis',
          ],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          author: { '@id': organizationId },
          isPartOf: { '@id': websiteId },
          hasPart: { '@id': audioLibraryId },
          license: 'https://opensource.org/license/mit',
          keywords: 'ui sound design, interface sound effects, ui sound effects, ui sounds, ux sound design',
          dateModified: '2026-07-13',
        },
        {
          '@type': 'SoftwareSourceCode',
          name: 'UI SFX source code',
          url: canonicalUrl,
          codeRepository: 'https://github.com/romainsimon/uisfx',
          description: 'Open-source TypeScript runtime and CC0 audio library for interface sound design.',
          programmingLanguage: 'TypeScript',
          runtimePlatform: 'Web Audio API',
          license: 'https://opensource.org/license/mit',
          author: { '@id': organizationId },
          isPartOf: { '@id': softwareId },
        },
        {
          '@type': 'Dataset',
          '@id': audioLibraryId,
          name: 'UI SFX interface sound effects library',
          url: `${siteUrl}/uisfx-manifest.json`,
          description: 'A public-domain library of 858 generated interface sound effects across 78 semantic cues and 11 sonic styles.',
          creator: { '@id': organizationId },
          isPartOf: { '@id': softwareId },
          license: 'https://creativecommons.org/publicdomain/zero/1.0/',
          keywords: 'interface sound effects, ui sounds, ui sound design, sound effects dataset',
          dateModified: '2026-07-13',
          distribution: {
            '@type': 'DataDownload',
            encodingFormat: 'application/json',
            contentUrl: `${siteUrl}/uisfx-manifest.json`,
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'When should an interface use sound?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Use sound when it confirms a meaningful outcome, calls attention to a time-sensitive change, or makes an ongoing state easier to perceive. Avoid adding audio to routine pointer movement or every decorative animation.',
              },
            },
            {
              '@type': 'Question',
              name: 'How loud should UI sound effects be?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'UI sound effects should sit below speech, music, and primary media. Test them on laptop speakers, headphones, and phones at low system volume.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are UI sounds accessible?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Sound can reinforce feedback, but it must never be the only signal. Pair every cue with visible text, motion, color, or haptics and provide a mute control.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I use these UI sounds commercially?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. The generated audio files are released under CC0, and the TypeScript runtime is MIT licensed. Attribution is appreciated but not required.',
              },
            },
          ],
        },
      ],
    }),
  }],
})

const selectedPack = ref<PackName>('minimal')
const comparisonCue = ref<CueName>('success')
const demoCue = ref<CueName>('success')
const demoLoopCue = ref<CueName>('processing')
const category = ref<CategoryFilter>('all')
const playback = ref<PlaybackFilter>('all')
const query = ref('')
const volumePercent = ref(DEFAULT_PREVIEW_VOLUME)
const lastAudibleVolume = ref(DEFAULT_PREVIEW_VOLUME)
const volumeOpen = ref(false)
const muted = computed(() => volumePercent.value === 0)
const activeCue = ref<CueName | null>(null)
const activePack = ref<PackName | null>(null)
const announcement = ref('Sound previews are ready')
const copied = ref(false)
const installCopyFailed = ref(false)
const agentPromptCopied = ref(false)
const agentPromptCopyFailed = ref(false)
const reducedMotion = ref(false)
const motionReady = ref(false)
const selectorControlOwner = ref<'source' | 'dock' | 'none'>('source')
const selectorSurface = ref<'source' | 'handoff' | 'dock'>('source')
const loopingCue = ref<CueName | null>(null)
const loopingPack = ref<PackName | null>(null)
const player = shallowRef<UISFXPlayer>()
const siteShell = ref<HTMLElement>()
const topbar = ref<HTMLElement>()
const soundConsole = ref<HTMLElement>()
const packDock = ref<HTMLElement>()
const packHandoffShell = ref<HTMLElement>()
const selectorFocusParking = ref<HTMLElement>()
const volumeControl = ref<HTMLElement>()
const volumeTrigger = ref<HTMLButtonElement>()
let loopingSound: PlayingSFX | null = null
let logoLoopSound: PlayingSFX | null = null
let activeTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let syncMotionPreference: (() => void) | undefined
let revealObserver: IntersectionObserver | undefined
let selectorResizeObserver: ResizeObserver | undefined
let scrollFrame: number | undefined
let headerStyleState = ''
let installCopyTimer: number | undefined
let agentPromptCopyTimer: number | undefined
let searchSoundTimer: ReturnType<typeof setTimeout> | undefined
let previousQuery = ''
let parkedSelectorFocus = false
let selectorGeometry: {
  sourceWidth: number
  sourceHeight: number
  dockWidth: number
  dockHeight: number
  dockBottom: number
} | undefined

const selectedPackData = computed(() => PACKS.find((pack) => pack.name === selectedPack.value) ?? PACKS[0])
const selectedPackTheme = computed(() => PACK_THEMES[selectedPack.value])
const agentPromptUrl = computed(() => `/agent-prompt.txt?pack=${selectedPack.value}`)
const packDockInteractive = computed(() => selectorControlOwner.value === 'dock')
const sourceSelectorInteractive = computed(() => selectorControlOwner.value === 'source')
const demoOneShotGroups = CATEGORIES.map((item) => ({
  ...item,
  cues: CUES.filter((cue) => cue.category === item.id && getPlaybackMode(cue.name) === 'one-shot'),
})).filter((item) => item.cues.length > 0)
const demoLoopCues = CUES.filter((cue) => getPlaybackMode(cue.name) === 'loop')
const packTheme = (pack: PackName) => PACK_THEMES[pack]
const categoryCueCount = (categoryName: CategoryName) => CUES.filter((cue) => cue.category === categoryName).length
const filteredCues = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return CUES.filter((cue) => {
    const categoryMatches = category.value === 'all' || cue.category === category.value
    const playbackMatches = playback.value === 'all' || getPlaybackMode(cue.name) === playback.value
    const queryMatches = !needle || `${cue.name} ${cue.label} ${cue.description}`.toLowerCase().includes(needle)
    return categoryMatches && playbackMatches && queryMatches
  })
})

const cueDuration = (pack: PackName, cue: CueName) => createRecipe(pack, cue).duration.toFixed(2)
const isLoop = (cue: CueName) => getPlaybackMode(cue) === 'loop'
const isLooping = (cue: CueName, pack: PackName) => loopingCue.value === cue && loopingPack.value === pack
const playLabel = (cue: CueName, pack: PackName) => isLooping(cue, pack)
  ? `Stop ${cue} loop in the ${pack} feel`
  : `${isLoop(cue) ? 'Start' : 'Play'} ${cue} in the ${pack} feel`

function stopLogoLoop() {
  logoLoopSound?.stop()
  logoLoopSound = null
}

function startLogoLoop(event: PointerEvent) {
  if (
    event.pointerType === 'touch'
    || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    || muted.value
    || reducedMotion.value
    || loopingSound
    || logoLoopSound
    || !player.value
  ) return

  const sound = player.value.play('loading', { loop: true, volume: 0.045 })
  if (!sound) return

  logoLoopSound = sound
  void sound.ended.finally(() => {
    if (logoLoopSound === sound) logoLoopSound = null
  })
}

function stopLoop() {
  loopingSound?.stop()
  loopingSound = null
  loopingCue.value = null
  loopingPack.value = null
  activeCue.value = null
  activePack.value = null
}

function play(cue: CueName, pack: PackName = selectedPack.value) {
  if (!player.value || muted.value) return
  stopLogoLoop()
  if (isLooping(cue, pack)) {
    stopLoop()
    announcement.value = `Stopped ${cue} loop`
    return
  }
  stopLoop()
  player.value.setPack(pack)
  const playing = player.value.play(cue)
  player.value.setPack(selectedPack.value)
  if (isLoop(cue) && playing) {
    loopingSound = playing
    loopingCue.value = cue
    loopingPack.value = pack
  }
  if (!reducedMotion.value) {
    activeCue.value = cue
    activePack.value = pack
  }
  announcement.value = isLoop(cue)
    ? `Looping ${cue} in the ${pack} feel. Activate again to stop.`
    : `Playing ${cue} in the ${pack} feel`
  if (activeTimer) clearTimeout(activeTimer)
  if (!isLoop(cue)) {
    activeTimer = setTimeout(() => {
      activeCue.value = null
      activePack.value = null
    }, 900)
  }
}

function setPackWithTransition(pack: PackName, onSelected: () => void) {
  const update = () => {
    selectedPack.value = pack
    onSelected()
  }
  if (pack === selectedPack.value) {
    update()
    return
  }
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }
  if (!reducedMotion.value && transitionDocument.startViewTransition) {
    void transitionDocument.startViewTransition(update).finished
  } else {
    update()
  }
}

function switchPack(pack: PackName, previewCue: CueName, preserveActiveLoop = true) {
  setPackWithTransition(pack, () => {
    const plan = planPackSwitch({
      nextPack: pack,
      previewCue,
      activeLoop: loopingCue.value && loopingPack.value
        ? { cue: loopingCue.value, pack: loopingPack.value }
        : null,
      preserveActiveLoop,
    })

    if (plan.kind === 'keep-loop') {
      announcement.value = `Looping ${plan.cue} in the ${plan.pack} feel. Activate again to stop.`
      return
    }
    play(plan.cue, plan.pack)
  })
}

function choosePack(pack: PackName) {
  switchPack(pack, 'select')
}

function choosePackFromSelect(event: Event) {
  const value = event.target instanceof HTMLSelectElement ? event.target.value : ''
  const pack = PACKS.find((item) => item.name === value)
  if (pack) choosePack(pack.name)
}

function cueFromSelect(event: Event, mode: PlaybackMode) {
  const value = event.target instanceof HTMLSelectElement ? event.target.value : ''
  const cue = CUES.find((item) => item.name === value)
  return cue && getPlaybackMode(cue.name) === mode ? cue.name : undefined
}

function onDemoCueChange(event: Event) {
  const cue = cueFromSelect(event, 'one-shot')
  if (!cue) return
  demoCue.value = cue
  play('select')
}

function onDemoLoopChange(event: Event) {
  const cue = cueFromSelect(event, 'loop')
  if (!cue) return
  demoLoopCue.value = cue
  play('select')
}

function previewPack(pack: PackName) {
  switchPack(pack, comparisonCue.value, false)
}

function onShellClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  const control = target.closest<HTMLElement>('a, button')
  if (!control || control.closest('#patterns') || control.hasAttribute('data-sfx-managed')) return
  if (control instanceof HTMLButtonElement && control.disabled) return

  const requestedCue = control.dataset.sfx
  const cue = requestedCue && CUES.some((item) => item.name === requestedCue)
    ? requestedCue as CueName
    : control instanceof HTMLAnchorElement && control.target === '_blank'
      ? 'open'
      : control instanceof HTMLAnchorElement
        ? 'forward'
        : 'press'
  play(cue)
}

function onComparisonCueChange() {
  play('select')
}

function onSearchFocus() {
  play('focus')
}

function onSearchInput(event: Event) {
  const value = event.target instanceof HTMLInputElement ? event.target.value : query.value
  if (!value && previousQuery) {
    play('deselect')
  } else if (value && !searchSoundTimer) {
    play('typing')
    searchSoundTimer = setTimeout(() => { searchSoundTimer = undefined }, 420)
  }
  previousQuery = value
}

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function progressBetween(value: number, start: number, end: number) {
  return smoothstep((value - start) / (end - start))
}

function measureSelectorGeometry() {
  const source = soundConsole.value
  const dock = packDock.value
  if (!source || !dock) return undefined

  const dockStyle = window.getComputedStyle(dock)
  selectorGeometry = {
    sourceWidth: source.offsetWidth || 1,
    sourceHeight: source.offsetHeight || 1,
    dockWidth: dock.offsetWidth || 1,
    dockHeight: dock.offsetHeight || 1,
    dockBottom: Number.parseFloat(dockStyle.bottom) || 16,
  }

  const shell = packHandoffShell.value
  shell?.style.setProperty('--handoff-width', `${selectorGeometry.sourceWidth}px`)
  shell?.style.setProperty('--handoff-height', `${selectorGeometry.sourceHeight}px`)
  return selectorGeometry
}

function selectorFocusTarget(container: HTMLElement | undefined, docked: boolean) {
  if (!container) return undefined
  if (!docked) return container.querySelector<HTMLElement>('.pack-keys button.active') ?? undefined
  if (window.matchMedia('(max-width: 52rem)').matches) {
    return container.querySelector<HTMLElement>('.pack-dock__select select') ?? undefined
  }
  return container.querySelector<HTMLElement>('.pack-dock__keys button.active') ?? undefined
}

function setSelectorControlOwner(nextOwner: 'source' | 'dock' | 'none') {
  const currentOwner = selectorControlOwner.value
  if (currentOwner === nextOwner) return

  const outgoing = currentOwner === 'source' ? soundConsole.value : currentOwner === 'dock' ? packDock.value : undefined
  const incoming = nextOwner === 'source' ? soundConsole.value : nextOwner === 'dock' ? packDock.value : undefined
  const activeElement = document.activeElement
  const focusWasInOutgoing = activeElement instanceof HTMLElement && outgoing?.contains(activeElement)
  selectorControlOwner.value = nextOwner

  if (nextOwner === 'none') {
    if (!focusWasInOutgoing) return
    parkedSelectorFocus = true
    void nextTick(() => selectorFocusParking.value?.focus({ preventScroll: true }))
    return
  }

  const parkingControl = selectorFocusParking.value
  const shouldRestoreParkedFocus = parkedSelectorFocus && document.activeElement === parkingControl
  parkedSelectorFocus = false
  if (!focusWasInOutgoing && !shouldRestoreParkedFocus) return
  void nextTick(() => selectorFocusTarget(incoming, nextOwner === 'dock')?.focus({ preventScroll: true }))
}

function cancelSelectorFocusRestore() {
  parkedSelectorFocus = false
}

function updateScrollProgress() {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
    const source = soundConsole.value
    const dock = packDock.value
    const handoffShell = packHandoffShell.value
    const shell = siteShell.value
    const header = topbar.value
    const headerRawProgress = Math.min(1, Math.max(0, window.scrollY / 112))
    const headerProgress = reducedMotion.value
      ? Number(window.scrollY > 8)
      : smoothstep(headerRawProgress)
    const compactHeaderScale = reducedMotion.value ? 1 : window.innerWidth <= 832 ? 0.985 : 0.955
    const headerScale = 1 - (1 - compactHeaderScale) * headerProgress
    const headerShiftY = reducedMotion.value ? 0 : headerProgress * 2
    const nextHeaderStyleState = `${headerProgress.toFixed(4)}:${headerScale.toFixed(4)}:${headerShiftY.toFixed(2)}`
    // Read selector geometry before writing CSS variables so the scroll frame avoids a second layout pass.
    const geometry = selectorGeometry ?? measureSelectorGeometry()
    const sourceRect = source && dock && handoffShell && shell && geometry
      ? source.getBoundingClientRect()
      : undefined

    if (header && nextHeaderStyleState !== headerStyleState) {
      header.style.setProperty('--header-progress', headerProgress.toFixed(4))
      header.style.setProperty('--header-scale', headerScale.toFixed(4))
      header.style.setProperty('--header-shift-y', `${headerShiftY.toFixed(2)}px`)
      headerStyleState = nextHeaderStyleState
    }

    if (source && dock && handoffShell && shell && geometry && sourceRect) {
      const viewportHeight = window.innerHeight
      const handoffEnd = Math.max(80, Math.min(112, viewportHeight * 0.15))
      const handoffStart = Math.max(handoffEnd + 220, Math.min(680, viewportHeight * 0.72))
      const rawHandoff = Math.min(1, Math.max(0, (handoffStart - sourceRect.bottom) / (handoffStart - handoffEnd)))
      const handoff = smoothstep(rawHandoff)
      const sourceCenterX = sourceRect.left + sourceRect.width / 2
      const sourceCenterY = sourceRect.top + sourceRect.height / 2
      const dockCenterX = window.innerWidth / 2
      const dockCenterY = viewportHeight - geometry.dockBottom - geometry.dockHeight / 2
      const remainingTravel = 1 - handoff
      const sourceRotation = Number.parseFloat(source.style.getPropertyValue('--console-rotate')) || 1.1
      const currentCenterX = reducedMotion.value
        ? dockCenterX
        : sourceCenterX * remainingTravel + dockCenterX * handoff
      const currentCenterY = reducedMotion.value
        ? dockCenterY
        : sourceCenterY * remainingTravel + dockCenterY * handoff
      const dockStartScaleX = geometry.sourceWidth / geometry.dockWidth
      const dockStartScaleY = geometry.sourceHeight / geometry.dockHeight
      const dockScaleX = reducedMotion.value ? 1 : dockStartScaleX + (1 - dockStartScaleX) * handoff
      const dockScaleY = reducedMotion.value ? 1 : dockStartScaleY + (1 - dockStartScaleY) * handoff
      const shellScaleX = reducedMotion.value ? 1 : 1 + (geometry.dockWidth / geometry.sourceWidth - 1) * handoff
      const shellScaleY = reducedMotion.value ? 1 : 1 + (geometry.dockHeight / geometry.sourceHeight - 1) * handoff
      const rotation = reducedMotion.value ? 0 : sourceRotation * remainingTravel

      const sourceFade = reducedMotion.value ? handoff : progressBetween(handoff, 0, 0.1)
      const dockFade = reducedMotion.value ? handoff : progressBetween(handoff, 0.84, 1)
      const compactOpacity = reducedMotion.value ? handoff : progressBetween(handoff, 0.82, 1)
      const sourceOpacity = reducedMotion.value ? 1 - sourceFade : sourceFade < 1 ? 1 : 0
      const handoffShellOpacity = reducedMotion.value
        ? 0
        : sourceFade < 1
          ? sourceFade
          : dockFade < 1 ? 1 : 0

      shell.style.setProperty('--scroll-progress', String(progress))
      shell.style.setProperty('--selector-source-opacity', sourceOpacity.toFixed(4))
      dock.style.setProperty('--dock-travel-x', `${currentCenterX - dockCenterX}px`)
      dock.style.setProperty('--dock-travel-y', `${currentCenterY - dockCenterY}px`)
      dock.style.setProperty('--dock-scale-x', dockScaleX.toFixed(4))
      dock.style.setProperty('--dock-scale-y', dockScaleY.toFixed(4))
      dock.style.setProperty('--dock-rotation', `${rotation}deg`)
      dock.style.setProperty('--dock-opacity', dockFade.toFixed(4))
      dock.style.setProperty('--dock-content-opacity', compactOpacity.toFixed(4))
      dock.style.setProperty('--dock-content-scale-x', (1 / dockScaleX).toFixed(4))
      dock.style.setProperty('--dock-content-scale-y', (1 / dockScaleY).toFixed(4))

      handoffShell.style.setProperty('--handoff-x', `${currentCenterX - geometry.sourceWidth / 2}px`)
      handoffShell.style.setProperty('--handoff-y', `${currentCenterY - geometry.sourceHeight / 2}px`)
      handoffShell.style.setProperty('--handoff-scale-x', shellScaleX.toFixed(4))
      handoffShell.style.setProperty('--handoff-scale-y', shellScaleY.toFixed(4))
      handoffShell.style.setProperty('--handoff-rotation', `${rotation}deg`)
      handoffShell.style.setProperty('--handoff-opacity', handoffShellOpacity.toFixed(4))

      const nextSurface = reducedMotion.value
        ? dockFade >= 0.5 ? 'dock' : 'source'
        : sourceFade < 0.5 ? 'source' : dockFade < 0.5 ? 'handoff' : 'dock'
      if (selectorSurface.value !== nextSurface) selectorSurface.value = nextSurface

      const currentOwner = selectorControlOwner.value
      let nextOwner: 'source' | 'dock' | 'none' = 'none'
      if (reducedMotion.value) {
        if ((currentOwner === 'source' && handoff <= 0.45) || handoff <= 0.4) nextOwner = 'source'
        if ((currentOwner === 'dock' && handoff >= 0.55) || handoff >= 0.6) nextOwner = 'dock'
      } else {
        if ((currentOwner === 'source' && handoff <= 0.05) || handoff <= 0.04) nextOwner = 'source'
        if ((currentOwner === 'dock' && handoff >= 0.92) || handoff >= 0.94) nextOwner = 'dock'
      }
      setSelectorControlOwner(nextOwner)
    } else if (shell) {
      shell.style.setProperty('--scroll-progress', String(progress))
    }
    scrollFrame = undefined
  })
}

function onViewportResize() {
  selectorGeometry = undefined
  measureSelectorGeometry()
  updateScrollProgress()
}

function onConsolePointerMove(event: PointerEvent) {
  if (reducedMotion.value || event.pointerType === 'touch') return
  const element = event.currentTarget as HTMLElement
  const bounds = element.getBoundingClientRect()
  const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
  const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
  element.style.setProperty('--console-x', `${x * 7}px`)
  element.style.setProperty('--console-y', `${y * 5}px`)
  element.style.setProperty('--console-rotate', `${1.1 + x * 0.8}deg`)
}

function resetConsoleTilt(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement
  element.style.setProperty('--console-x', '0px')
  element.style.setProperty('--console-y', '0px')
  element.style.setProperty('--console-rotate', '1.1deg')
}

async function writeClipboard(value: string) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.inset = '0 auto auto -9999px'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
      previousFocus?.focus({ preventScroll: true })
    }
  }
}

async function copyInstall() {
  if (installCopyTimer) clearTimeout(installCopyTimer)
  copied.value = false
  installCopyFailed.value = false
  const didCopy = await writeClipboard('npm install uisfx')
  if (!didCopy) {
    installCopyFailed.value = true
    announcement.value = 'Could not copy the install command'
    play('error')
    installCopyTimer = window.setTimeout(() => { installCopyFailed.value = false }, 2_400)
    return
  }
  copied.value = true
  announcement.value = 'Install command copied'
  play('copy')
  installCopyTimer = window.setTimeout(() => {
    copied.value = false
    installCopyFailed.value = false
  }, 1_800)
}

async function copyAgentPrompt() {
  if (agentPromptCopyTimer) clearTimeout(agentPromptCopyTimer)
  agentPromptCopied.value = false
  agentPromptCopyFailed.value = false
  const didCopy = await writeClipboard(buildAgentImplementationPrompt(selectedPack.value))
  if (!didCopy) {
    agentPromptCopyFailed.value = true
    announcement.value = 'Could not copy the implementation prompt'
    play('error')
    agentPromptCopyTimer = window.setTimeout(() => { agentPromptCopyFailed.value = false }, 2_400)
    return
  }
  agentPromptCopied.value = true
  announcement.value = `${selectedPackData.value.label} implementation prompt copied`
  play('copy')
  agentPromptCopyTimer = window.setTimeout(() => {
    agentPromptCopied.value = false
    agentPromptCopyFailed.value = false
  }, 1_800)
}

function clampVolumePercent(value: unknown, fallback = DEFAULT_PREVIEW_VOLUME) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.max(0, Math.min(100, value)))
    : fallback
}

function restoreAudioPreference() {
  try {
    const value = window.localStorage.getItem(AUDIO_PREFERENCE_KEY)
    if (!value) return
    const saved = JSON.parse(value) as { volume?: unknown, lastAudibleVolume?: unknown }
    const restoredLastVolume = clampVolumePercent(saved.lastAudibleVolume)
    lastAudibleVolume.value = restoredLastVolume > 0 ? restoredLastVolume : DEFAULT_PREVIEW_VOLUME
    volumePercent.value = clampVolumePercent(saved.volume, lastAudibleVolume.value)
  } catch {
    // Storage can be unavailable in privacy modes. The in-memory preference still works.
  }
}

function persistAudioPreference() {
  try {
    window.localStorage.setItem(AUDIO_PREFERENCE_KEY, JSON.stringify({
      volume: volumePercent.value,
      lastAudibleVolume: lastAudibleVolume.value,
    }))
  } catch {
    // A blocked storage write should never block sound previews.
  }
}

function setPreviewVolume(value: number) {
  const nextVolume = clampVolumePercent(value, volumePercent.value)
  const wasMuted = muted.value

  if (nextVolume === 0) {
    if (!wasMuted) lastAudibleVolume.value = Math.max(1, volumePercent.value)
    stopLogoLoop()
    stopLoop()
    volumePercent.value = 0
    player.value?.setVolume(0)
    player.value?.setEnabled(false)
    return
  }

  volumePercent.value = nextVolume
  lastAudibleVolume.value = nextVolume
  player.value?.setVolume(nextVolume / 100)
  if (wasMuted) player.value?.setEnabled(true)
}

function onVolumeInput(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  setPreviewVolume(Number(event.target.value))
}

function onVolumeCommit() {
  persistAudioPreference()
  if (muted.value) {
    announcement.value = 'Sound previews muted'
    return
  }
  announcement.value = `Sound preview volume ${volumePercent.value} percent`
  player.value?.play('volume-change')
}

function toggleMute() {
  if (!muted.value) {
    lastAudibleVolume.value = Math.max(1, volumePercent.value)
    setPreviewVolume(0)
    persistAudioPreference()
    announcement.value = 'Sound previews muted'
    return
  }

  setPreviewVolume(lastAudibleVolume.value || DEFAULT_PREVIEW_VOLUME)
  persistAudioPreference()
  announcement.value = `Sound previews enabled at ${volumePercent.value} percent`
  player.value?.play('toggle-on')
}

function toggleVolumePanel() {
  volumeOpen.value = !volumeOpen.value
  if (!muted.value) player.value?.play(volumeOpen.value ? 'open' : 'close')
}

function closeVolumePanel(restoreFocus = false, withSound = true) {
  if (!volumeOpen.value) return
  volumeOpen.value = false
  if (withSound && !muted.value) player.value?.play('close')
  if (restoreFocus) void nextTick(() => volumeTrigger.value?.focus({ preventScroll: true }))
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!volumeOpen.value || !(event.target instanceof Node) || volumeControl.value?.contains(event.target)) return
  closeVolumePanel(false, false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return
  if (event.target instanceof HTMLElement && (event.target.matches('input, select, textarea') || event.target.isContentEditable)) return
  const index = event.key === '-' ? 10 : event.key === '0' ? 9 : Number(event.key) - 1
  const pack = PACKS[index]
  if (pack) choosePack(pack.name)
}

function onVisibilityChange() {
  if (document.hidden) stopLogoLoop()
}

onMounted(() => {
  restoreAudioPreference()
  player.value = createUISFX({
    pack: selectedPack.value,
    volume: volumePercent.value / 100,
    enabled: !muted.value,
  })
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotionPreference = () => {
    reducedMotion.value = motionPreference?.matches ?? false
    if (reducedMotion.value) stopLogoLoop()
    updateScrollProgress()
  }
  syncMotionPreference()
  motionPreference.addEventListener('change', syncMotionPreference)
  window.addEventListener('blur', stopLogoLoop)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  window.addEventListener('resize', onViewportResize, { passive: true })
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('visibilitychange', onVisibilityChange)
  updateScrollProgress()

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const element = entry.target as HTMLElement
      element.querySelectorAll<HTMLElement>('[data-reveal-item]').forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${Math.min(index, 9) * 55}ms`)
      })
      element.classList.add('is-revealed')
      revealObserver?.unobserve(element)
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' })
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => revealObserver?.observe(element))

  selectorResizeObserver = new ResizeObserver(() => {
    selectorGeometry = undefined
    measureSelectorGeometry()
    updateScrollProgress()
  })
  if (soundConsole.value) selectorResizeObserver.observe(soundConsole.value)
  if (packDock.value) selectorResizeObserver.observe(packDock.value)

  window.requestAnimationFrame(() => {
    motionReady.value = true
    updateScrollProgress()
  })
})

watch(selectedPack, (pack) => {
  stopLogoLoop()
  player.value?.setPack(pack)
  agentPromptCopied.value = false
  agentPromptCopyFailed.value = false
  if (agentPromptCopyTimer) clearTimeout(agentPromptCopyTimer)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', stopLogoLoop)
  window.removeEventListener('keydown', onKeydown)
  if (syncMotionPreference) motionPreference?.removeEventListener('change', syncMotionPreference)
  window.removeEventListener('scroll', updateScrollProgress)
  window.removeEventListener('resize', onViewportResize)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  revealObserver?.disconnect()
  selectorResizeObserver?.disconnect()
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
  stopLogoLoop()
  stopLoop()
  if (activeTimer) clearTimeout(activeTimer)
  if (installCopyTimer) clearTimeout(installCopyTimer)
  if (agentPromptCopyTimer) clearTimeout(agentPromptCopyTimer)
  if (searchSoundTimer) clearTimeout(searchSoundTimer)
  void player.value?.destroy()
})
</script>

<template>
  <div
    ref="siteShell"
    class="site-shell"
    :class="{ 'motion-ready': motionReady }"
    :data-pack="selectedPack"
    :style="{
      '--active-pack': selectedPackTheme.color,
      '--active-bg': selectedPackTheme.background,
      '--active-ink': selectedPackTheme.ink,
      '--active-accent': selectedPackTheme.accent,
      '--active-artwork': `url(${selectedPackTheme.image})`,
    }"
    @click="onShellClick"
  >
    <div class="scroll-progress" aria-hidden="true"><i /></div>
    <a class="skip-link" href="#sound-library" data-sfx="forward">Skip to sound library</a>

    <header ref="topbar" class="topbar">
      <a
        class="brand-link logo-sound-trigger"
        href="#top"
        data-sfx="back"
        aria-label="UI SFX home"
        @click="stopLogoLoop"
        @pointercancel="stopLogoLoop"
        @pointerenter="startLogoLoop"
        @pointerleave="stopLogoLoop"
      ><UISFXMark compact /></a>
      <nav aria-label="Primary navigation">
        <a href="#compare">Compare</a>
        <a href="#patterns">Examples</a>
        <a href="#sound-library">Library</a>
        <a href="#guide">Guide</a>
        <a href="#install">Install</a>
      </nav>
      <div class="topbar-actions">
        <a
          class="source-link"
          href="https://github.com/romainsimon/uisfx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX on GitHub (opens in a new tab)"
        >
          <SourceBrandIcon source="github" />
          <span class="source-link__label">GitHub</span>
          <span class="source-link__arrow" aria-hidden="true">↗</span>
        </a>
        <a
          class="source-link"
          href="https://www.npmjs.com/package/uisfx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX package on npm (opens in a new tab)"
        >
          <SourceBrandIcon source="npm" />
          <span class="source-link__label">npm</span>
          <span class="source-link__arrow" aria-hidden="true">↗</span>
        </a>
        <div
          ref="volumeControl"
          class="volume-control"
          :class="{ 'is-muted': muted, 'is-open': volumeOpen }"
          @keydown.esc.stop.prevent="closeVolumePanel(true)"
        >
          <button
            ref="selectorFocusParking"
            class="volume-control__mute"
            type="button"
            data-sfx-managed
            :aria-label="muted ? `Unmute sound previews at ${lastAudibleVolume} percent` : 'Mute sound previews'"
            :aria-pressed="muted"
            @click="toggleMute"
            @keydown="cancelSelectorFocusRestore"
            @pointerdown="cancelSelectorFocusRestore"
          >
            <VolumeX v-if="muted" class="volume-control__icon" aria-hidden="true" />
            <Volume1 v-else-if="volumePercent < 50" class="volume-control__icon" aria-hidden="true" />
            <Volume2 v-else class="volume-control__icon" aria-hidden="true" />
          </button>
          <button
            ref="volumeTrigger"
            class="volume-control__trigger"
            type="button"
            data-sfx-managed
            aria-controls="preview-volume-panel"
            :aria-expanded="volumeOpen"
            :aria-label="muted ? 'Adjust preview volume, currently muted' : `Adjust preview volume, ${volumePercent} percent`"
            @click="toggleVolumePanel"
            @keydown="cancelSelectorFocusRestore"
            @pointerdown="cancelSelectorFocusRestore"
          >
            <span>{{ muted ? 'Off' : `${volumePercent}%` }}</span>
          </button>
          <Transition name="volume-panel">
            <div
              v-if="volumeOpen"
              id="preview-volume-panel"
              class="volume-panel"
              role="group"
              aria-labelledby="preview-volume-label"
            >
              <div class="volume-panel__heading">
                <span id="preview-volume-label">Preview volume</span>
                <output for="preview-volume-range">{{ volumePercent }}%</output>
              </div>
              <label class="volume-panel__range">
                <span class="sr-only">Sound preview volume</span>
                <input
                  id="preview-volume-range"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  :value="volumePercent"
                  :style="{ '--volume-progress': `${volumePercent}%` }"
                  aria-label="Sound preview volume"
                  :aria-valuetext="muted ? 'Muted' : `${volumePercent} percent`"
                  @input="onVolumeInput"
                  @change="onVolumeCommit"
                >
              </label>
              <p>{{ muted ? `Muted. Unmute restores ${lastAudibleVolume}%.` : 'Applies to every preview and active loop.' }}</p>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <div
      ref="packHandoffShell"
      class="pack-handoff-shell"
      :style="{ 'view-transition-name': selectorSurface === 'handoff' ? 'sound-console' : 'none' }"
      aria-hidden="true"
    >
      <img
        class="pack-handoff-shell__artwork"
        :src="selectedPackTheme.image"
        alt=""
        width="1200"
        height="800"
      >
      <span class="pack-handoff-shell__veil" />
    </div>

    <aside
      ref="packDock"
      class="pack-dock"
      :class="{ 'is-interactive': packDockInteractive }"
      :style="{
        '--dock-accent': selectedPackTheme.accent,
        '--dock-bg': selectedPackTheme.background,
        '--dock-ink': selectedPackTheme.ink,
        'view-transition-name': selectorSurface === 'dock' ? 'sound-console' : 'none',
      }"
      :aria-hidden="!packDockInteractive"
      :inert="!packDockInteractive"
      aria-label="Persistent sound feel selector"
    >
      <img
        class="pack-dock__artwork"
        :src="selectedPackTheme.image"
        alt=""
        width="1200"
        height="800"
        aria-hidden="true"
      >
      <span class="pack-dock__veil" aria-hidden="true" />
      <div class="pack-dock__content">
        <div class="pack-dock__current">
          <span aria-hidden="true" />
          <small>Feel</small>
          <strong>{{ selectedPackData.label }}</strong>
        </div>
        <div class="pack-dock__keys" role="group" aria-label="Choose a sound feel">
          <button
            v-for="(pack, index) in PACKS"
            :key="`dock-${pack.name}`"
            type="button"
            data-sfx-managed
            :class="{ active: selectedPack === pack.name }"
            :aria-label="`Use ${pack.label} sound feel`"
            :aria-pressed="selectedPack === pack.name"
            :title="pack.label"
            :style="{
              '--dock-key': packTheme(pack.name).accent,
              '--dock-key-bg': packTheme(pack.name).background,
              '--dock-key-ink': packTheme(pack.name).ink,
            }"
            @click="choosePack(pack.name)"
          >
            <span class="pack-dock__key-label">{{ pack.label }}</span>
            <span class="pack-dock__key-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          </button>
        </div>
        <label class="pack-dock__select">
          <span class="sr-only">Choose a sound feel</span>
          <select :value="selectedPack" aria-label="Choose a sound feel" @change="choosePackFromSelect">
            <option v-for="pack in PACKS" :key="`dock-option-${pack.name}`" :value="pack.name">{{ pack.label }}</option>
          </select>
        </label>
      </div>
    </aside>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Open-source UI sound design library</p>
          <h1 id="hero-title">UI sound design,<br><em>ready to ship.</em></h1>
          <p class="hero-intro">A tiny, complete library of interface sound effects for web apps, mobile apps, SaaS, education, media, and games. Preview every UI sound in eleven distinct sonic personalities.</p>
          <div class="hero-actions">
            <a class="primary-link" href="#sound-library">Explore all {{ CUES.length * PACKS.length }} sounds</a>
            <div class="hero-ship">
              <div class="hero-install-block">
                <p class="hero-tool-label"><span>01</span> Install in your terminal <small>npm</small></p>
                <button
                  class="hero-install-command"
                  :class="{ copied, failed: installCopyFailed }"
                  type="button"
                  data-sfx-managed
                  :aria-label="installCopyFailed ? 'Copy failed. Try again.' : copied ? 'Install command copied' : 'Copy npm install uisfx command'"
                  @click="copyInstall"
                >
                  <span class="hero-install-command__prompt" aria-hidden="true">$</span>
                  <code>npm install <strong>uisfx</strong></code>
                  <span class="hero-install-command__action">
                    <span v-if="installCopyFailed" class="copy-status-icon" aria-hidden="true">!</span>
                    <Check v-else-if="copied" aria-hidden="true" />
                    <CopyIcon v-else aria-hidden="true" />
                    <b>{{ installCopyFailed ? 'Failed' : copied ? 'Copied' : 'Copy' }}</b>
                  </span>
                </button>
              </div>

              <div class="hero-agent-handoff">
                <div class="hero-agent-handoff__mark" aria-hidden="true"><i /><i /><i /></div>
                <div class="hero-agent-handoff__copy">
                  <p class="hero-tool-label"><span>02</span> Hand to your coding agent <small>{{ selectedPackData.label }} feel</small></p>
                  <strong>Instrument the whole product, tastefully.</strong>
                  <span>Copies a production-ready {{ selectedPackData.label }} prompt for every meaningful interaction and state.</span>
                </div>
                <div class="hero-agent-handoff__actions">
                  <button
                    class="hero-agent-copy"
                    :class="{ copied: agentPromptCopied, failed: agentPromptCopyFailed }"
                    type="button"
                    data-sfx-managed
                    :aria-label="agentPromptCopyFailed ? 'Copy failed. Try again.' : agentPromptCopied ? 'Implementation prompt copied' : `Copy UI SFX implementation prompt using the ${selectedPackData.label} feel`"
                    @click="copyAgentPrompt"
                  >
                    <span v-if="agentPromptCopyFailed" class="copy-status-icon" aria-hidden="true">!</span>
                    <Check v-else-if="agentPromptCopied" aria-hidden="true" />
                    <CopyIcon v-else aria-hidden="true" />
                    <span>{{ agentPromptCopyFailed ? 'Copy failed' : agentPromptCopied ? 'Prompt copied' : 'Copy agent prompt' }}</span>
                  </button>
                  <a :href="agentPromptUrl" target="_blank" rel="noopener noreferrer">Open prompt <span aria-hidden="true">↗</span></a>
                </div>
              </div>

              <nav class="hero-source-links" aria-label="UI SFX source and package links">
                <a
                  href="https://github.com/romainsimon/uisfx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SourceBrandIcon source="github" />
                  GitHub repository <span aria-hidden="true">↗</span>
                </a>
                <a
                  href="https://www.npmjs.com/package/uisfx"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SourceBrandIcon source="npm" />
                  npm package <span aria-hidden="true">↗</span>
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div
          ref="soundConsole"
          class="sound-console"
          :style="{
            '--pack-color': selectedPackData.color,
            'view-transition-name': selectorSurface === 'source' ? 'sound-console' : 'none',
          }"
          :aria-hidden="!sourceSelectorInteractive"
          :inert="!sourceSelectorInteractive"
          @pointermove="onConsolePointerMove"
          @pointerleave="resetConsoleTilt"
        >
          <img
            class="sound-console__backdrop"
            :src="selectedPackTheme.image"
            alt=""
            width="1200"
            height="800"
            fetchpriority="high"
            aria-hidden="true"
          >
          <span class="sound-console__veil" aria-hidden="true" />
          <div class="console-head">
            <span>UI SFX / FEEL SELECTOR</span>
            <span>01–11</span>
          </div>
          <button class="main-pad" type="button" data-sfx-managed :aria-label="`Play ${selectedPackData.label} success preview`" @click="play('success')">
            <span class="main-pad__art" aria-hidden="true">
              <i aria-hidden="true">▶</i>
            </span>
            <span class="main-pad__copy">
              <small>Now loaded</small>
              <strong>{{ selectedPackData.label }}</strong>
              <SFXWaveform cue="success" :pack="selectedPack" :points="28" />
            </span>
          </button>
          <div class="pack-keys" aria-label="Choose a feel">
            <button
              v-for="(pack, index) in PACKS"
              :key="pack.name"
              type="button"
              :class="{ active: selectedPack === pack.name }"
              :aria-pressed="selectedPack === pack.name"
              :style="{ '--key-color': packTheme(pack.name).accent }"
              data-sfx-managed
              @click="choosePack(pack.name)"
            >
              <span>{{ index + 1 }}</span>
              {{ pack.label }}
            </button>
          </div>
          <p class="console-note">Press keys 1–9, 0 or − to switch feel</p>
        </div>
      </section>

      <section class="spec-strip" aria-label="Library specifications" data-reveal data-reveal-group>
        <p data-reveal-item><strong>{{ CUES.length }}</strong><span>semantic UI cues</span></p>
        <p data-reveal-item><strong>{{ PACKS.length }}</strong><span>distinct feels</span></p>
        <p data-reveal-item><strong>72</strong><span>brief one-shots</span></p>
        <p data-reveal-item><strong>6</strong><span>seamless loops</span></p>
        <p data-reveal-item><strong>CC0</strong><span>audio license</span></p>
      </section>

      <section id="compare" class="compare-section" aria-labelledby="compare-title">
        <div class="section-heading" data-reveal>
          <div>
            <p class="eyebrow">Compare the feels</p>
            <h2 id="compare-title">Eleven feels. One sound language.</h2>
            <p class="section-deck">Choose any cue and hear it across every feel. The event stays the same. Only its sonic character changes.</p>
          </div>
          <label class="cue-select">
            <span>Comparison cue</span>
            <select v-model="comparisonCue" @change="onComparisonCueChange">
              <option v-for="cue in CUES" :key="cue.name" :value="cue.name">{{ cue.label }}</option>
            </select>
          </label>
        </div>

        <div class="comparison-board" aria-label="Eleven UI sound feels" data-reveal data-reveal-group>
          <button
            v-for="(pack, index) in PACKS"
            :key="pack.name"
            type="button"
            class="voice-card"
            :class="{ playing: activeCue === comparisonCue && activePack === pack.name, looping: isLooping(comparisonCue, pack.name), selected: selectedPack === pack.name }"
            :data-pack="pack.name"
            data-reveal-item
            :style="{
              '--theme-color': packTheme(pack.name).color,
              '--theme-bg': packTheme(pack.name).background,
              '--theme-ink': packTheme(pack.name).ink,
              '--theme-accent': packTheme(pack.name).accent,
            }"
            :aria-label="playLabel(comparisonCue, pack.name)"
            :aria-pressed="selectedPack === pack.name"
            data-sfx-managed
            @click="previewPack(pack.name)"
          >
            <span class="voice-card__visual">
              <img
                :src="packTheme(pack.name).image"
                alt=""
                width="1200"
                height="800"
                loading="lazy"
                decoding="async"
              >
              <span class="voice-card__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="selectedPack === pack.name" class="voice-card__loaded"><span aria-hidden="true">✓</span><span class="sr-only">Loaded</span></span>
            </span>
            <span class="voice-card__body">
              <span class="voice-card__top">
                <strong>{{ pack.label }}</strong>
                <small>{{ cueDuration(pack.name, comparisonCue) }} s · {{ isLoop(comparisonCue) ? 'Loop' : 'One-shot' }}</small>
              </span>
              <span class="voice-card__description">{{ pack.description }}</span>
              <SFXWaveform :cue="comparisonCue" :pack="pack.name" :points="44" />
              <span class="voice-card__foot">
                <b>{{ pack.bestFor }}</b>
                <i aria-hidden="true">{{ isLooping(comparisonCue, pack.name) ? '■' : '▶' }}</i>
              </span>
            </span>
          </button>
        </div>
      </section>

      <div data-reveal>
        <UISoundPatterns :pack-label="selectedPackData.label" :muted="muted" @play="play" />
      </div>

      <section id="sound-library" class="library-section" aria-labelledby="library-title">
        <div class="library-heading" data-reveal>
          <div>
            <p class="eyebrow">78 cues · 11 feels · 858 sounds</p>
            <h2 id="library-title">Interface sound effects for every product state.</h2>
          </div>
          <p>{{ selectedPackData.description }} <strong>{{ selectedPackData.bestFor }}.</strong></p>
        </div>

        <fieldset class="category-showcase" :data-pack="selectedPack" data-reveal data-reveal-group>
          <legend class="sr-only">Filter sounds by interaction category</legend>
          <span class="category-option" data-reveal-item>
            <input
              id="category-all"
              v-model="category"
              class="category-option__input"
              type="radio"
              name="sound-category"
              value="all"
              @change="play('select')"
            >
            <label class="category-card" for="category-all">
              <span class="category-card__number">All</span>
              <span class="category-card__copy">
                <strong>All sounds</strong>
                <small>Every interaction category in one view.</small>
              </span>
              <span class="category-card__count">{{ CUES.length }} cues</span>
            </label>
          </span>
          <span v-for="(item, index) in CATEGORIES" :key="item.id" class="category-option" data-reveal-item>
            <input
              :id="`category-${item.id}`"
              v-model="category"
              class="category-option__input"
              type="radio"
              name="sound-category"
              :value="item.id"
              @change="play('select')"
            >
            <label class="category-card" :for="`category-${item.id}`">
              <span class="category-card__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="category-card__copy">
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <span class="category-card__count">{{ categoryCueCount(item.id) }} cues</span>
            </label>
          </span>
        </fieldset>

        <div class="library-tools" data-reveal>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ filteredCues.length }} cues shown</p>
          <div class="library-tools__right">
            <div class="playback-tabs" role="group" aria-label="Filter by playback behavior">
              <button type="button" data-sfx="select" :aria-pressed="playback === 'all'" @click="playback = 'all'">All</button>
              <button type="button" data-sfx="select" :aria-pressed="playback === 'one-shot'" @click="playback = 'one-shot'">One-shots</button>
              <button type="button" data-sfx="select" :aria-pressed="playback === 'loop'" @click="playback = 'loop'">Loops</button>
            </div>
            <label class="search-field">
              <span class="sr-only">Search sounds</span>
              <span aria-hidden="true">⌕</span>
              <input v-model="query" type="search" placeholder="Find a cue" autocomplete="off" @focus="onSearchFocus" @input="onSearchInput">
            </label>
          </div>
        </div>

        <div class="cue-list" :style="{ '--pack-color': selectedPackData.color }">
          <button
            v-for="(cue, index) in filteredCues"
            :key="cue.name"
            type="button"
            class="cue-row"
            :class="{ playing: activeCue === cue.name && activePack === selectedPack, looping: isLooping(cue.name, selectedPack) }"
            :aria-label="playLabel(cue.name, selectedPack)"
            data-sfx-managed
            @click="play(cue.name)"
          >
            <span class="cue-row__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="cue-row__main">
              <strong>{{ cue.label }}</strong>
              <small>{{ cue.description }}</small>
            </span>
            <SFXWaveform :cue="cue.name" :pack="selectedPack" :points="34" />
            <span class="cue-row__meta"><b>{{ isLoop(cue.name) ? 'Loop' : 'One-shot' }}</b>{{ cueDuration(selectedPack, cue.name) }}s</span>
            <span class="cue-row__play" aria-hidden="true">{{ isLooping(cue.name, selectedPack) ? '■' : '▶' }}</span>
          </button>
          <p v-if="filteredCues.length === 0" class="empty-state">No cue matches these filters. Try another playback type, category, or interaction outcome such as success, drop, or mention.</p>
        </div>
      </section>

      <section id="guide" class="guide-section" aria-labelledby="guide-title">
        <header class="guide-intro" data-reveal>
          <p class="eyebrow">Practical guide</p>
          <h2 id="guide-title">What is UI sound design?</h2>
          <p>UI sound design is the practice of giving interface events a clear, consistent audible response. A useful UI sound confirms what happened, communicates urgency, or makes a transition feel physical without competing with the screen. The goal is not to add noise to every tap. It is to build a small sound language that helps people understand a product more quickly.</p>
        </header>

        <div
          class="guide-principles"
          :data-pack="selectedPack"
          data-reveal
          data-reveal-group
        >
          <article data-reveal-item>
            <div class="guide-card__surface">
              <span>01</span>
              <h3>Start with intent</h3>
              <p>Name sounds after the product event, not the instrument used to make them. A semantic cue such as <code>success</code>, <code>warning</code>, or <code>message</code> survives a redesign. It also lets one event keep the same meaning while your team switches from a minimalist feel to a gamified one.</p>
            </div>
          </article>
          <article data-reveal-item>
            <div class="guide-card__surface">
              <span>02</span>
              <h3>Use one-shots for outcomes</h3>
              <p>Brief interface sound effects work best for discrete outcomes: a button activates, a file drops, a payment succeeds, or an action fails. Keep them short enough to preserve momentum. UI SFX includes 72 one-shots, each rendered in eleven styles, so product feedback can stay coherent across an entire flow.</p>
            </div>
          </article>
          <article data-reveal-item>
            <div class="guide-card__surface">
              <span>03</span>
              <h3>Use loops for ongoing state</h3>
              <p>A loop communicates that work is still happening. Loading, processing, recording, and connecting sounds continue until the state resolves. Start the loop with the visual state, then stop it immediately on success, failure, or cancellation. Never leave an invisible audio process running in the background.</p>
            </div>
          </article>
        </div>

        <div class="use-cases" data-reveal>
          <div>
            <p class="eyebrow">One system, many products</p>
            <h2>UI sounds for web apps, mobile apps, SaaS, and games</h2>
          </div>
          <div class="use-cases__copy">
            <p>Web and SaaS interfaces benefit from restrained confirmation, navigation, upload, notification, and collaboration sounds. Mobile apps need the same semantic clarity in a smaller attention window, with extra care around silent mode and interruption. Games can use the arcade or organic packs to add reward and personality while keeping menus and system feedback distinct from the soundtrack.</p>
            <p>UI SFX separates meaning from feel. Your code calls the same cue name everywhere, while a pack controls the sonic character. Minimal stays restrained, Soft feels reassuring, Glass adds polish, Arcade rewards play, Mechanical feels tactile, Organic adds warmth, Dreamy floats, Sci-fi scans, Rubber bounces, and Cinematic gives important moments scale.</p>
          </div>
        </div>

        <div class="questions" aria-labelledby="questions-title" data-reveal>
          <div class="questions__heading">
            <p class="eyebrow">UI sound design questions</p>
            <h2 id="questions-title">Make sound useful, not noisy.</h2>
          </div>
          <div class="questions__list">
            <article>
              <h3>When should an interface use sound?</h3>
              <p>Use sound when it confirms a meaningful outcome, calls attention to a time-sensitive change, or makes an ongoing state easier to perceive. Avoid adding audio to routine pointer movement or every decorative animation. Repetition makes even a pleasant sound tiring, so prioritize moments where audio reduces uncertainty.</p>
            </article>
            <article>
              <h3>How loud should UI sound effects be?</h3>
              <p>They should sit below speech, music, and primary media. Test on laptop speakers, headphones, and a phone at low system volume. Normalize a library as a family, then adjust warnings and errors by character rather than relying on a large jump in loudness.</p>
            </article>
            <article>
              <h3>Are UI sounds accessible?</h3>
              <p>Sound can reinforce feedback for some people, but it must never be the only signal. Pair every cue with visible text, motion, color, or haptics as appropriate. Respect reduced motion where sound is synchronized with animation, expose a mute control, and remember the user’s preference.</p>
            </article>
            <article>
              <h3>Can I use these sounds commercially?</h3>
              <p>Yes. The generated audio files are released under CC0, and the TypeScript runtime is MIT licensed. You can use, edit, export, and redistribute the interface sound effects in personal or commercial products. Attribution is appreciated but not required.</p>
            </article>
          </div>
        </div>

        <p class="review-note">Designed and tested in Yuki Capital products. Library updated July 2026.</p>
      </section>

      <section id="install" class="install-section" aria-labelledby="install-title" data-reveal>
        <div class="install-copy">
          <p class="eyebrow">Zero dependencies</p>
          <h2 id="install-title">Give your product<br>a sound language.</h2>
          <p>Use live synthesis on the web or copy all 858 tiny MP3 and Ogg files into any native, game, or media project. One-shots end automatically. Loops return a control you stop when the interface state resolves.</p>
          <button class="install-command" :class="{ copied, failed: installCopyFailed }" type="button" data-sfx-managed @click="copyInstall">
            <span aria-hidden="true">$</span>
            <code>npm install uisfx</code>
            <strong>{{ installCopyFailed ? 'Copy failed' : copied ? 'Copied' : 'Copy' }}</strong>
          </button>
        </div>
        <div class="code-sample" role="group" aria-labelledby="code-sample-title">
          <div class="code-sample__head">
            <span id="code-sample-title">app.ts</span>
            <span class="code-sample__live"><i aria-hidden="true" />live example</span>
          </div>
          <pre><span class="code-keyword">import</span> { createUISFX } <span class="code-keyword">from</span> <span class="code-string">'uisfx'</span>

<span class="code-keyword">const</span> ui = createUISFX({
  pack: <span class="code-string" aria-hidden="true">'</span><label class="code-choice" :style="{ '--choice-width': `${selectedPack.length + 2}ch` }"><span class="sr-only">Choose a sound feel</span><select :value="selectedPack" @change="choosePackFromSelect"><option v-for="pack in PACKS" :key="`demo-pack-${pack.name}`" :value="pack.name">{{ pack.name }}</option></select></label><span class="code-string" aria-hidden="true">'</span>
})

ui.play(<span class="code-string" aria-hidden="true">'</span><label class="code-choice" :style="{ '--choice-width': `${demoCue.length + 2}ch` }"><span class="sr-only">Choose a one-shot sound</span><select :value="demoCue" @change="onDemoCueChange"><optgroup v-for="group in demoOneShotGroups" :key="`demo-group-${group.id}`" :label="group.label"><option v-for="cue in group.cues" :key="`demo-cue-${cue.name}`" :value="cue.name">{{ cue.name }}</option></optgroup></select></label><span class="code-string" aria-hidden="true">'</span>)
<span class="code-keyword">const</span> task = ui.play(<span class="code-string" aria-hidden="true">'</span><label class="code-choice" :style="{ '--choice-width': `${demoLoopCue.length + 2}ch` }"><span class="sr-only">Choose a looping sound</span><select :value="demoLoopCue" @change="onDemoLoopChange"><option v-for="cue in demoLoopCues" :key="`demo-loop-${cue.name}`" :value="cue.name">{{ cue.name }}</option></select></label><span class="code-string" aria-hidden="true">'</span>)
task?.stop()</pre>
          <div class="code-sample__actions">
            <p><span aria-hidden="true">↳</span> Change the green values, then run them.</p>
            <div>
              <button type="button" data-sfx-managed @click="play(demoCue)">Play {{ demoCue }} <span aria-hidden="true">▶</span></button>
              <button
                type="button"
                data-sfx-managed
                :aria-label="playLabel(demoLoopCue, selectedPack)"
                :aria-pressed="isLooping(demoLoopCue, selectedPack)"
                @click="play(demoLoopCue)"
              >{{ isLooping(demoLoopCue, selectedPack) ? 'Stop' : 'Loop' }} {{ demoLoopCue }} <span aria-hidden="true">{{ isLooping(demoLoopCue, selectedPack) ? '■' : '↻' }}</span></button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <a
        class="footer-brand logo-sound-trigger"
        href="#top"
        data-sfx="back"
        aria-label="Back to the top of UI SFX"
        @click="stopLogoLoop"
        @pointercancel="stopLogoLoop"
        @pointerenter="startLogoLoop"
        @pointerleave="stopLogoLoop"
      ><UISFXMark /></a>
      <p>Sound should reinforce visible feedback, never replace it.</p>
      <div class="footer-links">
        <a
          href="https://github.com/romainsimon/uisfx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX on GitHub (opens in a new tab)"
        >GitHub <span aria-hidden="true">↗</span></a>
        <a
          href="https://www.npmjs.com/package/uisfx"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX package on npm (opens in a new tab)"
        >npm <span aria-hidden="true">↗</span></a>
        <a
          href="/docs/agent-guide.md"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX coding-agent guide (opens in a new tab)"
        >Agent guide <span aria-hidden="true">↗</span></a>
        <a
          href="/llms.txt"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="UI SFX language-model index (opens in a new tab)"
        >llms.txt <span aria-hidden="true">↗</span></a>
        <span>MIT code</span>
        <span>CC0 audio</span>
        <a
          href="https://yukicapital.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Yuki Capital (opens in a new tab)"
        >Made by Yuki Capital <span aria-hidden="true">↗</span></a>
      </div>
    </footer>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
