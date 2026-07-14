<script setup lang="ts">
import { ArrowUpRight, Heart } from '@lucide/vue'

withDefaults(defineProps<{ label?: string; wide?: boolean }>(), {
  label: 'Sponsor',
  wide: false,
})

const emit = defineEmits<{ activate: [] }>()
</script>

<template>
  <a
    class="sponsor-button"
    :class="{ 'sponsor-button--wide': wide }"
    href="https://github.com/sponsors/romainsimon"
    target="_blank"
    rel="sponsored noopener"
    data-sfx-managed
    aria-label="Sponsor UI SFX on GitHub (opens in a new tab)"
    @click="emit('activate')"
  >
    <span class="sponsor-button__heart" aria-hidden="true"><Heart :size="17" :stroke-width="2.2" /></span>
    <strong>{{ label }}</strong>
    <span class="sponsor-button__signal" aria-hidden="true"><i /><i /><i /></span>
    <ArrowUpRight class="sponsor-button__arrow" :size="16" :stroke-width="2" aria-hidden="true" />
  </a>
</template>

<style scoped>
.sponsor-button {
  --sponsor-shadow: var(--active-accent, var(--accent));
  min-height: 3.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.72rem 1rem;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper-light);
  box-shadow: 0.3rem 0.3rem 0 var(--sponsor-shadow);
  cursor: pointer;
  font-size: 0.78rem;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  transition: transform 180ms var(--ease-out-quart), box-shadow 180ms var(--ease-out-quart), background-color 180ms ease-out;
}

.sponsor-button--wide { min-width: min(100%, 13rem); }
.sponsor-button__heart, .sponsor-button__arrow { display: grid; place-items: center; flex: 0 0 auto; }
.sponsor-button__heart { color: var(--sponsor-shadow); transform-origin: 50% 68%; }
.sponsor-button__signal { height: 1rem; display: inline-flex; align-items: center; gap: 0.14rem; }
.sponsor-button__signal i { width: 2px; height: 35%; display: block; background: currentColor; transform-origin: center; }
.sponsor-button__signal i:nth-child(2) { height: 72%; }
.sponsor-button__arrow { margin-left: -0.25rem; transition: transform 180ms var(--ease-out-quart); }

@media (hover: hover) and (pointer: fine) {
  .sponsor-button:hover { transform: translate(-0.12rem, -0.12rem); box-shadow: 0.44rem 0.44rem 0 var(--sponsor-shadow); }
  .sponsor-button:hover .sponsor-button__heart { animation: sponsor-heart 620ms var(--ease-out-quart) both; }
  .sponsor-button:hover .sponsor-button__signal i { animation: sponsor-signal 580ms ease-in-out infinite alternate; }
  .sponsor-button:hover .sponsor-button__signal i:nth-child(2) { animation-delay: 80ms; }
  .sponsor-button:hover .sponsor-button__signal i:nth-child(3) { animation-delay: 160ms; }
  .sponsor-button:hover .sponsor-button__arrow { transform: translate(0.12rem, -0.12rem); }
}

.sponsor-button:active { transform: translate(0.22rem, 0.22rem); box-shadow: 0.08rem 0.08rem 0 var(--sponsor-shadow); }
@keyframes sponsor-heart { 0%, 100% { transform: scale(1); } 42% { transform: scale(1.28) rotate(-6deg); } 68% { transform: scale(0.94) rotate(3deg); } }
@keyframes sponsor-signal { from { scale: 1 0.55; } to { scale: 1 1; } }

@media (prefers-reduced-motion: reduce) {
  .sponsor-button, .sponsor-button__arrow { transition: none; }
  .sponsor-button:hover .sponsor-button__heart, .sponsor-button:hover .sponsor-button__signal i { animation: none; }
}
</style>
