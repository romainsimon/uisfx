<script setup lang="ts">
import type { CueName } from 'uisfx'
import { Bell, Check, FileText, Search, ShoppingCart, Sparkles, Trophy, Upload } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const props = defineProps<{
  packLabel: string
  muted: boolean
}>()

const emit = defineEmits<{ play: [cue: CueName] }>()

const activeScenario = ref('saas')
const recentCues = ref<CueName[]>([])
const taskProgress = ref(0)
const taskState = ref<'idle' | 'running' | 'ready'>('idle')
const uploadState = ref<'idle' | 'queued' | 'complete'>('idle')
const notificationEnabled = ref(true)
const workspaceQuery = ref('')
const cartCount = ref(0)
const checkoutOpen = ref(false)
const rewardClaimed = ref(false)
const rewardProgress = ref(72)
let progressTimer: ReturnType<typeof setInterval> | undefined
let typingSoundTimer: ReturnType<typeof setTimeout> | undefined
let previousWorkspaceQuery = ''
const timers = new Set<ReturnType<typeof setTimeout>>()

const scenarioCueMap = {
  saas: ['focus', 'drop', 'processing', 'complete'],
  commerce: ['select', 'add-to-cart', 'checkout', 'purchase'],
  rewards: ['progress-step', 'reward', 'achievement', 'level-up'],
} as const satisfies Record<string, readonly CueName[]>
const activeCueSequence = computed(() => scenarioCueMap[activeScenario.value as keyof typeof scenarioCueMap])

function later(callback: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer)
    callback()
  }, delay)
  timers.add(timer)
}

function sound(cue: CueName) {
  recentCues.value = [...recentCues.value.slice(-4), cue]
  emit('play', cue)
}

function changeScenario(value: string | number) {
  const nextScenario = String(value)
  if (activeScenario.value === nextScenario) return
  activeScenario.value = nextScenario
  sound('select')
}

function runReport() {
  if (taskState.value === 'running') return
  if (progressTimer) clearInterval(progressTimer)
  taskState.value = 'running'
  taskProgress.value = 8
  sound('processing')
  toast.loading('Generating the Q2 report', { id: 'report', description: 'UI SFX is playing the processing loop.' })

  progressTimer = setInterval(() => {
    taskProgress.value = Math.min(100, taskProgress.value + 12)
    if (taskProgress.value < 100) return
    if (progressTimer) clearInterval(progressTimer)
    progressTimer = undefined
    taskState.value = 'ready'
    sound('complete')
    toast.success('Q2 report is ready', { id: 'report', description: 'The loop stopped and a completion cue played.' })
  }, 190)
}

function uploadBrief() {
  if (uploadState.value === 'queued') return
  uploadState.value = 'queued'
  sound('drop')
  later(() => sound('queued'), 320)
  later(() => {
    uploadState.value = 'complete'
    sound('complete')
    toast.success('Brand brief uploaded', { description: 'The file is ready for the workspace.' })
  }, 1_150)
}

function setNotifications(value: boolean) {
  notificationEnabled.value = value
  sound(value ? 'toggle-on' : 'toggle-off')
  toast(value ? 'Team notifications enabled' : 'Team notifications paused')
}

function onWorkspaceInput(event: Event) {
  const value = event.target instanceof HTMLInputElement ? event.target.value : workspaceQuery.value
  if (!value && previousWorkspaceQuery) {
    sound('deselect')
  } else if (value && !typingSoundTimer) {
    sound('typing')
    typingSoundTimer = setTimeout(() => { typingSoundTimer = undefined }, 420)
  }
  previousWorkspaceQuery = value
}

function addToCart() {
  cartCount.value += 1
  sound('add-to-cart')
  toast.success('Studio headphones added', { description: `${cartCount.value} item${cartCount.value === 1 ? '' : 's'} in your cart.` })
}

function setCheckoutOpen(open: boolean) {
  checkoutOpen.value = open
  sound(open ? 'checkout' : 'close')
}

function purchase() {
  sound('purchase')
  toast.success('Payment confirmed', { description: 'Your order is on its way.' })
  later(() => { checkoutOpen.value = false }, 450)
}

function claimReward() {
  if (rewardClaimed.value) return
  rewardClaimed.value = true
  rewardProgress.value = 100
  sound('achievement')
  toast.success('Achievement unlocked', { description: 'Interface Listener · Level 8' })
  later(() => sound('level-up'), 650)
}

onBeforeUnmount(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (typingSoundTimer) clearTimeout(typingSoundTimer)
  for (const timer of timers) clearTimeout(timer)
})
</script>

<template>
  <section id="patterns" class="patterns-section" aria-labelledby="patterns-title">
    <header class="patterns-heading">
      <div>
        <p class="eyebrow">Sound in context</p>
        <h2 id="patterns-title">Hear what the interface means.</h2>
      </div>
      <p>Interactive product controls wired to semantic cues. Change the sound pack above, then run the same flows with a completely different personality.</p>
    </header>

    <div class="patterns-lab">
      <Tabs :model-value="activeScenario" class="patterns-tabs" @update:model-value="changeScenario">
        <div class="patterns-toolbar">
          <TabsList aria-label="Example interface type">
            <TabsTrigger value="saas">SaaS workflow</TabsTrigger>
            <TabsTrigger value="commerce">Commerce</TabsTrigger>
            <TabsTrigger value="rewards">Game & rewards</TabsTrigger>
          </TabsList>
          <span><i :class="{ muted }" />{{ muted ? 'Preview muted' : `${packLabel} pack active` }}</span>
        </div>

        <TabsContent value="saas" class="scenario-panel">
          <div class="demo-app demo-app--saas">
            <header class="demo-app__bar">
              <div class="window-dots" aria-hidden="true"><i /><i /><i /></div>
              <strong>Atlas workspace</strong>
              <span>Team plan</span>
            </header>
            <div class="saas-layout">
              <aside class="mini-sidebar" aria-label="Workspace sections">
                <strong>Workspace</strong>
                <button type="button" class="active" @click="sound('select')"><FileText /> Reports</button>
                <button type="button" @click="sound('select')"><Bell /> Activity</button>
                <button type="button" @click="sound('open')"><Sparkles /> Automations</button>
              </aside>

              <div class="saas-main">
                <div class="workspace-topline">
                  <div>
                    <small>Quarterly review</small>
                    <h3>Team reporting</h3>
                  </div>
                  <label class="workspace-search">
                    <Search aria-hidden="true" />
                    <span class="sr-only">Search workspace</span>
                    <Input v-model="workspaceQuery" placeholder="Search" @focus="sound('focus')" @input="onWorkspaceInput" />
                  </label>
                </div>

                <div class="task-module">
                  <div class="task-module__copy">
                    <span class="task-icon"><FileText /></span>
                    <div>
                      <strong>{{ taskState === 'ready' ? 'Q2 report complete' : 'Generate Q2 report' }}</strong>
                      <small>{{ taskState === 'running' ? 'Combining 12 sources…' : taskState === 'ready' ? 'PDF · 2.4 MB · just now' : '12 connected sources · about 2 seconds' }}</small>
                    </div>
                  </div>
                  <Button :disabled="taskState === 'running'" @click="runReport">
                    <Check v-if="taskState === 'ready'" />
                    {{ taskState === 'running' ? `${taskProgress}%` : taskState === 'ready' ? 'Run again' : 'Generate' }}
                  </Button>
                  <Progress :model-value="taskProgress" :aria-label="`Report generation ${taskProgress}%`" />
                </div>

                <div class="saas-lower">
                  <button type="button" class="upload-zone" @click="uploadBrief">
                    <span><Upload /></span>
                    <strong>{{ uploadState === 'idle' ? 'Drop a brand brief' : uploadState === 'queued' ? 'Uploading brand-brief.pdf' : 'brand-brief.pdf' }}</strong>
                    <small>{{ uploadState === 'complete' ? 'Ready · 840 KB' : 'PDF or DOCX, up to 10 MB' }}</small>
                  </button>
                  <div class="preference-row">
                    <span><Bell /><span><strong>Team notifications</strong><small>Mentions and completed reports</small></span></span>
                    <Switch :model-value="notificationEnabled" aria-label="Team notifications" @update:model-value="setNotifications" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="commerce" class="scenario-panel">
          <div class="demo-app demo-app--shop">
            <header class="shop-nav">
              <strong>SONORA®</strong>
              <nav aria-label="Demo shop"><span>Headphones</span><span>Speakers</span><span>Stories</span></nav>
              <button type="button" aria-label="Open cart" @click="sound('open')"><ShoppingCart />{{ cartCount }}</button>
            </header>
            <div class="product-stage">
              <div class="product-visual" aria-label="Orange studio headphones illustration">
                <span class="headphone-band" /><span class="headphone-cup headphone-cup--left" /><span class="headphone-cup headphone-cup--right" />
                <small>STUDIO / 01</small>
              </div>
              <div class="product-copy">
                <p class="product-kicker">Open-back reference</p>
                <h3>Studio One</h3>
                <p>Balanced sound for long sessions. Aluminum frame, replaceable pads, and a two-year repair promise.</p>
                <div class="product-price"><strong>€249</strong><span>Free delivery in 2-3 days</span></div>
                <div class="product-actions">
                  <Button variant="accent" size="lg" @click="addToCart"><ShoppingCart /> Add to cart</Button>
                  <Button variant="outline" size="lg" @click="setCheckoutOpen(true)">Buy now</Button>
                </div>
                <p class="stock-note"><i /> In stock in Paris</p>
              </div>
            </div>
          </div>

          <Dialog :open="checkoutOpen" @update:open="setCheckoutOpen">
            <DialogContent>
              <DialogHeader>
                <p class="dialog-kicker">Secure checkout</p>
                <DialogTitle>Studio One · €249</DialogTitle>
                <DialogDescription>Confirm the example purchase to hear the semantic purchase cue. No payment is made.</DialogDescription>
              </DialogHeader>
              <div class="checkout-summary">
                <span>Delivery</span><strong>Tuesday, 15 July</strong>
                <span>Payment</span><strong>•••• 4242</strong>
                <span>Total</span><strong>€249.00</strong>
              </div>
              <DialogFooter>
                <Button variant="outline" @click="setCheckoutOpen(false)">Cancel</Button>
                <Button variant="accent" @click="purchase">Confirm purchase</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="rewards" class="scenario-panel">
          <div class="demo-app demo-app--reward">
            <header class="reward-nav"><strong>Field Notes</strong><span>7 day streak 🔥</span></header>
            <div class="reward-stage">
              <div class="reward-orbit" :class="{ complete: rewardClaimed }">
                <span class="orbit-ring orbit-ring--one" /><span class="orbit-ring orbit-ring--two" />
                <div class="reward-medal"><Trophy /><small>LVL</small><strong>{{ rewardClaimed ? 8 : 7 }}</strong></div>
                <i v-for="index in 8" :key="index" :style="{ '--index': index }" />
              </div>
              <div class="reward-copy">
                <p class="product-kicker">Listening challenge</p>
                <h3>{{ rewardClaimed ? 'Level 8 unlocked.' : 'One cue away.' }}</h3>
                <p>{{ rewardClaimed ? 'You identified every interaction family and earned the Interface Listener badge.' : 'Preview one more product flow to complete this sound design level.' }}</p>
                <div class="reward-progress"><span><strong>{{ rewardProgress }}%</strong><small>1,440 / 2,000 XP</small></span><Progress :model-value="rewardProgress" /></div>
                <Button size="lg" :disabled="rewardClaimed" @click="claimReward"><Sparkles />{{ rewardClaimed ? 'Achievement claimed' : 'Claim achievement' }}</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <aside class="cue-trace" aria-label="Sound event trace">
        <header><span>Live cue trace</span><i :class="{ muted }" /></header>
        <div v-if="recentCues.length" class="cue-trace__events">
          <div v-for="(cue, index) in recentCues" :key="`${cue}-${index}`">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ cue }}</strong>
            <button type="button" :aria-label="`Replay ${cue}`" @click="sound(cue)">▶</button>
          </div>
        </div>
        <div v-else class="cue-trace__empty">
          <span>◎</span><p>Use the interface. Every meaningful state change will appear here.</p>
        </div>
        <div class="cue-trace__expected">
          <small>Typical sequence</small>
          <code v-for="cue in activeCueSequence" :key="cue">{{ cue }}</code>
        </div>
        <footer><span>{{ props.packLabel }}</span><code>ui.play('{{ recentCues[recentCues.length - 1] ?? 'select' }}')</code></footer>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.patterns-section {
  width: min(100% - 2 * clamp(1rem, 4vw, 4rem), 90rem);
  margin-inline: auto;
  padding-block: clamp(5rem, 10vw, 9rem);
}

.patterns-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 30rem);
  align-items: end;
  gap: var(--space-2xl);
  margin-block-end: clamp(2.5rem, 6vw, 5rem);
}

.patterns-heading > div { display: grid; gap: var(--space-lg); }
.patterns-heading h2 { max-width: 13ch; margin: 0; font-size: clamp(3.2rem, 7vw, 7.25rem); font-weight: 700; letter-spacing: -0.045em; line-height: 0.97; }
.patterns-heading > p { margin: 0; color: var(--ink-soft); line-height: 1.7; }

.patterns-lab {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16.5rem;
  border: 1px solid var(--ink);
  background: var(--paper-light);
}

.patterns-tabs { min-width: 0; }
.patterns-toolbar { min-height: 4.25rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-lg); padding: var(--space-sm); border-bottom: 1px solid var(--ink); background: var(--paper-deep); }
.patterns-toolbar > span { display: inline-flex; align-items: center; gap: var(--space-xs); padding-inline: var(--space-sm); color: var(--ink-soft); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.patterns-toolbar > span i, .cue-trace header i { width: 0.55rem; aspect-ratio: 1; border-radius: 50%; background: oklch(0.68 0.16 142); box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.68 0.16 142), transparent 78%); }
.patterns-toolbar > span i.muted, .cue-trace header i.muted { background: var(--rule); box-shadow: none; }
.scenario-panel { margin: 0; }

.demo-app { min-height: 38rem; background: oklch(0.965 0.013 83); color: var(--ink); }
.demo-app__bar { min-height: 3.5rem; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding-inline: var(--space-lg); border-bottom: 1px solid var(--rule); font-size: 0.75rem; }
.demo-app__bar > span { justify-self: end; color: var(--ink-soft); }
.window-dots { display: flex; gap: 0.35rem; }
.window-dots i { width: 0.55rem; aspect-ratio: 1; border: 1px solid var(--ink); border-radius: 50%; }
.window-dots i:first-child { background: var(--accent); }

.saas-layout { min-height: 34.5rem; display: grid; grid-template-columns: 11rem minmax(0, 1fr); }
.mini-sidebar { display: flex; flex-direction: column; gap: var(--space-xs); padding: var(--space-lg) var(--space-sm); border-inline-end: 1px solid var(--rule); background: var(--paper); }
.mini-sidebar > strong { padding: 0 var(--space-sm) var(--space-sm); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
.mini-sidebar button { min-height: 2.5rem; display: flex; align-items: center; gap: var(--space-xs); padding-inline: var(--space-sm); border: 0; background: transparent; color: var(--ink-soft); cursor: pointer; text-align: left; }
.mini-sidebar button svg { width: 1rem; }
.mini-sidebar button:hover, .mini-sidebar button.active { background: var(--ink); color: var(--paper-light); }
.saas-main { display: grid; align-content: start; gap: var(--space-lg); padding: clamp(1.25rem, 4vw, 2.5rem); }
.workspace-topline { display: flex; align-items: end; justify-content: space-between; gap: var(--space-lg); }
.workspace-topline small, .task-module small, .upload-zone small, .preference-row small { color: var(--ink-soft); }
.workspace-topline h3 { margin: 0.2rem 0 0; font-size: 2rem; letter-spacing: -0.035em; }
.workspace-search { position: relative; width: min(15rem, 42%); }
.workspace-search > svg { position: absolute; z-index: 1; top: 50%; left: 0.75rem; width: 1rem; translate: 0 -50%; color: var(--ink-soft); }
.workspace-search input { padding-inline-start: 2.25rem; }
.task-module { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-md); padding: var(--space-lg); border: 1px solid var(--ink); background: var(--paper-light); box-shadow: 0.35rem 0.35rem 0 var(--paper-deep); }
.task-module__copy { display: flex; align-items: center; gap: var(--space-md); }
.task-module__copy > div { display: grid; gap: var(--space-2xs); }
.task-icon { display: grid; width: 2.75rem; aspect-ratio: 1; place-items: center; background: var(--paper-deep); }
.task-icon svg { width: 1.2rem; }
.task-module [data-slot='progress'] { grid-column: 1 / -1; }
.saas-lower { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.upload-zone { min-height: 10rem; display: grid; place-items: center; align-content: center; gap: var(--space-xs); padding: var(--space-lg); border: 1px dashed var(--ink); background: var(--paper); color: var(--ink); cursor: pointer; text-align: center; }
.upload-zone:hover { background: var(--paper-deep); }
.upload-zone > span { display: grid; width: 2.5rem; aspect-ratio: 1; place-items: center; border-radius: 50%; background: var(--accent); color: var(--paper-light); }
.upload-zone svg { width: 1.1rem; }
.preference-row { min-height: 10rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); padding: var(--space-lg); border: 1px solid var(--rule); background: var(--paper-light); }
.preference-row > span { display: flex; gap: var(--space-sm); }
.preference-row > span > span { display: grid; gap: var(--space-2xs); }
.preference-row svg { width: 1rem; }

.shop-nav { min-height: 4rem; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding-inline: var(--space-xl); border-bottom: 1px solid var(--ink); }
.shop-nav > strong { letter-spacing: -0.04em; }
.shop-nav nav { display: flex; gap: var(--space-lg); color: var(--ink-soft); font-size: 0.75rem; }
.shop-nav button { justify-self: end; display: inline-flex; align-items: center; gap: 0.35rem; border: 0; background: transparent; cursor: pointer; font-weight: 700; }
.shop-nav svg { width: 1rem; }
.product-stage { min-height: 34rem; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr); }
.product-visual { position: relative; min-height: 34rem; overflow: hidden; background: oklch(0.7 0.19 44); }
.product-visual::before { content: ''; position: absolute; width: 20rem; aspect-ratio: 1; top: 50%; left: 50%; translate: -50% -48%; border: 2.4rem solid var(--ink); border-bottom-color: transparent; border-radius: 50%; rotate: -5deg; }
.headphone-band { position: absolute; width: 14rem; height: 14rem; top: 50%; left: 50%; translate: -50% -52%; border: 1.2rem solid var(--paper-light); border-bottom-color: transparent; border-radius: 50%; rotate: -5deg; }
.headphone-cup { position: absolute; width: 5.5rem; height: 8rem; top: 54%; border: 0.8rem solid var(--paper-light); border-radius: 2.5rem; background: var(--ink); rotate: -5deg; }
.headphone-cup--left { left: calc(50% - 9rem); }
.headphone-cup--right { right: calc(50% - 9rem); }
.product-visual small { position: absolute; right: var(--space-lg); bottom: var(--space-lg); padding: 0.35rem 0.5rem; background: var(--paper-light); font-weight: 700; letter-spacing: 0.08em; }
.product-copy { display: grid; align-content: center; gap: var(--space-lg); padding: clamp(2rem, 6vw, 4.5rem); background: var(--paper-light); }
.product-kicker, .dialog-kicker { margin: 0; color: var(--accent-dark); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.product-copy h3, .reward-copy h3 { margin: 0; font-size: clamp(2.8rem, 5vw, 4.5rem); letter-spacing: -0.05em; line-height: 0.95; }
.product-copy > p:not(.product-kicker, .stock-note), .reward-copy > p:not(.product-kicker) { margin: 0; color: var(--ink-soft); line-height: 1.65; }
.product-price { display: grid; gap: var(--space-2xs); }
.product-price strong { font-size: 1.6rem; }
.product-price span { color: var(--ink-soft); font-size: 0.75rem; }
.product-actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.stock-note { display: flex; align-items: center; gap: var(--space-xs); margin: 0; font-size: 0.72rem; }
.stock-note i { width: 0.5rem; aspect-ratio: 1; border-radius: 50%; background: oklch(0.68 0.16 142); }
.checkout-summary { display: grid; grid-template-columns: 1fr auto; gap: var(--space-sm); padding-block: var(--space-md); border-block: 1px solid var(--rule); font-size: 0.85rem; }
.checkout-summary span { color: var(--ink-soft); }

.demo-app--reward { background: oklch(0.25 0.045 176); color: oklch(0.965 0.015 82); }
.reward-nav { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; padding-inline: var(--space-xl); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.reward-nav span { font-size: 0.75rem; }
.reward-stage { min-height: 34rem; display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 0.8fr); align-items: center; gap: clamp(2rem, 5vw, 5rem); padding: clamp(2rem, 6vw, 5rem); }
.reward-orbit { position: relative; width: min(25rem, 100%); aspect-ratio: 1; display: grid; place-items: center; justify-self: center; }
.orbit-ring { position: absolute; inset: 6%; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 60%); border-radius: 50%; }
.orbit-ring--two { inset: 19%; border-style: dashed; rotate: 20deg; }
.reward-medal { position: relative; z-index: 2; width: 10rem; aspect-ratio: 1; display: grid; place-items: center; align-content: center; gap: 0.15rem; border: 0.7rem solid oklch(0.78 0.17 77); border-radius: 50%; background: var(--accent); color: var(--paper-light); box-shadow: 0 0 0 1rem color-mix(in oklch, var(--accent), transparent 78%); transition: scale 280ms cubic-bezier(0.22, 1, 0.36, 1); }
.complete .reward-medal { scale: 1.1; }
.reward-medal svg { width: 2rem; }
.reward-medal small { font-size: 0.6rem; letter-spacing: 0.12em; }
.reward-medal strong { font-size: 2.2rem; line-height: 1; }
.reward-orbit > i { --angle: calc(var(--index) * 45deg); position: absolute; top: calc(50% + sin(var(--angle)) * 43%); left: calc(50% + cos(var(--angle)) * 43%); width: 0.65rem; aspect-ratio: 1; border-radius: 50%; background: oklch(0.78 0.17 77); }
.reward-copy { display: grid; align-content: center; justify-items: start; gap: var(--space-lg); }
.reward-copy .product-kicker { color: oklch(0.82 0.14 77); }
.reward-copy > p:not(.product-kicker) { color: color-mix(in oklch, var(--paper-light), transparent 28%); }
.reward-progress { width: 100%; display: grid; gap: var(--space-sm); }
.reward-progress > span { display: flex; align-items: baseline; justify-content: space-between; }
.reward-progress small { color: color-mix(in oklch, var(--paper-light), transparent 40%); }

.cue-trace { min-width: 0; display: grid; grid-template-rows: auto minmax(13rem, 1fr) auto auto; border-inline-start: 1px solid var(--ink); background: var(--ink); color: var(--paper-light); }
.cue-trace header { min-height: 4.25rem; display: flex; align-items: center; justify-content: space-between; padding-inline: var(--space-md); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.cue-trace__events { display: grid; align-content: start; }
.cue-trace__events > div { min-height: 3.5rem; display: grid; grid-template-columns: 2rem 1fr auto; align-items: center; gap: var(--space-xs); padding-inline: var(--space-md); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 86%); }
.cue-trace__events span { color: color-mix(in oklch, var(--paper-light), transparent 52%); font-size: 0.6rem; }
.cue-trace__events strong { min-width: 0; overflow: hidden; font-size: 0.78rem; text-overflow: ellipsis; }
.cue-trace__events button { border: 0; background: transparent; color: var(--accent); cursor: pointer; }
.cue-trace__empty { display: grid; place-items: center; align-content: center; gap: var(--space-sm); padding: var(--space-lg); color: color-mix(in oklch, var(--paper-light), transparent 48%); text-align: center; }
.cue-trace__empty span { font-size: 2rem; }
.cue-trace__empty p { margin: 0; font-size: 0.75rem; line-height: 1.5; }
.cue-trace__expected { display: flex; flex-wrap: wrap; gap: var(--space-xs); padding: var(--space-md); border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.cue-trace__expected small { flex-basis: 100%; color: color-mix(in oklch, var(--paper-light), transparent 52%); font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; }
.cue-trace__expected code { padding: 0.25rem 0.4rem; background: color-mix(in oklch, var(--paper-light), transparent 90%); font-size: 0.62rem; }
.cue-trace footer { display: grid; gap: var(--space-xs); padding: var(--space-md); border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.cue-trace footer span { color: var(--accent); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.cue-trace footer code { overflow: hidden; color: color-mix(in oklch, var(--paper-light), transparent 22%); font-size: 0.66rem; text-overflow: ellipsis; }

@media (max-width: 72rem) {
  .patterns-lab { grid-template-columns: minmax(0, 1fr); }
  .cue-trace { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: auto auto; border-block-start: 1px solid var(--ink); border-inline-start: 0; }
  .cue-trace header { grid-row: 1 / 3; }
  .cue-trace__events, .cue-trace__empty { min-height: 4.25rem; grid-auto-flow: column; align-content: stretch; }
  .cue-trace__events > div { border-bottom: 0; border-inline-end: 1px solid color-mix(in oklch, var(--paper-light), transparent 86%); }
  .cue-trace__expected { border-top: 0; }
  .cue-trace footer { grid-column: 3; grid-row: 1 / 3; border-top: 0; border-inline-start: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
}

@media (max-width: 52rem) {
  .patterns-heading { grid-template-columns: 1fr; align-items: start; }
  .patterns-toolbar { align-items: stretch; flex-direction: column; }
  .patterns-toolbar [data-slot='tabs-list'] { width: 100%; overflow-x: auto; }
  .patterns-toolbar [data-slot='tabs-trigger'] { flex: 1; }
  .patterns-toolbar > span { min-height: 2rem; }
  .saas-layout, .product-stage, .reward-stage { grid-template-columns: 1fr; }
  .mini-sidebar { display: none; }
  .product-visual { min-height: 22rem; }
  .reward-stage { padding-block: 3rem; }
  .reward-orbit { max-width: 19rem; }
  .cue-trace { display: none; }
}

@media (max-width: 38rem) {
  .patterns-section { width: 100%; }
  .patterns-heading { width: calc(100% - 2rem); margin-inline: auto; }
  .patterns-heading h2 { font-size: clamp(3rem, 16vw, 4.6rem); }
  .patterns-lab { border-inline: 0; }
  .patterns-toolbar [data-slot='tabs-list'] { display: grid; grid-template-columns: 1fr; }
  .workspace-topline { align-items: stretch; flex-direction: column; }
  .workspace-search { width: 100%; }
  .task-module { grid-template-columns: 1fr; }
  .task-module [data-slot='button'] { width: 100%; }
  .task-module [data-slot='progress'] { grid-column: 1; }
  .saas-lower { grid-template-columns: 1fr; }
  .shop-nav nav { display: none; }
  .product-copy { padding: 2rem 1.25rem; }
  .product-actions [data-slot='button'] { flex: 1; }
  .reward-stage { padding: 2.5rem 1.25rem; }
}

@media (prefers-reduced-motion: reduce) {
  .reward-medal, [data-slot='progress'] > * { transition: none; }
}
</style>
