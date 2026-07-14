<script setup lang="ts">
import { computed, ref } from 'vue'
import { emptySponsorsData, type Sponsor, type SponsorsData } from '~/lib/sponsors'

const emit = defineEmits<{ sound: [cue: 'open' | 'reward'] }>()
const { data, status } = await useLazyFetch<SponsorsData>('/api/sponsors', {
  default: emptySponsorsData,
  server: false,
})

const seats = computed(() => {
  const byTier = data.value?.tiers ?? emptySponsorsData().tiers
  return [
    ...Array.from({ length: 2 }, (_, index) => ({ tier: 'premier' as const, sponsor: byTier.premier[index] })),
    ...Array.from({ length: 4 }, (_, index) => ({ tier: 'sponsor' as const, sponsor: byTier.sponsor[index] })),
  ]
})
const logoSponsorCount = computed(() => seats.value.filter(seat => seat.sponsor).length)
const brokenLogos = ref(new Set<string>())
const identity = (sponsor: Sponsor) => sponsor.github || sponsor.url
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
const canShowLogo = (sponsor: Sponsor) => Boolean(sponsor.logo) && !brokenLogos.value.has(identity(sponsor))
function hideBrokenLogo(sponsor: Sponsor) {
  brokenLogos.value = new Set(brokenLogos.value).add(identity(sponsor))
}
</script>

<template>
  <section id="sponsors" class="sponsors-section" aria-labelledby="sponsors-title" data-reveal>
    <div class="sponsors-copy">
      <h2 id="sponsors-title">Keep the tiny sounds free.</h2>
      <p>Sponsorship funds careful maintenance, new feels, and cleaner loops. The code stays MIT. Every sound stays CC0.</p>
      <SponsorButton wide @activate="emit('sound', 'reward')" />
      <p class="sponsors-sync">
        <span aria-hidden="true"><i /><i /><i /></span>
        {{ status === 'pending' ? 'Checking GitHub Sponsors' : 'Synced automatically with GitHub Sponsors' }}
      </p>
    </div>

    <div class="sponsor-board" :class="{ 'sponsor-board--live': logoSponsorCount }" :aria-busy="status === 'pending'" aria-label="UI SFX sponsors">
      <template v-for="(seat, index) in seats" :key="`${seat.tier}-${index}`">
        <a
          v-if="seat.sponsor"
          class="sponsor-seat sponsor-seat--filled"
          :class="{ 'sponsor-seat--wide': seat.tier === 'premier' }"
          :href="seat.sponsor.url"
          target="_blank"
          rel="sponsored noopener"
          :aria-label="`${seat.sponsor.name}, ${seat.tier} sponsor (opens in a new tab)`"
          data-sfx-managed
          @click="emit('sound', 'open')"
        >
          <img v-if="canShowLogo(seat.sponsor)" :src="seat.sponsor.logo" :alt="`${seat.sponsor.name} logo`" loading="lazy" decoding="async" @error="hideBrokenLogo(seat.sponsor)">
          <span v-else class="sponsor-seat__fallback" aria-hidden="true">{{ initials(seat.sponsor.name) }}</span>
          <span class="sr-only">{{ seat.sponsor.name }}</span>
        </a>

        <a
          v-else
          class="sponsor-seat sponsor-seat--empty"
          :class="{ 'sponsor-seat--wide': seat.tier === 'premier' }"
          href="https://github.com/sponsors/romainsimon"
          target="_blank"
          rel="sponsored noopener"
          data-sfx-managed
          :aria-label="`Claim an open UI SFX ${seat.tier} sponsor spot (opens in a new tab)`"
          @click="emit('sound', 'reward')"
        >
          <span class="sponsor-seat__wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <strong>Your logo</strong>
          <small>{{ seat.tier === 'premier' ? 'Featured sponsor spot' : 'Sponsor spot' }}</small>
        </a>
      </template>
    </div>
  </section>
</template>

<style scoped>
.sponsors-section {
  width: min(100% - 2 * clamp(1rem, 4vw, 4rem), 90rem);
  display: grid;
  grid-template-columns: minmax(17rem, 0.75fr) minmax(34rem, 1.25fr);
  gap: clamp(2.5rem, 7vw, 7rem);
  align-items: center;
  margin: clamp(5rem, 11vw, 10rem) auto;
  padding: clamp(2rem, 5vw, 4.5rem);
  background: color-mix(in oklch, var(--active-bg, var(--paper-deep)), var(--paper) 32%);
  color: color-mix(in oklch, var(--active-ink, var(--ink)), var(--ink) 38%);
}

.sponsors-copy h2 { max-width: 10ch; margin: 0; font-size: clamp(2.5rem, 5.4vw, 5.8rem); font-weight: 900; letter-spacing: -0.065em; line-height: 0.9; }
.sponsors-copy > p:not(.sponsors-sync) { max-width: 35rem; margin: 1.4rem 0 1.6rem; color: color-mix(in oklch, currentColor, transparent 18%); font-size: clamp(1rem, 1.35vw, 1.2rem); }
.sponsors-sync { display: flex; align-items: center; gap: 0.55rem; margin: 1.25rem 0 0; color: color-mix(in oklch, currentColor, transparent 30%); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.sponsors-sync > span { height: 0.8rem; display: inline-flex; align-items: center; gap: 2px; }
.sponsors-sync i { width: 2px; height: 35%; display: block; background: var(--active-accent, var(--accent)); }
.sponsors-sync i:nth-child(2) { height: 80%; }
.sponsor-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-flow: row dense; gap: 0.8rem; }
.sponsor-seat { position: relative; min-width: 0; min-height: 7.8rem; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.25rem; overflow: hidden; border: 1px solid color-mix(in oklch, currentColor, transparent 62%); background: color-mix(in oklch, var(--paper-light), transparent 16%); cursor: pointer; text-align: center; transition: transform 200ms var(--ease-out-quart), border-color 200ms ease-out, box-shadow 200ms var(--ease-out-quart); }
.sponsor-seat--wide { grid-column: span 2; }
.sponsor-seat--filled { padding: 1.25rem; background: var(--paper-light); }
.sponsor-board--live .sponsor-seat--filled { animation: sponsor-arrive 420ms var(--ease-out-quart) both; }
.sponsor-seat--filled img { width: min(100%, 9rem); height: 3.2rem; display: block; object-fit: contain; }
.sponsor-seat--wide img { width: min(100%, 12rem); height: 4rem; }
.sponsor-seat__fallback { width: 3.5rem; aspect-ratio: 1; display: grid; place-items: center; background: var(--ink); color: var(--paper-light); font-size: 0.9rem; font-weight: 900; }
.sponsor-seat--empty { border-style: dashed; color: color-mix(in oklch, currentColor, transparent 20%); }
.sponsor-seat--empty strong { font-size: 0.78rem; letter-spacing: 0.055em; text-transform: uppercase; }
.sponsor-seat--empty small { font-size: 0.68rem; }
.sponsor-seat__wave { height: 1.4rem; display: flex; align-items: center; gap: 0.18rem; margin-bottom: 0.3rem; }
.sponsor-seat__wave i { width: 2px; height: 32%; display: block; background: var(--active-accent, var(--accent)); transform-origin: center; }
.sponsor-seat__wave i:nth-child(2), .sponsor-seat__wave i:nth-child(4) { height: 62%; }
.sponsor-seat__wave i:nth-child(3) { height: 100%; }

@media (hover: hover) and (pointer: fine) {
  .sponsor-seat:hover { z-index: 1; border-color: var(--active-accent, var(--accent)); box-shadow: 0.35rem 0.35rem 0 color-mix(in oklch, var(--active-accent, var(--accent)), transparent 20%); transform: translate(-0.14rem, -0.14rem) rotate(-0.5deg); }
  .sponsor-seat:nth-child(even):hover { transform: translate(-0.14rem, -0.14rem) rotate(0.5deg); }
  .sponsor-seat:hover .sponsor-seat__wave i { animation: sponsor-seat-wave 520ms ease-in-out infinite alternate; }
}

@keyframes sponsor-seat-wave { from { scale: 1 0.4; } to { scale: 1 1; } }
@keyframes sponsor-arrive { from { opacity: 0; transform: translateY(0.45rem); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 68rem) { .sponsors-section { grid-template-columns: 1fr; } .sponsors-copy h2 { max-width: 12ch; } }
@media (max-width: 42rem) { .sponsors-section { width: min(100% - 2rem, 90rem); margin-block: 5rem; padding: 1.5rem; } .sponsor-board { grid-template-columns: repeat(2, minmax(0, 1fr)); } .sponsor-seat--wide { grid-column: span 2; } }
@media (prefers-reduced-motion: reduce) { .sponsor-seat { transition: none; } .sponsor-board--live .sponsor-seat--filled, .sponsor-seat:hover .sponsor-seat__wave i { animation: none; } }
</style>
