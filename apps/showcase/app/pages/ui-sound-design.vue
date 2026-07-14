<script setup lang="ts">
import { useHead, useRuntimeConfig, useSeoMeta } from '#imports'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  CATEGORIES,
  CUES,
  PACKS,
  createUISFX,
  type CueName,
  type PackName,
  type PlayingSFX,
  type UISFXPlayer,
} from 'uisfx'

const runtimeConfig = useRuntimeConfig()
const siteUrl = String(runtimeConfig.public.siteUrl || 'https://uisfx.com').replace(/\/$/, '')
const canonicalUrl = `${siteUrl}/ui-sound-design`
const socialImage = `${siteUrl}/og-ui-sound-design-936.jpg`
const pageTitle = 'UI Sound Design Guide: Interface Sound Effects | UI SFX'
const pageDescription = 'Learn UI sound design from first principles. Plan, create, test, and implement accessible interface sound effects for web, mobile, SaaS, and games.'

const faqItems = [
  {
    question: 'What is UI sound design?',
    answer: 'UI sound design is the practice of creating an intentional audio language for interface events. It uses short sound effects and controlled loops to clarify actions, outcomes, urgency, progress, and product character.',
  },
  {
    question: 'When should an interface use sound?',
    answer: 'Use sound when it reduces uncertainty, confirms a meaningful outcome, calls attention to a relevant change, or makes an ongoing process easier to perceive. Routine, frequent, or already obvious actions often benefit from silence.',
  },
  {
    question: 'How long should a UI sound effect be?',
    answer: 'A UI sound should usually finish before it delays the next action. Frequent input sounds should be extremely brief, while success, warning, and transition cues can be slightly longer when their meaning needs a clear contour. Test duration in the real flow rather than in isolation.',
  },
  {
    question: 'How loud should interface sound effects be?',
    answer: 'Interface sounds should remain below speech, music, and primary media. Balance the library as one family, test on phones, laptops, and headphones at low system volume, and use timbre or rhythm instead of a large loudness jump to express urgency.',
  },
  {
    question: 'Are UI sounds accessible?',
    answer: 'They can reinforce feedback, but sound must never be the only way to understand a state. Pair audio with visible feedback or haptics, provide mute and volume controls, respect platform audio conventions, and remember the user preference.',
  },
  {
    question: 'What is the difference between a one-shot and a loop?',
    answer: 'A one-shot plays once for a discrete event such as select, success, or error. A loop continues while a state such as loading, recording, or connecting is active, then stops as soon as that state resolves or is cancelled.',
  },
  {
    question: 'Can UI sound effects be used in web, mobile, SaaS, and games?',
    answer: 'Yes, but the interaction frequency and platform context change the mix. SaaS tools usually need restraint, mobile apps must respect device audio expectations, and games can support more expressive feedback while keeping menu sounds distinct from music and world audio.',
  },
  {
    question: 'Can I use UI SFX commercially?',
    answer: 'Yes. UI SFX audio assets are released under CC0 and the TypeScript runtime is MIT licensed. You can use and adapt them in personal and commercial products.',
  },
] as const

const organizationId = `${siteUrl}/#organization`
const articleId = `${canonicalUrl}#article`

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  author: 'Yuki Capital',
  ogTitle: 'UI Sound Design: The Complete Guide to Interface Sound Effects',
  ogDescription: pageDescription,
  ogType: 'article',
  ogUrl: canonicalUrl,
  ogSiteName: 'UI SFX',
  ogLocale: 'en_US',
  ogImage: socialImage,
  ogImageSecureUrl: socialImage,
  ogImageType: 'image/jpeg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'UI SFX interface sound effects library and UI sound design guide',
  twitterCard: 'summary_large_image',
  twitterTitle: 'UI Sound Design: The Complete Guide',
  twitterDescription: pageDescription,
  twitterImage: socialImage,
  twitterImageAlt: 'UI SFX interface sound effects library and guide',
})

useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'alternate', href: `${siteUrl}/ui-sound-design.md`, type: 'text/markdown', title: 'UI SFX documentation in Markdown' },
    { rel: 'alternate', href: `${siteUrl}/llms.txt`, type: 'text/plain', title: 'UI SFX documentation for language models' },
  ],
  meta: [
    { name: 'googlebot', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { property: 'article:published_time', content: '2026-07-14T00:00:00+02:00' },
    { property: 'article:modified_time', content: '2026-07-14T00:00:00+02:00' },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': articleId,
          headline: 'UI Sound Design: A Complete Guide to Interface Sound Effects',
          description: pageDescription,
          url: canonicalUrl,
          mainEntityOfPage: canonicalUrl,
          image: { '@type': 'ImageObject', url: socialImage, width: 1200, height: 630 },
          datePublished: '2026-07-14',
          dateModified: '2026-07-14',
          inLanguage: 'en-US',
          author: { '@id': organizationId },
          publisher: { '@id': organizationId },
          about: ['UI sound design', 'Interface sound effects', 'UX sound design'],
          keywords: 'ui sound design, interface sound effects, ui sound effects, ui sounds, ux sound design',
        },
        {
          '@type': 'Organization',
          '@id': organizationId,
          name: 'Yuki Capital',
          url: 'https://yukicapital.com',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'UI SFX', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'UI sound design guide', item: canonicalUrl },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        },
      ],
    }),
  }],
})

const selectedPack = ref<PackName>('minimal')
const volume = ref(38)
const muted = ref(false)
const activeCue = ref<CueName | null>(null)
const loopingCue = ref<CueName | null>(null)
const player = shallowRef<UISFXPlayer>()
const reducedMotion = ref(false)
let loopSound: PlayingSFX | null = null
let activeTimer: ReturnType<typeof setTimeout> | undefined
let revealObserver: IntersectionObserver | undefined

const previewCues = [
  { name: 'select', label: 'Select', note: 'A choice becomes active.' },
  { name: 'success', label: 'Success', note: 'An action reaches its intended result.' },
  { name: 'error', label: 'Error', note: 'The action failed and needs attention.' },
  { name: 'notification', label: 'Notification', note: 'New information is available.' },
  { name: 'loading', label: 'Loading loop', note: 'A process remains active until stopped.' },
] as const satisfies readonly { name: CueName, label: string, note: string }[]

const categoryGroups = computed(() => CATEGORIES.map(category => ({
  ...category,
  cues: CUES.filter(cue => cue.category === category.id),
})))

function stopLoop() {
  loopSound?.stop()
  loopSound = null
  loopingCue.value = null
}

function playCue(cue: CueName) {
  if (!player.value || muted.value) return
  if (cue === 'loading' && loopingCue.value === cue) {
    stopLoop()
    activeCue.value = null
    return
  }

  if (cue === 'loading') {
    stopLoop()
    loopSound = player.value.play(cue)
    loopingCue.value = loopSound ? cue : null
  } else {
    player.value.play(cue)
  }

  activeCue.value = cue
  if (activeTimer) clearTimeout(activeTimer)
  activeTimer = setTimeout(() => {
    if (loopingCue.value !== cue) activeCue.value = null
  }, cue === 'loading' ? 900 : 760)
}

function toggleMute() {
  muted.value = !muted.value
  player.value?.setEnabled(!muted.value)
  if (muted.value) stopLoop()
  else playCue('toggle-on')
}

function handlePreviewHover(event: PointerEvent) {
  if (event.pointerType === 'touch' || muted.value || !player.value) return
  const target = event.target as HTMLElement | null
  const interactive = target?.closest('button, a, select, input')
  const previous = (event.relatedTarget as HTMLElement | null)?.closest?.('button, a, select, input')
  if (interactive && interactive !== previous) player.value.play('hover')
}

watch(volume, (next) => player.value?.setVolume(next / 100))
watch(selectedPack, (next) => {
  const shouldRestartLoop = loopingCue.value
  stopLoop()
  player.value?.setPack(next)
  if (shouldRestartLoop && !muted.value && player.value) {
    loopSound = player.value.play(shouldRestartLoop)
    loopingCue.value = loopSound ? shouldRestartLoop : null
  } else {
    playCue('select')
  }
})

onMounted(() => {
  player.value = createUISFX({ pack: selectedPack.value, volume: volume.value / 100 })
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  if (!reducedMotion.value) {
    revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 })
    document.querySelectorAll<HTMLElement>('[data-guide-reveal]').forEach(element => revealObserver?.observe(element))
  } else {
    document.querySelectorAll<HTMLElement>('[data-guide-reveal]').forEach(element => element.classList.add('is-visible'))
  }
})

onBeforeUnmount(() => {
  if (activeTimer) clearTimeout(activeTimer)
  revealObserver?.disconnect()
  stopLoop()
  void player.value?.destroy()
})
</script>

<template>
  <div class="guide-page" @pointerover="handlePreviewHover">
    <a class="guide-skip" href="#article">Skip to guide</a>

    <header class="guide-topbar">
      <a class="guide-brand" href="/" aria-label="UI SFX home"><UISFXMark compact /></a>
      <nav aria-label="Guide navigation">
        <a href="/#compare">Feels</a>
        <a href="/#sound-library">Sound library</a>
        <a href="#implementation">Implementation</a>
      </nav>
      <a class="guide-topbar__cta" href="https://github.com/romainsimon/uisfx" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
    </header>

    <main id="article">
      <header class="guide-hero">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">UI SFX</a><span aria-hidden="true">/</span><span>UI sound design</span>
        </nav>
        <p class="guide-kicker">The complete field guide</p>
        <h1>UI sound design:<br><em>interface sound effects</em> that make sense.</h1>
        <p class="guide-deck">A practical guide to deciding when sound belongs in an interface, turning product events into a coherent audio language, and shipping it accessibly across web, mobile, SaaS, and games.</p>
        <div class="guide-hero__actions">
          <a href="#listen">Hear the principles</a>
          <a href="/#sound-library">Explore all {{ CUES.length * PACKS.length }} sounds <span aria-hidden="true">↗</span></a>
        </div>
        <dl class="guide-facts" aria-label="Guide facts">
          <div><dt>Reading time</dt><dd>14 minutes</dd></div>
          <div><dt>Includes</dt><dd>Live audio examples</dd></div>
          <div><dt>Updated</dt><dd>July 2026</dd></div>
        </dl>
      </header>

      <div class="guide-layout">
        <aside class="guide-toc" aria-label="Table of contents">
          <p>In this guide</p>
          <ol>
            <li><a href="#definition">What UI sound design is</a></li>
            <li><a href="#listen">Hear meaning and feel</a></li>
            <li><a href="#when">When sound earns its place</a></li>
            <li><a href="#language">Build a sound language</a></li>
            <li><a href="#oneshots-loops">One-shots and loops</a></li>
            <li><a href="#principles">Design principles</a></li>
            <li><a href="#platforms">Web, mobile, SaaS, games</a></li>
            <li><a href="#accessibility">Accessibility</a></li>
            <li><a href="#implementation">Implementation</a></li>
            <li><a href="#workflow">Workflow and testing</a></li>
            <li><a href="#faq">Frequently asked questions</a></li>
          </ol>
        </aside>

        <article class="guide-article">
          <section id="definition" class="prose-section guide-opening" data-guide-reveal>
            <p class="section-label">Definition</p>
            <h2>What is UI sound design?</h2>
            <p class="lead">UI sound design is the practice of creating an intentional audio language for interface events. It translates actions and state changes into short, recognizable cues that help people understand what happened without demanding more visual attention.</p>
            <p>A useful interface sound can confirm a selection, signal success or failure, announce a message, make a spatial transition feel physical, or indicate that a process is still running. It is part of interaction design, not a decorative layer added after the product is finished.</p>
            <p>Sound design, music, and voice have different jobs. Sound design responds to events. Music establishes a broader emotional environment. Voice communicates language. A product may use all three, but mixing their roles makes the interface harder to read. A success cue should remain understandable even when the soundtrack is off and no voice is present.</p>

            <div class="definition-grid">
              <article><h3>Sound effect</h3><p>Brief feedback attached to an event, such as select, send, success, error, or unlock.</p></article>
              <article><h3>Loop</h3><p>Continuous feedback attached to a state, such as loading, recording, connecting, or streaming.</p></article>
              <article><h3>Sound language</h3><p>The shared rules that make every cue feel related and keep the same meaning throughout a product.</p></article>
            </div>

            <blockquote>
              <p>The best UI sound does not ask to be noticed. It makes the interface easier to trust.</p>
            </blockquote>
          </section>

          <section id="listen" class="listen-lab" data-guide-reveal aria-labelledby="listen-title">
            <div class="listen-lab__intro">
              <p class="section-label">Interactive example</p>
              <h2 id="listen-title">Hear meaning before style.</h2>
              <p>Each event keeps its meaning while the selected feel changes its material, weight, and personality. Start with a semantic event, then choose the sonic character that fits the product.</p>
            </div>

            <div class="listen-controls">
              <label>
                <span>Sound feel</span>
                <select v-model="selectedPack">
                  <option v-for="pack in PACKS" :key="pack.name" :value="pack.name">{{ pack.label }}: {{ pack.description }}</option>
                </select>
              </label>
              <label class="volume-field">
                <span>Preview volume <b>{{ muted ? 'Muted' : `${volume}%` }}</b></span>
                <input v-model.number="volume" type="range" min="0" max="100" step="1" aria-label="Preview volume">
              </label>
              <button type="button" class="mute-button" :aria-pressed="muted" @click="toggleMute">{{ muted ? 'Turn sound on' : 'Mute previews' }}</button>
            </div>

            <div class="cue-preview-grid">
              <button
                v-for="cue in previewCues"
                :key="cue.name"
                type="button"
                :class="{ 'is-active': activeCue === cue.name || loopingCue === cue.name }"
                :aria-pressed="cue.name === 'loading' ? loopingCue === cue.name : undefined"
                @click="playCue(cue.name)"
              >
                <span class="cue-preview__icon" aria-hidden="true">{{ cue.name === 'loading' && loopingCue === cue.name ? '■' : '▶' }}</span>
                <strong>{{ cue.label }}</strong>
                <small>{{ cue.note }}</small>
              </button>
            </div>
            <p class="listen-note">Browsers require a first tap or click before audio can start. The loading example loops until you stop it.</p>
          </section>

          <section id="when" class="prose-section" data-guide-reveal>
            <p class="section-label">Restraint</p>
            <h2>When sound earns its place</h2>
            <p class="lead">The first design decision is not which sound to use. It is whether the moment needs sound at all.</p>
            <p>Material Design describes sound as informative, honest, and reassuring, while also treating silence as an important part of the experience. That combination is the right test: audio belongs when it adds information, confidence, or continuity that the visual interface alone does not deliver as efficiently.</p>

            <div class="decision-table" role="region" aria-label="UI sound decision matrix" tabindex="0">
              <table>
                <thead><tr><th>Interaction</th><th>Frequency</th><th>Uncertainty</th><th>Sound approach</th></tr></thead>
                <tbody>
                  <tr><td>Hovering a toolbar</td><td>Very high</td><td>Low</td><td>Usually silent. Use only in highly tactile or game-like contexts.</td></tr>
                  <tr><td>Changing a setting</td><td>Medium</td><td>Medium</td><td>A tiny select or toggle cue can reinforce the state change.</td></tr>
                  <tr><td>Submitting important work</td><td>Low</td><td>High</td><td>Use distinct success and error outcomes.</td></tr>
                  <tr><td>Receiving a message</td><td>Variable</td><td>Medium</td><td>Use a gentle notification, governed by user preferences.</td></tr>
                  <tr><td>Recording or connecting</td><td>Ongoing state</td><td>High</td><td>Use a restrained loop only when the state matters off-screen.</td></tr>
                  <tr><td>Decorative motion</td><td>Variable</td><td>None</td><td>Keep it silent.</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Three questions before adding a cue</h3>
            <ol class="editorial-list">
              <li><strong>Does audio reduce uncertainty?</strong><span>If the person already sees an immediate, unmistakable result, sound may repeat rather than reinforce.</span></li>
              <li><strong>How often will it play?</strong><span>A cue heard once a day can be expressive. A cue heard fifty times an hour should be quiet, brief, or absent.</span></li>
              <li><strong>What happens when sound is unavailable?</strong><span>The interface must remain fully understandable when muted, in silent mode, or used with assistive technology.</span></li>
            </ol>
          </section>

          <section id="language" class="prose-section" data-guide-reveal>
            <p class="section-label">Information architecture</p>
            <h2>Build a semantic sound language</h2>
            <p class="lead">Name cues after what the product means, not what the sound resembles.</p>
            <p><code>success</code>, <code>error</code>, and <code>notification</code> remain useful when the brand changes. Names such as <code>bright-pluck-02</code> or <code>wood-tap-final</code> describe production choices, not product intent. A semantic layer lets designers change the feel without rewriting every integration.</p>
            <p>Begin with a small event inventory. Group related events, decide which ones need distinct meaning, and reuse a cue when the user should perceive two events as equivalent. Too many unique sounds are harder to learn and harder to maintain.</p>

            <div class="taxonomy-grid">
              <article v-for="group in categoryGroups" :key="group.id">
                <h3>{{ group.label }}</h3>
                <p>{{ group.description }}</p>
                <small>{{ group.cues.map(cue => cue.name).join(', ') }}</small>
              </article>
            </div>

            <h3>Meaning stays stable. Feel can change.</h3>
            <p>Pitch contour, rhythm, envelope, material, brightness, and spatial movement create personality. The semantic role should stay recognizable underneath those choices. An error may become a soft felt interruption in a wellness app or a sharp digital block in a game, but it should never resemble the product’s success cue.</p>
          </section>

          <section id="oneshots-loops" class="prose-section" data-guide-reveal>
            <p class="section-label">Playback model</p>
            <h2>One-shots mark events. Loops represent state.</h2>
            <div class="split-explainer">
              <article>
                <h3>Use one-shots for outcomes</h3>
                <p>A one-shot plays once and ends on its own. It fits discrete moments such as press, select, send, drop, success, error, complete, purchase, or unlock.</p>
                <ul>
                  <li>Make the attack legible without sounding aggressive.</li>
                  <li>Finish before the next likely action.</li>
                  <li>Keep related outcomes different in contour, not only in loudness.</li>
                  <li>Prevent dense repetition when rapid actions trigger the same cue.</li>
                </ul>
              </article>
              <article>
                <h3>Use loops for ongoing processes</h3>
                <p>A loop maps to a state with a beginning and an end. Loading, processing, recording, connecting, scanning, and streaming are common examples.</p>
                <ul>
                  <li>Start it when the state begins, not before.</li>
                  <li>Stop it on success, failure, cancellation, or navigation away.</li>
                  <li>Make the seam inaudible and keep rhythm stable across the boundary.</li>
                  <li>Prefer a visual progress indicator when audio adds no useful awareness.</li>
                </ul>
              </article>
            </div>
            <div class="state-flow" aria-label="Loop lifecycle">
              <span>Action starts</span><b aria-hidden="true">→</b><span>Loop begins</span><b aria-hidden="true">→</b><span>State resolves</span><b aria-hidden="true">→</b><span>Loop stops + outcome plays</span>
            </div>
          </section>

          <section id="principles" class="prose-section" data-guide-reveal>
            <p class="section-label">Craft</p>
            <h2>Seven principles for usable interface sound effects</h2>
            <ol class="principle-list">
              <li><div><strong>Clarify meaning</strong><span>Every cue should answer a product question: did it work, fail, move, arrive, or continue?</span></div></li>
              <li><div><strong>Design a hierarchy</strong><span>Frequent cues stay quiet and small. Rare, consequential outcomes can carry more shape and weight.</span></div></li>
              <li><div><strong>Keep the family coherent</strong><span>Share a palette of materials, envelopes, spatial rules, and tonal relationships across the library.</span></div></li>
              <li><div><strong>Use contrast for meaning</strong><span>Differentiate success from error through direction, rhythm, density, and timbre, not just volume.</span></div></li>
              <li><div><strong>Design for repetition</strong><span>Judge a hover, key, or selection cue after hearing it repeatedly in the real workflow.</span></div></li>
              <li><div><strong>Leave room for silence</strong><span>Sound becomes more useful when the product does not speak at every opportunity.</span></div></li>
              <li><div><strong>Test in context</strong><span>Balance cues against speech, media, notifications, device speakers, headphones, and environmental noise.</span></div></li>
            </ol>
          </section>

          <section id="platforms" class="prose-section" data-guide-reveal>
            <p class="section-label">Context</p>
            <h2>UI sound across web, mobile, SaaS, and games</h2>
            <div class="platform-grid">
              <article><h3>Web apps</h3><p>Browsers commonly block audio until a person interacts with the page. Initialize or resume audio from a user gesture, load only the cues needed for the first flow, and make mute and volume controls easy to find.</p></article>
              <article><h3>SaaS and productivity</h3><p>Frequency is the central constraint. Use restrained cues for important outcomes, collaboration, uploads, and background completion. Avoid sounding every keystroke, hover, save, and navigation step.</p></article>
              <article><h3>Mobile apps</h3><p>Respect silent mode, system volume, interruptions, and the expectations of each platform. Pair sound with visible state or haptics, and let people control optional feedback inside the app.</p></article>
              <article><h3>Games</h3><p>Menus can be more expressive, but interface audio still needs a hierarchy separate from music, dialogue, and world sound. Reward cues should scale with the achievement instead of making every tap feel equally important.</p></article>
            </div>
            <p>Apple’s guidance emphasizes user expectations around audio playback and consistency between haptic causes and effects. Microsoft’s interface sound guidance similarly recommends restraint, redundant visual feedback, and less obtrusive treatment for frequent events. The details vary by platform, but the principle is stable: the system belongs to the user.</p>
          </section>

          <section id="accessibility" class="prose-section accessibility-section" data-guide-reveal>
            <p class="section-label">Inclusive design</p>
            <h2>Sound must reinforce feedback, never replace it.</h2>
            <p class="lead">An interface should remain understandable, operable, and calm when audio is unavailable or unwanted.</p>
            <div class="accessibility-checklist">
              <label><input type="checkbox" checked disabled><span><strong>Provide an equivalent visual state.</strong> Show success, error, progress, and notification information on screen.</span></label>
              <label><input type="checkbox" checked disabled><span><strong>Offer mute and volume controls.</strong> Remember the preference and keep it independent from primary media when possible.</span></label>
              <label><input type="checkbox" checked disabled><span><strong>Avoid automatic audio.</strong> The W3C recommends user-requested playback, and WCAG requires controls for audio that starts automatically and continues.</span></label>
              <label><input type="checkbox" checked disabled><span><strong>Respect assistive technology.</strong> Do not bury spoken screen-reader output under frequent interface cues.</span></label>
              <label><input type="checkbox" checked disabled><span><strong>Use haptics as reinforcement.</strong> Keep cause and effect consistent and do not rely on vibration as the only channel.</span></label>
              <label><input type="checkbox" checked disabled><span><strong>Test sensory load.</strong> Repetition, sharp transients, unexpected sounds, and overlapping cues can become exhausting.</span></label>
            </div>
          </section>

          <section id="implementation" class="prose-section" data-guide-reveal>
            <p class="section-label">Engineering</p>
            <h2>Implement UI audio as a product system</h2>
            <p class="lead">Centralize sound behind semantic functions. Components should request meaning, while one audio layer handles packs, playback, volume, concurrency, and user preferences.</p>

            <pre class="code-block"><code><span>import</span> { createUISFX } <span>from</span> 'uisfx'

const ui = createUISFX({
  pack: 'minimal',
  volume: 0.35,
})

saveButton.addEventListener('click', async () =&gt; {
  const result = await saveDocument()
  ui.play(result.ok ? 'success' : 'error')
})

const task = ui.play('processing')
await renderProject()
task?.stop()
ui.play('complete')</code></pre>

            <h3>Web implementation checklist</h3>
            <ul class="implementation-list">
              <li><strong>Unlock audio from intent.</strong> Create or resume the audio context from a tap, click, or key action. Do not depend on autoplay.</li>
              <li><strong>Preload selectively.</strong> Prepare frequent cues after the first interaction, then defer the rest. Hundreds of files should not block the first render.</li>
              <li><strong>Control concurrency.</strong> Stop stale loops, limit repeated one-shots, and decide whether a new instance replaces or overlaps the previous one.</li>
              <li><strong>Model lifecycle explicitly.</strong> A loop must belong to a cancellable product state and stop during teardown or navigation.</li>
              <li><strong>Store preferences.</strong> Persist mute, volume, and optional pack choices without making sound a prerequisite for using the product.</li>
              <li><strong>Measure the real cost.</strong> Track asset bytes, decode time, main-thread work, and first-interaction latency on mobile hardware.</li>
            </ul>

            <div class="implementation-cta">
              <div><p>Open-source implementation</p><h3>78 semantic cues, 12 interchangeable feels, 936 tiny sounds.</h3></div>
              <div><code>npm install uisfx</code><a href="/">Preview the full library <span aria-hidden="true">↗</span></a></div>
            </div>
          </section>

          <section id="workflow" class="prose-section" data-guide-reveal>
            <p class="section-label">Process</p>
            <h2>A practical UI sound design workflow</h2>
            <ol class="workflow-list">
              <li><span>1</span><div><h3>Audit product events</h3><p>List interactions, outcomes, ongoing states, notifications, rewards, and system changes. Record frequency, importance, and existing visual feedback.</p></div></li>
              <li><span>2</span><div><h3>Choose moments, including silence</h3><p>Select only the events where audio improves comprehension, confidence, awareness, or character. Remove low-value repetition before composing.</p></div></li>
              <li><span>3</span><div><h3>Define semantic roles</h3><p>Create stable names such as select, success, error, warning, notification, complete, and processing. Document when each role should and should not be used.</p></div></li>
              <li><span>4</span><div><h3>Sketch relationships</h3><p>Design success and error together. Design open and close as a pair. Give progress steps a relationship to completion. A system is stronger than a folder of unrelated files.</p></div></li>
              <li><span>5</span><div><h3>Prototype inside real flows</h3><p>Wire rough cues into the interface early. Judge timing against visual feedback, network latency, animation, repeated use, media, and human speech.</p></div></li>
              <li><span>6</span><div><h3>Test with sound on and off</h3><p>Check comprehension, annoyance, recognition, and accessibility. Test phone speakers, laptops, headphones, quiet rooms, and noisy environments.</p></div></li>
              <li><span>7</span><div><h3>Integrate and govern</h3><p>Ship through a semantic API, publish usage rules, assign ownership, version the library, and review new cues as part of the design system.</p></div></li>
            </ol>
          </section>

          <section id="faq" class="prose-section faq-section" data-guide-reveal>
            <p class="section-label">FAQ</p>
            <h2>UI sound design questions</h2>
            <div class="faq-list">
              <details v-for="item in faqItems" :key="item.question">
                <summary>{{ item.question }}<span aria-hidden="true">+</span></summary>
                <p>{{ item.answer }}</p>
              </details>
            </div>
          </section>

          <section class="sources-section" data-guide-reveal aria-labelledby="sources-title">
            <p class="section-label">Primary sources</p>
            <h2 id="sources-title">Further reading</h2>
            <p>This guide synthesizes platform and accessibility guidance, then applies it to a reusable product workflow.</p>
            <ul>
              <li><a href="https://m2.material.io/design/sound/about-sound.html" target="_blank" rel="noopener noreferrer">Material Design: About sound <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://m2.material.io/design/sound/applying-sound-to-ui.html" target="_blank" rel="noopener noreferrer">Material Design: Applying sound to UI <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://design.google/library/ux-sound-haptic-material-design" target="_blank" rel="noopener noreferrer">Google Design: UX sound and haptics <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://developer.apple.com/design/human-interface-guidelines/playing-audio" target="_blank" rel="noopener noreferrer">Apple Human Interface Guidelines: Playing audio <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://developer.apple.com/design/human-interface-guidelines/playing-haptics" target="_blank" rel="noopener noreferrer">Apple Human Interface Guidelines: Playing haptics <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound" target="_blank" rel="noopener noreferrer">Microsoft: Sound interaction guidelines <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices" target="_blank" rel="noopener noreferrer">MDN: Web Audio API best practices <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay" target="_blank" rel="noopener noreferrer">MDN: Autoplay guide <span aria-hidden="true">↗</span></a></li>
              <li><a href="https://www.w3.org/WAI/WCAG20/Understanding/audio-control" target="_blank" rel="noopener noreferrer">W3C: Understanding audio control <span aria-hidden="true">↗</span></a></li>
            </ul>
          </section>

          <section class="guide-final-cta" data-guide-reveal>
            <p>From principles to playback</p>
            <h2>Hear every event in every feel.</h2>
            <p>Explore the complete open-source library, compare sonic personalities, and copy the implementation into your product.</p>
            <a href="/">Open the UI SFX playground <span aria-hidden="true">↗</span></a>
          </section>
        </article>
      </div>
    </main>

    <footer class="guide-footer">
      <a href="/" aria-label="UI SFX home"><UISFXMark /></a>
      <p>Sound should reinforce visible feedback, never replace it.</p>
      <nav aria-label="Footer navigation">
        <a href="/">Library</a>
        <a href="https://github.com/romainsimon/uisfx" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        <a href="https://www.npmjs.com/package/uisfx" target="_blank" rel="noopener noreferrer">npm ↗</a>
        <a href="/docs/agent-guide.md">Agent guide</a>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100vh;
  overflow-x: clip;
  background:
    radial-gradient(circle at 88% 6%, color-mix(in oklch, var(--accent) 8%, transparent) 0, transparent 23rem),
    var(--paper-light);
  color: var(--ink);
}

.guide-skip {
  position: fixed;
  z-index: 200;
  inset: 1rem auto auto 1rem;
  padding: .75rem 1rem;
  transform: translateY(-200%);
  background: var(--ink);
  color: var(--paper-light);
  font-weight: 700;
}

.guide-skip:focus { transform: none; }

.guide-topbar {
  position: sticky;
  z-index: 100;
  top: 0;
  width: min(100% - 2rem, 96rem);
  margin-inline: auto;
  padding: .85rem 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  background: color-mix(in oklch, var(--paper-light) 90%, transparent);
  backdrop-filter: blur(18px);
}

.guide-brand { width: fit-content; }
.guide-topbar nav { display: flex; gap: clamp(1rem, 3vw, 2.5rem); font-size: .88rem; font-weight: 700; }
.guide-topbar nav a, .guide-topbar__cta { transition: color 160ms ease; }
.guide-topbar nav a:hover, .guide-topbar__cta:hover { color: var(--accent-dark); }
.guide-topbar__cta { justify-self: end; font-size: .88rem; font-weight: 700; }

.guide-hero {
  width: min(100% - 2rem, 96rem);
  margin-inline: auto;
  padding: clamp(4rem, 8vw, 8rem) 0 clamp(4rem, 8vw, 7rem);
}

.breadcrumbs { display: flex; gap: .55rem; color: var(--ink-soft); font-size: .85rem; }
.breadcrumbs a { text-decoration: underline; text-underline-offset: .2em; }
.guide-kicker, .section-label { margin: 0; color: var(--accent-dark); font-size: .76rem; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
.guide-kicker { margin-top: clamp(4rem, 7vw, 7rem); }

.guide-hero h1 {
  max-width: 13.5ch;
  margin: 1rem 0 1.75rem;
  font-family: var(--font-display);
  font-size: clamp(3.6rem, 8.7vw, 9.5rem);
  font-weight: 700;
  letter-spacing: -.065em;
  line-height: .88;
}

.guide-hero h1 em { color: var(--accent); font-style: normal; }
.guide-deck { max-width: 48rem; margin: 0; color: var(--ink-soft); font-size: clamp(1.12rem, 2vw, 1.45rem); line-height: 1.55; }
.guide-hero__actions { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: .75rem; }
.guide-hero__actions a { padding: .85rem 1.1rem; border: 1px solid var(--ink); font-weight: 700; transition: transform 180ms var(--ease-out-quart), background-color 180ms ease, color 180ms ease; }
.guide-hero__actions a:first-child { background: var(--ink); color: var(--paper-light); }

.guide-facts { max-width: 48rem; margin: clamp(3rem, 6vw, 6rem) 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.guide-facts div { display: grid; gap: .15rem; }
.guide-facts dt { color: var(--ink-soft); font-size: .75rem; text-transform: uppercase; letter-spacing: .09em; }
.guide-facts dd { margin: 0; font-weight: 700; }

.guide-layout {
  width: min(100% - 2rem, 96rem);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 15rem minmax(0, 54rem);
  gap: clamp(3rem, 8vw, 8rem);
  justify-content: center;
  align-items: start;
}

.guide-toc { position: sticky; top: 6rem; padding: 1rem 0 4rem; }
.guide-toc p { margin: 0 0 .75rem; font-size: .78rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
.guide-toc ol { margin: 0; padding: 0; list-style: none; counter-reset: toc; }
.guide-toc li { counter-increment: toc; }
.guide-toc a { display: grid; grid-template-columns: 1.75rem 1fr; padding: .38rem 0; color: var(--ink-soft); font-size: .86rem; line-height: 1.25; }
.guide-toc a::before { content: counter(toc, decimal-leading-zero); color: var(--rule); font-variant-numeric: tabular-nums; }
.guide-toc a:hover { color: var(--accent-dark); }

.guide-article { min-width: 0; }
.prose-section, .listen-lab, .sources-section, .guide-final-cta { scroll-margin-top: 6rem; margin-bottom: clamp(6rem, 12vw, 11rem); }
[data-guide-reveal] { opacity: 0; transform: translateY(1.25rem); transition: opacity 620ms var(--ease-out-quart), transform 620ms var(--ease-out-quart); }
[data-guide-reveal].is-visible { opacity: 1; transform: none; }
.prose-section h2, .listen-lab h2, .sources-section h2, .guide-final-cta h2 { max-width: 15ch; margin: .7rem 0 1.5rem; font-size: clamp(2.65rem, 5vw, 5.25rem); letter-spacing: -.05em; line-height: .98; }
.prose-section h3 { margin: 2.5rem 0 .8rem; font-size: clamp(1.35rem, 2.2vw, 1.75rem); letter-spacing: -.025em; }
.prose-section > p, .sources-section > p { max-width: 44rem; color: var(--ink-soft); font-size: 1.08rem; line-height: 1.78; }
.prose-section .lead { color: var(--ink); font-size: clamp(1.22rem, 2.1vw, 1.55rem); line-height: 1.55; }
.prose-section code { padding: .1rem .32rem; background: var(--paper-deep); font-size: .9em; }

.definition-grid { margin-top: 3rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.definition-grid article { padding: 1.25rem; background: var(--paper); }
.definition-grid h3 { margin: 0 0 .45rem; font-size: 1rem; }
.definition-grid p { margin: 0; color: var(--ink-soft); font-size: .9rem; line-height: 1.55; }
blockquote { margin: 3rem 0 0; padding: 1.5rem 0 1.5rem clamp(1.25rem, 4vw, 3rem); border-left: .35rem solid var(--accent); }
blockquote p { max-width: 25ch; margin: 0; font-size: clamp(1.55rem, 3vw, 2.4rem); font-weight: 700; letter-spacing: -.035em; line-height: 1.15; }

.listen-lab { padding: clamp(1.5rem, 4vw, 3rem); background: var(--ink); color: var(--paper-light); box-shadow: 1rem 1rem 0 var(--paper-deep); }
.listen-lab__intro { max-width: 42rem; }
.listen-lab .section-label { color: color-mix(in oklch, var(--accent) 75%, white); }
.listen-lab h2 { max-width: 11ch; }
.listen-lab__intro > p:last-child { color: color-mix(in oklch, var(--paper-light) 68%, transparent); line-height: 1.7; }
.listen-controls { margin-top: 2rem; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(12rem, .8fr) auto; gap: .75rem; align-items: end; }
.listen-controls label { display: grid; gap: .55rem; font-size: .78rem; font-weight: 700; }
.listen-controls select, .listen-controls input, .mute-button { min-height: 3rem; }
.listen-controls select { width: 100%; padding: .6rem .75rem; border: 1px solid color-mix(in oklch, var(--paper-light) 35%, transparent); border-radius: 0; background: #302d29; color: var(--paper-light); }
.volume-field span { display: flex; justify-content: space-between; gap: 1rem; }
.volume-field b { color: color-mix(in oklch, var(--paper-light) 60%, transparent); }
.volume-field input { width: 100%; accent-color: var(--accent); cursor: pointer; }
.mute-button { padding-inline: 1rem; border: 1px solid color-mix(in oklch, var(--paper-light) 35%, transparent); background: transparent; color: inherit; cursor: pointer; font-weight: 700; }
.cue-preview-grid { margin-top: 1rem; display: grid; grid-template-columns: repeat(5, 1fr); gap: .5rem; }
.cue-preview-grid button { min-height: 9rem; padding: 1rem; display: grid; grid-template-rows: auto auto 1fr; align-content: start; gap: .45rem; border: 0; background: color-mix(in oklch, var(--paper-light) 8%, transparent); color: inherit; text-align: left; cursor: pointer; transition: transform 160ms var(--ease-out-quart), background-color 160ms ease; }
.cue-preview-grid button.is-active { background: var(--accent); color: white; transform: translateY(-4px); }
.cue-preview__icon { justify-self: end; font-size: .72rem; }
.cue-preview-grid strong { font-size: 1rem; }
.cue-preview-grid small { color: color-mix(in oklch, currentColor 68%, transparent); line-height: 1.35; }
.listen-note { margin: 1rem 0 0; color: color-mix(in oklch, var(--paper-light) 55%, transparent); font-size: .76rem; }

.decision-table { margin: 2.5rem 0; overflow-x: auto; }
.decision-table table { width: 100%; min-width: 42rem; border-collapse: collapse; }
.decision-table th, .decision-table td { padding: .9rem .75rem; border-bottom: 1px solid var(--rule); text-align: left; vertical-align: top; }
.decision-table th { color: var(--ink-soft); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; }
.decision-table td { font-size: .9rem; line-height: 1.45; }
.editorial-list, .principle-list { padding: 0; list-style: none; counter-reset: editorial; }
.editorial-list li { counter-increment: editorial; display: grid; grid-template-columns: minmax(12rem, .7fr) 1fr; gap: 1.5rem; padding: 1.1rem 0; border-bottom: 1px solid var(--rule); }
.editorial-list strong::before { content: counter(editorial, decimal-leading-zero) '  '; color: var(--accent-dark); }
.editorial-list span { color: var(--ink-soft); }

.taxonomy-grid { margin: 2.5rem 0 3.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: .7rem; }
.taxonomy-grid article { min-width: 0; padding: 1.15rem; background: var(--paper); }
.taxonomy-grid h3 { margin: 0 0 .25rem; font-size: 1rem; }
.taxonomy-grid p { margin: 0 0 .7rem; color: var(--ink-soft); font-size: .88rem; }
.taxonomy-grid small { display: block; overflow-wrap: anywhere; color: var(--accent-dark); font-size: .72rem; line-height: 1.45; }

.split-explainer { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.split-explainer article { padding: clamp(1.25rem, 3vw, 2rem); background: var(--paper); }
.split-explainer h3 { margin-top: 0; }
.split-explainer p, .split-explainer li { color: var(--ink-soft); line-height: 1.6; }
.split-explainer ul { padding-left: 1.2rem; }
.state-flow { margin-top: 1rem; padding: 1rem; display: flex; flex-wrap: wrap; gap: .7rem; align-items: center; justify-content: center; background: var(--ink); color: var(--paper-light); font-size: .84rem; font-weight: 700; }
.state-flow b { color: var(--accent); }

.principle-list { counter-reset: principle; }
.principle-list li { counter-increment: principle; padding: 1.3rem 0; display: grid; grid-template-columns: 4rem 1fr; border-bottom: 1px solid var(--rule); }
.principle-list li::before { content: counter(principle, decimal-leading-zero); color: var(--accent); font-size: 1.35rem; font-weight: 900; }
.principle-list div { display: grid; grid-template-columns: minmax(10rem, .6fr) 1fr; gap: 1.5rem; }
.principle-list span { color: var(--ink-soft); }

.platform-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.platform-grid article { padding: 1.5rem; background: var(--paper); }
.platform-grid h3 { margin-top: 0; }
.platform-grid p { margin-bottom: 0; color: var(--ink-soft); line-height: 1.65; }

.accessibility-section { padding: clamp(1.5rem, 5vw, 3.5rem); background: #ece5d4; }
.accessibility-checklist { margin-top: 2rem; display: grid; gap: .7rem; }
.accessibility-checklist label { padding: 1rem; display: grid; grid-template-columns: auto 1fr; gap: .9rem; align-items: start; background: color-mix(in oklch, white 48%, transparent); }
.accessibility-checklist input { margin-top: .28rem; accent-color: var(--accent); }
.accessibility-checklist span { color: var(--ink-soft); line-height: 1.55; }
.accessibility-checklist strong { color: var(--ink); }

.code-block { margin: 2.5rem 0; padding: clamp(1.2rem, 4vw, 2.5rem); overflow-x: auto; background: var(--ink); color: #f7efdf; font: .9rem/1.75 ui-monospace, SFMono-Regular, Menlo, monospace; }
.code-block code { user-select: text; }
.code-block::selection,
.code-block code::selection,
.code-block span::selection { background: #a83f2a; color: #fff8ed; text-shadow: none; }
.code-block span { color: #f68562; }
.implementation-list { margin: 1rem 0 3rem; padding: 0; list-style: none; }
.implementation-list li { padding: 1rem 0; border-bottom: 1px solid var(--rule); color: var(--ink-soft); line-height: 1.6; }
.implementation-list strong { color: var(--ink); }
.implementation-cta { padding: clamp(1.25rem, 4vw, 2.5rem); display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: end; background: var(--accent); color: white; }
.implementation-cta p { margin: 0 0 .4rem; font-size: .75rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
.implementation-cta h3 { max-width: 22ch; margin: 0; }
.implementation-cta > div:last-child { display: grid; gap: .75rem; justify-items: start; }
.implementation-cta code { padding: .6rem .75rem; background: var(--ink); color: var(--paper-light); white-space: nowrap; }
.implementation-cta a { font-weight: 800; text-decoration: underline; text-underline-offset: .2em; }

.workflow-list { margin: 2.5rem 0 0; padding: 0; list-style: none; }
.workflow-list li { display: grid; grid-template-columns: 3rem 1fr; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid var(--rule); }
.workflow-list > li > span { color: var(--accent); font-size: 1.5rem; font-weight: 900; }
.workflow-list h3 { margin: 0 0 .35rem; }
.workflow-list p { margin: 0; color: var(--ink-soft); line-height: 1.65; }

.faq-list { margin-top: 2rem; }
.faq-list details { border-bottom: 1px solid var(--rule); }
.faq-list summary { padding: 1.25rem 0; display: flex; justify-content: space-between; gap: 1rem; cursor: pointer; font-size: 1.05rem; font-weight: 700; list-style: none; }
.faq-list summary::-webkit-details-marker { display: none; }
.faq-list summary span { color: var(--accent); font-size: 1.4rem; transition: transform 160ms ease; }
.faq-list details[open] summary span { transform: rotate(45deg); }
.faq-list details p { margin: 0; padding: 0 2rem 1.25rem 0; color: var(--ink-soft); line-height: 1.7; }

.sources-section ul { margin: 2rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem; list-style: none; }
.sources-section a { height: 100%; padding: .9rem; display: block; background: var(--paper); font-size: .88rem; font-weight: 700; }
.sources-section a:hover { color: var(--accent-dark); }

.guide-final-cta { padding: clamp(2rem, 6vw, 5rem); background: var(--ink); color: var(--paper-light); }
.guide-final-cta > p { max-width: 38rem; color: color-mix(in oklch, var(--paper-light) 68%, transparent); line-height: 1.7; }
.guide-final-cta > p:first-child { color: #f68562; font-size: .75rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.guide-final-cta a { margin-top: 1rem; padding: .85rem 1.1rem; display: inline-block; background: var(--accent); color: white; font-weight: 800; }

.guide-footer { width: min(100% - 2rem, 96rem); margin-inline: auto; padding: 3rem 0; display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; }
.guide-footer p { color: var(--ink-soft); font-size: .84rem; }
.guide-footer nav { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: flex-end; font-size: .82rem; font-weight: 700; }

@media (hover: hover) and (pointer: fine) {
  .guide-hero__actions a:hover { transform: translateY(-3px); background: var(--accent-dark); color: white; }
  .cue-preview-grid button:hover { transform: translateY(-4px); background: color-mix(in oklch, var(--paper-light) 15%, transparent); }
  .cue-preview-grid button.is-active:hover { background: var(--accent); }
}

@media (max-width: 68rem) {
  .guide-layout { grid-template-columns: 1fr; }
  .guide-toc { position: static; padding: 1.25rem; background: var(--paper); }
  .guide-toc ol { display: grid; grid-template-columns: repeat(2, 1fr); column-gap: 1rem; }
  .listen-controls { grid-template-columns: 1fr 1fr; }
  .listen-controls > label:first-child { grid-column: 1 / -1; }
  .cue-preview-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 48rem) {
  .guide-topbar { grid-template-columns: 1fr auto; }
  .guide-topbar nav { display: none; }
  .guide-hero { padding-top: 2.5rem; }
  .guide-kicker { margin-top: 3rem; }
  .guide-hero h1 { max-width: 100%; font-size: clamp(3rem, 13.5vw, 4.8rem); }
  .guide-hero__actions a { max-width: 100%; font-size: .9rem; }
  .guide-facts { grid-template-columns: 1fr; }
  .guide-toc ol { grid-template-columns: 1fr; }
  .definition-grid, .taxonomy-grid, .split-explainer, .platform-grid, .sources-section ul { grid-template-columns: 1fr; }
  .listen-lab { box-shadow: .5rem .5rem 0 var(--paper-deep); }
  .listen-controls { grid-template-columns: 1fr; }
  .listen-controls > label:first-child { grid-column: auto; }
  .cue-preview-grid { grid-template-columns: repeat(2, 1fr); }
  .editorial-list li, .principle-list div { grid-template-columns: 1fr; gap: .4rem; }
  .principle-list li { grid-template-columns: 2.5rem 1fr; }
  .implementation-cta { grid-template-columns: 1fr; align-items: start; }
  .guide-footer { grid-template-columns: 1fr; align-items: start; }
  .guide-footer nav { justify-content: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  [data-guide-reveal] { opacity: 1; transform: none; transition: none; }
  .cue-preview-grid button, .guide-hero__actions a { transition: none; }
}
</style>
