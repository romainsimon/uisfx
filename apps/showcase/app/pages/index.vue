<script setup lang="ts">
import { definePageMeta, useHead, useRuntimeConfig, useSeoMeta } from '#imports'
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

definePageMeta({ alias: ['/ui-sound-design'] })

const pageTitle = 'UI Sound Design & Interface Sound Effects Library | UI SFX'
const pageDescription = 'Explore 780 open-source UI sound effects for web, mobile, SaaS, and games. Preview 10 styles, compare one-shots and loops, then install UI SFX.'
const runtimeConfig = useRuntimeConfig()
const siteUrl = String(runtimeConfig.public.siteUrl || '').replace(/\/$/, '')
const canonicalUrl = siteUrl ? `${siteUrl}/ui-sound-design` : undefined
const socialImage = siteUrl ? `${siteUrl}/og-ui-sound-design.png` : '/og-ui-sound-design.png'

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow',
  author: 'Yuki Capital',
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogImage: socialImage,
  ogImageAlt: 'UI SFX sound design library with ten sound styles and waveform previews',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: socialImage,
})

useHead({
  link: canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : [],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: 'UI SFX',
      codeRepository: 'https://github.com/romainsimon/uisfx',
      description: pageDescription,
      programmingLanguage: 'TypeScript',
      runtimePlatform: 'Web Audio API',
      license: 'https://opensource.org/license/mit',
      author: { '@type': 'Organization', name: 'Yuki Capital' },
      keywords: 'ui sound design, interface sound effects, ui sound effects, ui sounds, ux sound design',
    }),
  }],
})

const selectedPack = ref<PackName>('minimal')
const comparisonCue = ref<CueName>('success')
const category = ref<CategoryFilter>('all')
const playback = ref<PlaybackFilter>('all')
const query = ref('')
const muted = ref(false)
const activeCue = ref<CueName | null>(null)
const activePack = ref<PackName | null>(null)
const announcement = ref('Sound previews are ready')
const copied = ref(false)
const reducedMotion = ref(false)
const loopingCue = ref<CueName | null>(null)
const loopingPack = ref<PackName | null>(null)
const player = shallowRef<UISFXPlayer>()
let loopingSound: PlayingSFX | null = null
let activeTimer: ReturnType<typeof setTimeout> | undefined
let motionPreference: MediaQueryList | undefined
let syncMotionPreference: (() => void) | undefined

const selectedPackData = computed(() => PACKS.find((pack) => pack.name === selectedPack.value) ?? PACKS[0])
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
const categoryArtwork = (categoryName: CategoryName) => `/categories/${categoryName}.webp`
const isLoop = (cue: CueName) => getPlaybackMode(cue) === 'loop'
const isLooping = (cue: CueName, pack: PackName) => loopingCue.value === cue && loopingPack.value === pack
const playLabel = (cue: CueName, pack: PackName) => isLooping(cue, pack)
  ? `Stop ${cue} loop in the ${pack} feel`
  : `${isLoop(cue) ? 'Start' : 'Play'} ${cue} in the ${pack} feel`

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

function choosePack(pack: PackName) {
  selectedPack.value = pack
  play('select', pack)
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
  if (!muted.value) stopLoop()
  muted.value = !muted.value
  player.value?.setEnabled(!muted.value)
  announcement.value = muted.value ? 'Sound previews muted' : 'Sound previews enabled'
  if (!muted.value) play('toggle-on')
}

function onKeydown(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
  const index = event.key === '0' ? 9 : Number(event.key) - 1
  const pack = PACKS[index]
  if (pack) choosePack(pack.name)
}

onMounted(() => {
  player.value = createUISFX({ pack: selectedPack.value })
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMotionPreference = () => { reducedMotion.value = motionPreference?.matches ?? false }
  syncMotionPreference()
  motionPreference.addEventListener('change', syncMotionPreference)
  window.addEventListener('keydown', onKeydown)
})

watch(selectedPack, (pack) => player.value?.setPack(pack))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (syncMotionPreference) motionPreference?.removeEventListener('change', syncMotionPreference)
  stopLoop()
  if (activeTimer) clearTimeout(activeTimer)
  void player.value?.destroy()
})
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#sound-library">Skip to sound library</a>

    <header class="topbar">
      <a class="brand-link" href="#top" aria-label="UI SFX home"><UISFXMark compact /></a>
      <nav aria-label="Primary navigation">
        <a href="#compare">Compare</a>
        <a href="#sound-library">Library</a>
        <a href="#guide">Guide</a>
        <a href="#install">Install</a>
      </nav>
      <button class="mute-button" type="button" :aria-pressed="muted" @click="toggleMute">
        <span class="mute-button__light" aria-hidden="true" />
        {{ muted ? 'Sound off' : 'Sound on' }}
      </button>
    </header>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Open-source UI sound design library</p>
          <h1 id="hero-title">UI sound design,<br><em>ready to ship.</em></h1>
          <p class="hero-intro">A tiny, complete library of interface sound effects for web apps, mobile apps, SaaS, education, media, and games. Preview every UI sound in ten distinct sonic personalities.</p>
          <div class="hero-actions">
            <a class="primary-link" href="#sound-library">Explore all {{ CUES.length * PACKS.length }} sounds</a>
            <a class="text-link" href="#install">npm install uisfx <span aria-hidden="true">↘</span></a>
          </div>
        </div>

        <div class="sound-console" :style="{ '--pack-color': selectedPackData.color }">
          <div class="console-head">
            <span>UI SFX / FEEL SELECTOR</span>
            <span>01–10</span>
          </div>
          <button class="main-pad" type="button" aria-label="Play success preview" @click="play('success')">
            <span class="main-pad__ring" aria-hidden="true"><i /></span>
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
              @click="choosePack(pack.name)"
            >
              <span>{{ index + 1 }}</span>
              {{ pack.label }}
            </button>
          </div>
          <p class="console-note">Press keys 1–9 or 0 to switch feel</p>
        </div>
      </section>

      <section class="spec-strip" aria-label="Library specifications">
        <p><strong>{{ CUES.length }}</strong><span>semantic UI cues</span></p>
        <p><strong>{{ PACKS.length }}</strong><span>distinct feels</span></p>
        <p><strong>72</strong><span>brief one-shots</span></p>
        <p><strong>6</strong><span>seamless loops</span></p>
        <p><strong>CC0</strong><span>audio license</span></p>
      </section>

      <section id="compare" class="compare-section" aria-labelledby="compare-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">A/B the personality</p>
            <h2 id="compare-title">One event. Ten voices.</h2>
          </div>
          <label class="cue-select">
            <span>Comparison cue</span>
            <select v-model="comparisonCue">
              <option v-for="cue in CUES" :key="cue.name" :value="cue.name">{{ cue.label }}</option>
            </select>
          </label>
        </div>

        <div class="comparison-board">
          <button
            v-for="pack in PACKS"
            :key="pack.name"
            type="button"
            class="comparison-track"
            :class="{ playing: activeCue === comparisonCue && activePack === pack.name, looping: isLooping(comparisonCue, pack.name) }"
            :style="{ '--track-color': pack.color }"
            :aria-label="playLabel(comparisonCue, pack.name)"
            @click="play(comparisonCue, pack.name)"
          >
            <span class="comparison-track__top"><strong>{{ pack.label }}</strong><small>{{ cueDuration(pack.name, comparisonCue) }} s · {{ isLoop(comparisonCue) ? 'Loop' : 'One-shot' }}</small></span>
            <SFXWaveform :cue="comparisonCue" :pack="pack.name" :points="52" />
            <span class="comparison-track__foot">{{ pack.description }} <i aria-hidden="true">{{ isLooping(comparisonCue, pack.name) ? '■' : '▶' }}</i></span>
          </button>
        </div>
      </section>

      <section id="sound-library" class="library-section" aria-labelledby="library-title">
        <div class="library-heading">
          <div>
            <p class="eyebrow">780 open-source sounds</p>
            <h2 id="library-title">Interface sound effects for every product state.</h2>
          </div>
          <p>{{ selectedPackData.description }} <strong>{{ selectedPackData.bestFor }}.</strong></p>
        </div>

        <div class="category-showcase" aria-label="Illustrated interaction categories">
          <button
            v-for="item in CATEGORIES"
            :key="item.id"
            type="button"
            class="category-card"
            :class="{ active: category === item.id }"
            :aria-pressed="category === item.id"
            :style="{ backgroundImage: `url(${categoryArtwork(item.id)})` }"
            @click="category = item.id"
          >
            <span class="category-card__number">{{ String(CATEGORIES.findIndex((candidate) => candidate.id === item.id) + 1).padStart(2, '0') }}</span>
            <span class="category-card__copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <span class="category-card__count">6 cues</span>
          </button>
        </div>

        <div class="library-tools">
          <div class="category-tabs" aria-label="Filter by interaction category">
            <button type="button" :aria-pressed="category === 'all'" @click="category = 'all'">All <span>{{ CUES.length }}</span></button>
            <button
              v-for="item in CATEGORIES"
              :key="item.id"
              type="button"
              :aria-pressed="category === item.id"
              @click="category = item.id"
            >{{ item.label }} <span>{{ CUES.filter((cue) => cue.category === item.id).length }}</span></button>
          </div>
          <div class="library-tools__right">
            <div class="playback-tabs" aria-label="Filter by playback behavior">
              <button type="button" :aria-pressed="playback === 'all'" @click="playback = 'all'">All</button>
              <button type="button" :aria-pressed="playback === 'one-shot'" @click="playback = 'one-shot'">One-shots</button>
              <button type="button" :aria-pressed="playback === 'loop'" @click="playback = 'loop'">Loops</button>
            </div>
            <label class="search-field">
              <span class="sr-only">Search sounds</span>
              <span aria-hidden="true">⌕</span>
              <input v-model="query" type="search" placeholder="Find a cue" autocomplete="off">
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
        <header class="guide-intro">
          <p class="eyebrow">Practical guide</p>
          <h2 id="guide-title">What is UI sound design?</h2>
          <p>UI sound design is the practice of giving interface events a clear, consistent audible response. A useful UI sound confirms what happened, communicates urgency, or makes a transition feel physical without competing with the screen. The goal is not to add noise to every tap. It is to build a small sound language that helps people understand a product more quickly.</p>
        </header>

        <div class="guide-principles">
          <article>
            <span>01</span>
            <h3>Start with intent</h3>
            <p>Name sounds after the product event, not the instrument used to make them. A semantic cue such as <code>success</code>, <code>warning</code>, or <code>message</code> survives a redesign. It also lets one event keep the same meaning while your team switches from a minimalist feel to a gamified one.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Use one-shots for outcomes</h3>
            <p>Brief interface sound effects work best for discrete outcomes: a button activates, a file drops, a payment succeeds, or an action fails. Keep them short enough to preserve momentum. UI SFX includes 72 one-shots, each rendered in ten styles, so product feedback can stay coherent across an entire flow.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Use loops for ongoing state</h3>
            <p>A loop communicates that work is still happening. Loading, processing, recording, and connecting sounds continue until the state resolves. Start the loop with the visual state, then stop it immediately on success, failure, or cancellation. Never leave an invisible audio process running in the background.</p>
          </article>
        </div>

        <div class="use-cases">
          <div>
            <p class="eyebrow">One system, many products</p>
            <h2>UI sounds for web apps, mobile apps, SaaS, and games</h2>
          </div>
          <div class="use-cases__copy">
            <p>Web and SaaS interfaces benefit from restrained confirmation, navigation, upload, notification, and collaboration sounds. Mobile apps need the same semantic clarity in a smaller attention window, with extra care around silent mode and interruption. Games can use the arcade or organic packs to add reward and personality while keeping menus and system feedback distinct from the soundtrack.</p>
            <p>UI SFX separates meaning from feel. Your code calls the same cue name everywhere, while a pack controls the sonic character. Minimal stays restrained, Soft feels reassuring, Glass adds polish, Arcade rewards play, Mechanical feels tactile, Organic adds warmth, Dreamy floats, Sci-fi scans, Rubber bounces, and Cinematic gives important moments scale.</p>
          </div>
        </div>

        <div class="questions" aria-labelledby="questions-title">
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

      <section id="install" class="install-section" aria-labelledby="install-title">
        <div class="install-copy">
          <p class="eyebrow">Zero dependencies</p>
          <h2 id="install-title">Give your product<br>a sound language.</h2>
          <p>Use live synthesis on the web or copy all 780 tiny MP3 and Ogg files into any native, game, or media project. One-shots end automatically. Loops return a control you stop when the interface state resolves.</p>
          <button class="install-command" type="button" @click="copyInstall">
            <span aria-hidden="true">$</span>
            <code>npm install uisfx</code>
            <strong>{{ copied ? 'Copied' : 'Copy' }}</strong>
          </button>
        </div>
        <div class="code-sample" aria-label="TypeScript usage example">
          <div class="code-sample__head"><span>app.ts</span><span>8 lines</span></div>
          <pre><span class="code-keyword">import</span> { createUISFX } <span class="code-keyword">from</span> <span class="code-string">'uisfx'</span>

<span class="code-keyword">const</span> ui = createUISFX({
  pack: <span class="code-string">'{{ selectedPack }}'</span>
})

ui.play(<span class="code-string">'success'</span>)
<span class="code-keyword">const</span> task = ui.play(<span class="code-string">'processing'</span>)
task?.stop()</pre>
          <button type="button" @click="play('success')">Run <span aria-hidden="true">▶</span></button>
        </div>
      </section>
    </main>

    <footer>
      <UISFXMark />
      <p>Sound should reinforce visible feedback, never replace it.</p>
      <div><span>MIT code</span><span>CC0 audio</span><span>Made by Yuki Capital</span></div>
    </footer>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
