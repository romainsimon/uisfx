<script setup lang="ts">
import { definePageMeta, useHead, useRuntimeConfig, useSeoMeta } from '#imports'
import { Volume2, VolumeX } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
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
const runtimeConfig = useRuntimeConfig()
const siteUrl = String(runtimeConfig.public.siteUrl || 'https://uisfx.com').replace(/\/$/, '')
const canonicalUrl = `${siteUrl}/ui-sound-design`
const socialImage = `${siteUrl}/og-ui-sound-design.png`
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
const softwareId = `${canonicalUrl}#software`

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  author: 'Yuki Capital',
  ogTitle: pageTitle,
  ogDescription: pageDescription,
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
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: socialImage,
  twitterImageAlt: 'UI SFX open-source interface sound effects library',
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
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
          softwareVersion: '0.2.0',
          downloadUrl: 'https://www.npmjs.com/package/uisfx',
          sameAs: [
            'https://github.com/romainsimon/uisfx',
            'https://www.npmjs.com/package/uisfx',
          ],
          releaseNotes: '858 interface sound effects across 11 interchangeable sound personalities.',
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
const muted = ref(false)
const activeCue = ref<CueName | null>(null)
const activePack = ref<PackName | null>(null)
const announcement = ref('Sound previews are ready')
const copied = ref(false)
const reducedMotion = ref(false)
const motionReady = ref(false)
const showPackDock = ref(false)
const loopingCue = ref<CueName | null>(null)
const loopingPack = ref<PackName | null>(null)
const player = shallowRef<UISFXPlayer>()
const siteShell = ref<HTMLElement>()
const soundConsole = ref<HTMLElement>()
let loopingSound: PlayingSFX | null = null
let logoLoopSound: PlayingSFX | null = null
let activeTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let syncMotionPreference: (() => void) | undefined
let revealObserver: IntersectionObserver | undefined
let consoleObserver: IntersectionObserver | undefined
let scrollFrame: number | undefined
let searchSoundTimer: ReturnType<typeof setTimeout> | undefined
let previousQuery = ''
let muteTransition = 0

const selectedPackData = computed(() => PACKS.find((pack) => pack.name === selectedPack.value) ?? PACKS[0])
const selectedPackTheme = computed(() => PACK_THEMES[selectedPack.value])
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

function setPackWithTransition(pack: PackName) {
  const update = () => { selectedPack.value = pack }
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }
  if (!reducedMotion.value && transitionDocument.startViewTransition) {
    void transitionDocument.startViewTransition(update).finished
  } else {
    update()
  }
}

function choosePack(pack: PackName) {
  setPackWithTransition(pack)
  play('select', pack)
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
  setPackWithTransition(pack)
  play(comparisonCue.value, pack)
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

function updateScrollProgress() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
    siteShell.value?.style.setProperty('--scroll-progress', String(progress))
    scrollFrame = undefined
  })
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

async function copyInstall() {
  const command = 'npm install uisfx'
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(command)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = command
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  copied.value = true
  play('success')
  window.setTimeout(() => { copied.value = false }, 1_800)
}

function toggleMute() {
  const transition = ++muteTransition
  if (!muted.value) {
    stopLogoLoop()
    stopLoop()
    const confirmation = player.value?.play('toggle-off')
    muted.value = true
    announcement.value = 'Sound previews muted'
    if (!confirmation) {
      player.value?.setEnabled(false)
      return
    }
    void confirmation.ended.then(() => {
      if (muted.value && transition === muteTransition) player.value?.setEnabled(false)
    })
    return
  }

  muted.value = false
  player.value?.setEnabled(true)
  announcement.value = 'Sound previews enabled'
  play('toggle-on')
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
  player.value = createUISFX({ pack: selectedPack.value })
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotionPreference = () => {
    reducedMotion.value = motionPreference?.matches ?? false
    if (reducedMotion.value) stopLogoLoop()
  }
  syncMotionPreference()
  motionPreference.addEventListener('change', syncMotionPreference)
  window.addEventListener('blur', stopLogoLoop)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
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

  consoleObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return
    showPackDock.value = !entry.isIntersecting && entry.boundingClientRect.bottom <= 96
  }, { threshold: 0, rootMargin: '-96px 0px 0px 0px' })
  if (soundConsole.value) consoleObserver.observe(soundConsole.value)
  window.requestAnimationFrame(() => { motionReady.value = true })
})

watch(selectedPack, (pack) => {
  stopLogoLoop()
  player.value?.setPack(pack)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', stopLogoLoop)
  window.removeEventListener('keydown', onKeydown)
  if (syncMotionPreference) motionPreference?.removeEventListener('change', syncMotionPreference)
  window.removeEventListener('scroll', updateScrollProgress)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  revealObserver?.disconnect()
  consoleObserver?.disconnect()
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  stopLogoLoop()
  stopLoop()
  if (activeTimer) clearTimeout(activeTimer)
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
    }"
    @click="onShellClick"
  >
    <div class="scroll-progress" aria-hidden="true"><i /></div>
    <a class="skip-link" href="#sound-library" data-sfx="forward">Skip to sound library</a>

    <header class="topbar">
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
        <button
          class="mute-button"
          type="button"
          data-sfx-managed
          :aria-label="muted ? 'Turn sound on' : 'Turn sound off'"
          :aria-pressed="muted"
          @click="toggleMute"
        >
          <span class="mute-button__light" aria-hidden="true" />
          <VolumeX v-if="muted" class="mute-button__icon" aria-hidden="true" />
          <Volume2 v-else class="mute-button__icon" aria-hidden="true" />
          <span class="mute-button__label">{{ muted ? 'Sound off' : 'Sound on' }}</span>
        </button>
      </div>
    </header>

    <Transition name="pack-dock">
      <aside
        v-if="showPackDock"
        class="pack-dock"
        :style="{
          '--dock-accent': selectedPackTheme.accent,
          '--dock-bg': selectedPackTheme.background,
          '--dock-ink': selectedPackTheme.ink,
        }"
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
      </aside>
    </Transition>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Open-source UI sound design library</p>
          <h1 id="hero-title">UI sound design,<br><em>ready to ship.</em></h1>
          <p class="hero-intro">A tiny, complete library of interface sound effects for web apps, mobile apps, SaaS, education, media, and games. Preview every UI sound in eleven distinct sonic personalities.</p>
          <div class="hero-actions">
            <a class="primary-link" href="#sound-library">Explore all {{ CUES.length * PACKS.length }} sounds</a>
            <div class="hero-ship">
              <button
                class="hero-install-command"
                :class="{ copied }"
                type="button"
                data-sfx-managed
                :aria-label="copied ? 'Install command copied' : 'Copy npm install uisfx command'"
                @click="copyInstall"
              >
                <span aria-hidden="true">$</span>
                <code>npm install uisfx</code>
                <strong aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</strong>
              </button>
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
          :style="{ '--pack-color': selectedPackData.color }"
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
            <p class="eyebrow">A/B the personality</p>
            <h2 id="compare-title">Eleven voices. Eleven visual worlds.</h2>
            <p class="section-deck">Every sound pack has its own artwork, palette, shape language, and sonic character. The semantic cue stays the same.</p>
          </div>
          <label class="cue-select">
            <span>Comparison cue</span>
            <select v-model="comparisonCue" @change="onComparisonCueChange">
              <option v-for="cue in CUES" :key="cue.name" :value="cue.name">{{ cue.label }}</option>
            </select>
          </label>
        </div>

        <div class="comparison-board" aria-label="Eleven sound personalities" data-reveal data-reveal-group>
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
            data-sfx-managed
            @click="previewPack(pack.name)"
          >
            <span class="voice-card__visual">
              <img
                :src="packTheme(pack.name).image"
                :alt="`${pack.label} UI sound theme artwork`"
                width="1200"
                height="800"
                loading="lazy"
                decoding="async"
              >
              <span class="voice-card__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="selectedPack === pack.name" class="voice-card__loaded">Loaded</span>
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

        <fieldset class="category-showcase" data-reveal data-reveal-group>
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

        <div class="guide-principles" data-reveal data-reveal-group>
          <article data-reveal-item>
            <span>01</span>
            <h3>Start with intent</h3>
            <p>Name sounds after the product event, not the instrument used to make them. A semantic cue such as <code>success</code>, <code>warning</code>, or <code>message</code> survives a redesign. It also lets one event keep the same meaning while your team switches from a minimalist feel to a gamified one.</p>
          </article>
          <article data-reveal-item>
            <span>02</span>
            <h3>Use one-shots for outcomes</h3>
            <p>Brief interface sound effects work best for discrete outcomes: a button activates, a file drops, a payment succeeds, or an action fails. Keep them short enough to preserve momentum. UI SFX includes 72 one-shots, each rendered in eleven styles, so product feedback can stay coherent across an entire flow.</p>
          </article>
          <article data-reveal-item>
            <span>03</span>
            <h3>Use loops for ongoing state</h3>
            <p>A loop communicates that work is still happening. Loading, processing, recording, and connecting sounds continue until the state resolves. Start the loop with the visual state, then stop it immediately on success, failure, or cancellation. Never leave an invisible audio process running in the background.</p>
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
          <button class="install-command" :class="{ copied }" type="button" data-sfx-managed @click="copyInstall">
            <span aria-hidden="true">$</span>
            <code>npm install uisfx</code>
            <strong>{{ copied ? 'Copied' : 'Copy' }}</strong>
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
