<script setup lang="ts">
import type { CueName } from 'uisfx'
import {
  AtSign,
  Bell,
  Check,
  FileText,
  Flag,
  Gem,
  Gift,
  MessageCircle,
  Pause,
  Play,
  Search,
  Send,
  ShoppingCart,
  SkipBack,
  SkipForward,
  Sparkles,
  Trophy,
  Upload,
  Volume2,
} from '@lucide/vue'
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

const emit = defineEmits<{
  play: [cue: CueName]
  playLevel: [cue: CueName, level: number]
}>()

type ScenarioName = 'saas' | 'commerce' | 'rewards' | 'media' | 'messages'

interface DemoMessage {
  id: number
  author: string
  text: string
  own?: boolean
  reacted?: boolean
}

interface CueTraceEvent {
  id: number
  cue: CueName
}

const SCENARIO_NAMES: readonly ScenarioName[] = ['saas', 'commerce', 'rewards', 'media', 'messages']
const activeScenario = ref<ScenarioName>('saas')
const recentCues = ref<CueTraceEvent[]>([])
const taskProgress = ref(0)
const taskState = ref<'idle' | 'running' | 'ready'>('idle')
const uploadState = ref<'idle' | 'queued' | 'complete'>('idle')
const notificationEnabled = ref(true)
const workspaceQuery = ref('')
const cartCount = ref(0)
const checkoutOpen = ref(false)
const rewardClaimed = ref(false)
const rewardProgress = ref(18)
const gameStep = ref(0)
const gameBonusOpened = ref(false)
const gameLevelAdvanced = ref(false)
const mediaTracks = [
  { title: 'Signal Garden', artist: 'Noor Echo', tone: 'coral' },
  { title: 'Afterimage', artist: 'Mira Vale', tone: 'violet' },
  { title: 'Quiet Voltage', artist: 'Common Field', tone: 'mint' },
] as const
const mediaTrackIndex = ref(0)
const mediaPlaying = ref(false)
const mediaPosition = ref(34)
const mediaVolume = ref(68)
const currentMediaTrack = computed(() => mediaTracks[mediaTrackIndex.value] ?? mediaTracks[0])
const messages = ref<DemoMessage[]>([
  { id: 1, author: 'Mina', text: 'The onboarding mix is ready for review.' },
  { id: 2, author: 'You', text: 'Listening now. The completion cue feels right.', own: true },
])
const messageDraft = ref('')
const activeMessageChannel = ref<'sound-design' | 'launch'>('sound-design')
let progressTimer: ReturnType<typeof setInterval> | undefined
let mediaTimer: ReturnType<typeof setInterval> | undefined
let nextMessageId = 3
let nextCueEventId = 1
const timers = new Set<ReturnType<typeof setTimeout>>()

const scenarioCueMap = {
  saas: ['focus', 'drop', 'processing', 'complete'],
  commerce: ['select', 'add-to-cart', 'checkout', 'purchase'],
  rewards: ['start', 'progress-step', 'reward', 'bonus', 'checkpoint', 'achievement', 'level-up'],
  media: ['play', 'seek', 'volume-change', 'skip-next', 'pause'],
  messages: ['typing', 'send', 'receive', 'reaction', 'mention'],
} as const satisfies Record<ScenarioName, readonly CueName[]>
const activeCueSequence = computed(() => scenarioCueMap[activeScenario.value])

function later(callback: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer)
    callback()
  }, delay)
  timers.add(timer)
}

function sound(cue: CueName) {
  recentCues.value = [...recentCues.value.slice(-4), { id: nextCueEventId++, cue }]
  emit('play', cue)
}

function soundAtLevel(cue: CueName, level: number) {
  recentCues.value = [...recentCues.value.slice(-4), { id: nextCueEventId++, cue }]
  emit('playLevel', cue, Math.max(0, Math.min(1, level)))
}

function changeScenario(value: string | number) {
  const nextScenario = String(value) as ScenarioName
  if (!SCENARIO_NAMES.includes(nextScenario)) return
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

function onWorkspaceInput() {
  sound('typing')
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
  if (gameStep.value < 3) {
    sound('blocked')
    toast.info('The final gate is still locked', { description: `Find ${3 - gameStep.value} more shard${gameStep.value === 2 ? '' : 's'} first.` })
    return
  }
  rewardClaimed.value = true
  rewardProgress.value = 100
  sound('achievement')
  toast.success('Achievement unlocked', { description: 'Interface Listener · Level 8' })
}

function advanceLevel() {
  if (!rewardClaimed.value) {
    sound('blocked')
    return
  }
  if (gameLevelAdvanced.value) {
    resetQuest()
    return
  }
  gameLevelAdvanced.value = true
  sound('level-up')
  toast.success('Level 8 started', { description: 'A new route is now available.' })
}

function beginQuest() {
  if (gameStep.value > 0) {
    sound('select')
    return
  }
  gameStep.value = 1
  rewardProgress.value = 34
  sound('start')
  later(() => sound('progress-step'), 320)
}

function collectShard() {
  if (gameStep.value === 0) {
    sound('blocked')
    toast.info('Start the quest first', { description: 'The route appears once the run begins.' })
    return
  }
  if (gameStep.value >= 3) {
    sound('info')
    toast('All signal shards found')
    return
  }
  gameStep.value += 1
  const step = gameStep.value
  rewardProgress.value = step === 2 ? 62 : 84
  sound('reward')
  later(() => sound(step === 3 ? 'checkpoint' : 'progress-step'), 340)
}

function openBonus() {
  if (gameStep.value < 2) {
    sound('blocked')
    toast.info('Bonus cache is hidden', { description: 'Find a signal shard to reveal it.' })
    return
  }
  if (gameBonusOpened.value) {
    sound('select')
    return
  }
  gameBonusOpened.value = true
  rewardProgress.value = Math.min(96, rewardProgress.value + 8)
  sound('bonus')
  toast.success('Bonus cache opened', { description: '+120 XP · rare waveform skin' })
}

function resetQuest() {
  rewardClaimed.value = false
  rewardProgress.value = 18
  gameStep.value = 0
  gameBonusOpened.value = false
  gameLevelAdvanced.value = false
  sound('retry')
}

function startMediaTimer() {
  if (mediaTimer) clearInterval(mediaTimer)
  mediaTimer = setInterval(() => {
    mediaPosition.value += 0.5
    if (mediaPosition.value < 100) return
    mediaPosition.value = 0
    mediaTrackIndex.value = (mediaTrackIndex.value + 1) % mediaTracks.length
  }, 320)
}

function stopMediaTimer() {
  if (!mediaTimer) return
  clearInterval(mediaTimer)
  mediaTimer = undefined
}

function toggleMediaPlayback() {
  mediaPlaying.value = !mediaPlaying.value
  sound(mediaPlaying.value ? 'play' : 'pause')
  if (mediaPlaying.value) startMediaTimer()
  else stopMediaTimer()
}

function skipMedia(direction: -1 | 1) {
  mediaTrackIndex.value = (mediaTrackIndex.value + direction + mediaTracks.length) % mediaTracks.length
  mediaPosition.value = 0
  sound(direction > 0 ? 'skip-next' : 'skip-previous')
}

function commitMediaSeek() {
  sound('seek')
}

function previewMediaVolume(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  mediaVolume.value = Number(event.target.value)
  soundAtLevel('volume-change', mediaVolume.value / 100)
}

function onMessageInput() {
  sound('typing')
}

function sendMessage() {
  const text = messageDraft.value.trim()
  if (!text) {
    sound('blocked')
    return
  }
  messages.value.push({ id: nextMessageId++, author: 'You', text, own: true })
  messageDraft.value = ''
  sound('send')
  later(() => {
    messages.value.push({ id: nextMessageId++, author: 'Mina', text: 'Got it. I’ll test that feel on mobile too.' })
    sound('receive')
  }, 760)
}

function toggleReaction(message: DemoMessage) {
  message.reacted = !message.reacted
  sound('reaction')
}

function mentionTeammate() {
  if (!messageDraft.value.includes('@Mina')) messageDraft.value = `${messageDraft.value}${messageDraft.value ? ' ' : ''}@Mina `
  sound('mention')
}

function notifyTeam() {
  sound('notification')
  toast('Mina was notified', { description: 'A neutral communication cue played.' })
}

function selectMessageChannel(channel: 'sound-design' | 'launch') {
  if (activeMessageChannel.value === channel) return
  activeMessageChannel.value = channel
  sound('select')
}

onBeforeUnmount(() => {
  if (progressTimer) clearInterval(progressTimer)
  stopMediaTimer()
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
      <p>Use the interactive product demos below to hear each meaningful state change. Switch the feel above, then repeat the same flow to compare its personality.</p>
    </header>

    <div class="patterns-lab">
      <Tabs :model-value="activeScenario" class="patterns-tabs" @update:model-value="changeScenario">
        <div class="patterns-toolbar">
          <TabsList aria-label="Example interface type">
            <TabsTrigger value="saas">Workflow</TabsTrigger>
            <TabsTrigger value="commerce">Shop</TabsTrigger>
            <TabsTrigger value="rewards">Game quest</TabsTrigger>
            <TabsTrigger value="media">Player</TabsTrigger>
            <TabsTrigger value="messages">Team chat</TabsTrigger>
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

                <div class="task-module" :class="`is-${taskState}`" :aria-busy="taskState === 'running'">
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
                  <button type="button" class="upload-zone" :class="`is-${uploadState}`" :aria-busy="uploadState === 'queued'" @click="uploadBrief">
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
              <button type="button" aria-label="Open cart" @click="sound('open')">
                <ShoppingCart />
                <Transition name="counter-pop" mode="out-in"><span :key="cartCount">{{ cartCount }}</span></Transition>
              </button>
            </header>
            <div class="product-stage">
              <div class="product-visual" role="img" aria-label="Orange studio headphones illustration">
                <span class="headphone-band" /><span class="headphone-cup headphone-cup--left" /><span class="headphone-cup headphone-cup--right" />
                <small>STUDIO / 01</small>
              </div>
              <div class="product-copy">
                <p class="product-kicker">Open-back reference</p>
                <h3>Studio One</h3>
                <p>Balanced sound for long sessions. Aluminum frame, replaceable pads, and a two-year repair promise.</p>
                <div class="product-price"><strong>€249</strong><span>Free delivery · 2–3 days</span></div>
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

        <TabsContent value="media" class="scenario-panel">
          <div class="demo-app demo-app--media">
            <header class="demo-app__bar">
              <div class="window-dots" aria-hidden="true"><i /><i /><i /></div>
              <strong>Wave Room</strong>
              <span>Lossless preview</span>
            </header>
            <div class="media-stage">
              <div
                class="media-art"
                :class="{ 'is-playing': mediaPlaying }"
                :data-tone="currentMediaTrack.tone"
                role="img"
                :aria-label="`${currentMediaTrack.title} cover artwork`"
              >
                <span class="media-art__disc"><i /></span>
                <span class="media-art__label">UI<br>SFX</span>
                <small>VOL. {{ String(mediaTrackIndex + 1).padStart(2, '0') }}</small>
              </div>

              <div class="media-copy">
                <div>
                  <p class="product-kicker">Now playing</p>
                  <h3>{{ currentMediaTrack.title }}</h3>
                  <p>{{ currentMediaTrack.artist }} · Interface studies</p>
                </div>

                <div class="media-wave" :class="{ 'is-playing': mediaPlaying }" aria-hidden="true">
                  <i v-for="index in 28" :key="index" :style="{ '--bar': ((index * 7) % 11 + 2) / 13, '--index': index }" />
                </div>

                <label class="media-range">
                  <span><small>Position</small><strong>{{ Math.round(mediaPosition) }}%</strong></span>
                  <input v-model.number="mediaPosition" type="range" min="0" max="100" aria-label="Playback position" @change="commitMediaSeek">
                </label>

                <div class="media-controls" aria-label="Playback controls">
                  <button type="button" aria-label="Previous track" @click="skipMedia(-1)"><SkipBack /></button>
                  <button class="media-controls__play" type="button" :aria-label="mediaPlaying ? 'Pause' : 'Play'" :aria-pressed="mediaPlaying" @click="toggleMediaPlayback">
                    <Pause v-if="mediaPlaying" />
                    <Play v-else />
                  </button>
                  <button type="button" aria-label="Next track" @click="skipMedia(1)"><SkipForward /></button>
                </div>

                <label class="media-volume">
                  <Volume2 aria-hidden="true" />
                  <span class="sr-only">Volume</span>
                  <input
                    v-model.number="mediaVolume"
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Volume"
                    :aria-valuetext="`${mediaVolume} percent`"
                    data-sfx-no-hover
                    @input="previewMediaVolume"
                  >
                  <strong>{{ mediaVolume }}%</strong>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" class="scenario-panel">
          <div class="demo-app demo-app--messages">
            <header class="chat-nav">
              <strong>Relay</strong>
              <div class="chat-channels" aria-label="Demo channels">
                <button type="button" :class="{ active: activeMessageChannel === 'sound-design' }" :aria-pressed="activeMessageChannel === 'sound-design'" @click="selectMessageChannel('sound-design')"># sound-design</button>
                <button type="button" :class="{ active: activeMessageChannel === 'launch' }" :aria-pressed="activeMessageChannel === 'launch'" @click="selectMessageChannel('launch')"># launch</button>
              </div>
              <button type="button" aria-label="Notify channel" @click="notifyTeam"><Bell /><span>Notify</span></button>
            </header>

            <div class="chat-stage">
              <header>
                <span><MessageCircle /><strong># {{ activeMessageChannel }}</strong></span>
                <small>3 teammates online</small>
              </header>

              <TransitionGroup name="message-enter" tag="div" class="message-list" aria-live="polite">
                <article v-for="message in messages" :key="message.id" :class="{ own: message.own }">
                  <span class="message-avatar" aria-hidden="true">{{ message.author.slice(0, 1) }}</span>
                  <div>
                    <small>{{ message.author }} · now</small>
                    <p>{{ message.text }}</p>
                    <button type="button" :class="{ reacted: message.reacted }" :aria-pressed="Boolean(message.reacted)" :aria-label="`React to ${message.author}'s message`" @click="toggleReaction(message)">✦ {{ message.reacted ? 1 : '' }}</button>
                  </div>
                </article>
              </TransitionGroup>

              <form class="message-composer" @submit.prevent="sendMessage">
                <button type="button" aria-label="Mention Mina" @click="mentionTeammate"><AtSign /></button>
                <Input v-model="messageDraft" aria-label="Message" :placeholder="`Message #${activeMessageChannel}`" @focus="sound('focus')" @input="onMessageInput" />
                <button class="message-send" type="submit" aria-label="Send message"><Send /></button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rewards" class="scenario-panel">
          <div class="demo-app demo-app--reward">
            <header class="reward-nav"><strong>Signal Run</strong><span>{{ gameStep }}/3 shards · 7 day streak 🔥</span></header>
            <div class="reward-stage">
              <div class="reward-orbit" :class="{ active: gameStep > 0, complete: rewardClaimed, advanced: gameLevelAdvanced }">
                <span class="orbit-ring orbit-ring--one" /><span class="orbit-ring orbit-ring--two" />
                <div class="reward-medal"><Trophy /><small>LVL</small><strong>{{ gameLevelAdvanced ? 8 : 7 }}</strong></div>
                <i v-for="index in 8" :key="index" :class="{ earned: index <= gameStep * 2 || rewardClaimed }" :style="{ '--index': index }" />
                <span v-if="gameBonusOpened" class="bonus-cache" aria-label="Bonus cache opened"><Gift /></span>
              </div>
              <div class="reward-copy">
                <p class="product-kicker">Interactive quest</p>
                <h3>{{ gameLevelAdvanced ? 'Level 8 is live.' : rewardClaimed ? 'Gate unlocked.' : gameStep === 0 ? 'Begin the signal run.' : gameStep < 3 ? 'Follow the bright trail.' : 'Final gate reached.' }}</h3>
                <p>{{ gameLevelAdvanced ? 'Replay the route to compare the same sequence in another sound feel.' : rewardClaimed ? 'The achievement is yours. Enter the next level when you are ready.' : 'Start the run, collect three signal shards, reveal the cache, and claim the level.' }}</p>
                <div class="reward-progress">
                  <span><strong>{{ rewardProgress }}%</strong><small>{{ gameStep }}/3 shards · {{ gameBonusOpened ? 'bonus found' : 'bonus hidden' }}</small></span>
                  <Progress :model-value="rewardProgress" aria-label="Progress to level 8" />
                </div>
                <div class="game-actions">
                  <Button :variant="gameStep === 0 ? 'accent' : 'outline'" @click="beginQuest"><Flag />{{ gameStep === 0 ? 'Start quest' : 'Quest active' }}</Button>
                  <Button variant="outline" @click="collectShard"><Gem />{{ gameStep >= 3 ? 'All shards found' : 'Find shard' }}</Button>
                  <Button variant="outline" @click="openBonus"><Gift />{{ gameBonusOpened ? 'Bonus opened' : 'Open bonus' }}</Button>
                  <Button v-if="!rewardClaimed" @click="claimReward"><Sparkles />{{ gameStep >= 3 ? 'Claim achievement' : 'Gate locked' }}</Button>
                  <Button v-else @click="advanceLevel"><Trophy />{{ gameLevelAdvanced ? 'Replay quest' : 'Enter level 8' }}</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <aside class="cue-trace" aria-label="Sound event trace">
        <header><span>Live cue trace</span><i :class="{ muted }" /></header>
        <TransitionGroup v-if="recentCues.length" name="cue-print" tag="div" class="cue-trace__events" aria-live="polite">
          <div v-for="(event, index) in recentCues" :key="event.id">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ event.cue }}</strong>
            <button type="button" :aria-label="`Replay ${event.cue}`" @click="sound(event.cue)">▶</button>
          </div>
        </TransitionGroup>
        <div v-else class="cue-trace__empty">
          <span>◎</span><p>Use the interface. Every meaningful state change will appear here.</p>
        </div>
        <div class="cue-trace__expected">
          <small>Typical sequence</small>
          <button v-for="cue in activeCueSequence" :key="cue" type="button" :aria-label="`Preview ${cue}`" @click="sound(cue)"><code>{{ cue }}</code></button>
        </div>
        <footer><span>{{ props.packLabel }}</span><code>ui.play('{{ recentCues[recentCues.length - 1]?.cue ?? 'select' }}')</code></footer>
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
  min-width: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16.5rem;
  border: 1px solid var(--ink);
  background: var(--paper-light);
}

.patterns-tabs,
.scenario-panel,
.demo-app { min-width: 0; max-width: 100%; }
.patterns-toolbar { min-width: 0; min-height: 4.25rem; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-lg); padding: var(--space-sm); border-bottom: 1px solid var(--ink); background: var(--paper-deep); }
.patterns-toolbar [data-slot='tabs-list'] { width: 100%; min-width: 0; max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; }
.patterns-toolbar [data-slot='tabs-trigger'] { min-height: 2.75rem; flex: none; scroll-snap-align: start; }
.patterns-toolbar > span { flex: none; display: inline-flex; align-items: center; gap: var(--space-xs); padding-inline: var(--space-sm); color: var(--ink-soft); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.patterns-toolbar > span i, .cue-trace header i { width: 0.55rem; aspect-ratio: 1; border-radius: 50%; background: oklch(0.68 0.16 142); box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.68 0.16 142), transparent 78%); }
.patterns-toolbar > span i.muted, .cue-trace header i.muted { background: var(--rule); box-shadow: none; }
.scenario-panel { margin: 0; }

.patterns-section :deep(button:not(:disabled)),
.patterns-section :deep([role='tab']:not([data-disabled])),
.patterns-section :deep([role='switch']:not([data-disabled])),
.patterns-section input[type='range'] { cursor: pointer; }
.patterns-section :deep(button:disabled) { cursor: not-allowed; }

.scenario-panel[data-state='active'] .demo-app { animation: scenario-enter 360ms var(--ease-out-expo) both; }

@keyframes scenario-enter {
  from { opacity: 0; transform: translate3d(0.8rem, 0, 0) scale(0.992); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

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
.saas-main { min-width: 0; display: grid; align-content: start; gap: var(--space-lg); padding: clamp(1.25rem, 4vw, 2.5rem); }
.workspace-topline { display: flex; align-items: end; justify-content: space-between; gap: var(--space-lg); }
.workspace-topline small, .task-module small, .upload-zone small, .preference-row small { color: var(--ink-soft); }
.workspace-topline h3 { margin: 0.2rem 0 0; font-size: 2rem; letter-spacing: -0.035em; }
.workspace-search { position: relative; width: min(15rem, 42%); }
.workspace-search > svg { position: absolute; z-index: 1; top: 50%; left: 0.75rem; width: 1rem; translate: 0 -50%; color: var(--ink-soft); }
.workspace-search input { padding-inline-start: 2.25rem; }
.task-module { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-md); padding: var(--space-lg); border: 1px solid var(--ink); background: var(--paper-light); box-shadow: 0.35rem 0.35rem 0 var(--paper-deep); transition: transform 220ms var(--ease-out-quart), box-shadow 220ms var(--ease-out-quart), background-color 220ms var(--ease-out-quart); }
.task-module__copy { min-width: 0; display: flex; align-items: center; gap: var(--space-md); }
.task-module__copy > div { display: grid; gap: var(--space-2xs); }
.task-module__copy strong,
.task-module__copy small,
.preference-row strong,
.preference-row small { overflow-wrap: anywhere; }
.task-icon { display: grid; width: 2.75rem; aspect-ratio: 1; place-items: center; background: var(--paper-deep); }
.task-icon svg { width: 1.2rem; }
.task-module [data-slot='progress'] { grid-column: 1 / -1; }
.task-module.is-running { transform: translateY(-0.12rem); box-shadow: 0.45rem 0.45rem 0 color-mix(in oklch, var(--accent), var(--paper-deep) 58%); }
.task-module.is-running .task-icon { animation: task-working 820ms ease-in-out infinite alternate; }
.task-module.is-ready { background: color-mix(in oklch, oklch(0.86 0.1 145), var(--paper-light) 84%); box-shadow: 0.35rem 0.35rem 0 color-mix(in oklch, oklch(0.68 0.16 142), transparent 28%); }
@keyframes task-working { to { transform: rotate(5deg) scale(1.08); } }
.saas-lower { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.upload-zone { min-width: 0; min-height: 10rem; display: grid; place-items: center; align-content: center; gap: var(--space-xs); padding: var(--space-lg); border: 1px dashed var(--ink); background: var(--paper); color: var(--ink); cursor: pointer; text-align: center; transition: background-color 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart); }
.upload-zone:hover { background: var(--paper-deep); }
.upload-zone > span { display: grid; width: 2.5rem; aspect-ratio: 1; place-items: center; border-radius: 50%; background: var(--accent); color: var(--paper-light); }
.upload-zone svg { width: 1.1rem; }
.upload-zone.is-queued > span { animation: upload-working 720ms ease-in-out infinite alternate; }
.upload-zone.is-complete { background: color-mix(in oklch, oklch(0.86 0.1 145), var(--paper-light) 78%); transform: translateY(-0.08rem); }
.upload-zone.is-complete > span { background: oklch(0.6 0.16 145); transform: scale(1.08); }
@keyframes upload-working { to { transform: translate3d(0, -0.22rem, 0) rotate(6deg); } }
.preference-row { min-height: 10rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); padding: var(--space-lg); border: 1px solid var(--rule); background: var(--paper-light); }
.preference-row > span { min-width: 0; display: flex; gap: var(--space-sm); }
.preference-row > span > span { display: grid; gap: var(--space-2xs); }
.preference-row svg { width: 1rem; }

.shop-nav { min-width: 0; min-height: 4rem; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding-inline: var(--space-xl); border-bottom: 1px solid var(--ink); }
.shop-nav > strong { letter-spacing: -0.04em; }
.shop-nav nav { display: flex; gap: var(--space-lg); color: var(--ink-soft); font-size: 0.75rem; }
.shop-nav button { justify-self: end; display: inline-flex; align-items: center; gap: 0.35rem; border: 0; background: transparent; cursor: pointer; font-weight: 700; }
.shop-nav svg { width: 1rem; }
.product-stage { min-width: 0; min-height: 34rem; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr); }
.product-visual { position: relative; min-height: 34rem; overflow: hidden; background: oklch(0.7 0.19 44); }
.product-visual::before { content: ''; position: absolute; width: 20rem; aspect-ratio: 1; top: 50%; left: 50%; translate: -50% -48%; border: 2.4rem solid var(--ink); border-bottom-color: transparent; border-radius: 50%; rotate: -5deg; }
.headphone-band { position: absolute; width: 14rem; height: 14rem; top: 50%; left: 50%; translate: -50% -52%; border: 1.2rem solid var(--paper-light); border-bottom-color: transparent; border-radius: 50%; rotate: -5deg; }
.headphone-cup { position: absolute; width: 5.5rem; height: 8rem; top: 54%; border: 0.8rem solid var(--paper-light); border-radius: 2.5rem; background: var(--ink); rotate: -5deg; }
.headphone-cup--left { left: calc(50% - 9rem); }
.headphone-cup--right { right: calc(50% - 9rem); }
.product-visual small { position: absolute; right: var(--space-lg); bottom: var(--space-lg); padding: 0.35rem 0.5rem; background: var(--paper-light); font-weight: 700; letter-spacing: 0.08em; }
.product-copy { min-width: 0; display: grid; align-content: center; gap: var(--space-lg); padding: clamp(2rem, 6vw, 4.5rem); background: var(--paper-light); }
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

.counter-pop-enter-active,
.counter-pop-leave-active { transition: opacity 140ms ease-out, transform 180ms var(--ease-out-quart); }
.counter-pop-enter-from { opacity: 0; transform: translate3d(0, 0.4rem, 0) scale(0.7); }
.counter-pop-leave-to { opacity: 0; transform: translate3d(0, -0.3rem, 0) scale(0.7); }

.demo-app--media { background: oklch(0.235 0.025 55); color: var(--paper-light); }
.demo-app--media .demo-app__bar { border-color: color-mix(in oklch, var(--paper-light), transparent 80%); }
.demo-app--media .demo-app__bar > span { color: color-mix(in oklch, var(--paper-light), transparent 42%); }
.media-stage { min-width: 0; min-height: 34.5rem; display: grid; grid-template-columns: minmax(18rem, 0.9fr) minmax(20rem, 1.1fr); }
.media-art { position: relative; min-width: 0; min-height: 34.5rem; display: grid; place-items: center; overflow: hidden; isolation: isolate; background: oklch(0.67 0.18 42); }
.media-art[data-tone='violet'] { background: oklch(0.53 0.17 302); }
.media-art[data-tone='mint'] { background: oklch(0.69 0.12 170); }
.media-art::before,
.media-art::after { content: ''; position: absolute; z-index: -1; width: 28rem; aspect-ratio: 1; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 58%); border-radius: 50%; }
.media-art::after { width: 18rem; border-style: dashed; transform: rotate(18deg); }
.media-art__disc { position: relative; width: min(19rem, 68%); aspect-ratio: 1; display: grid; place-items: center; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 40%); border-radius: 50%; background: repeating-radial-gradient(circle, var(--ink) 0 2px, oklch(0.27 0.025 55) 3px 6px); box-shadow: 0 1.25rem 3rem color-mix(in oklch, var(--ink), transparent 48%); }
.media-art__disc::before { content: ''; width: 31%; aspect-ratio: 1; border-radius: 50%; background: var(--paper-light); box-shadow: 0 0 0 1.1rem color-mix(in oklch, var(--accent), transparent 12%); }
.media-art__disc i { position: absolute; width: 0.65rem; aspect-ratio: 1; border-radius: 50%; background: var(--ink); }
.media-art.is-playing .media-art__disc { animation: record-spin 5s linear infinite; }
.media-art__label { position: absolute; left: var(--space-lg); bottom: var(--space-lg); font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 900; letter-spacing: -0.08em; line-height: 0.72; }
.media-art > small { position: absolute; top: var(--space-lg); right: var(--space-lg); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; }
@keyframes record-spin { to { transform: rotate(360deg); } }

.media-copy { min-width: 0; display: grid; align-content: center; gap: var(--space-lg); padding: clamp(2rem, 5vw, 4rem); }
.media-copy > div:first-child { display: grid; gap: var(--space-xs); }
.media-copy h3 { margin: 0; font-size: clamp(2.8rem, 5vw, 4.5rem); letter-spacing: -0.055em; line-height: 0.95; }
.media-copy p { margin: 0; color: color-mix(in oklch, var(--paper-light), transparent 40%); }
.media-copy .product-kicker { color: oklch(0.82 0.14 72); }
.media-wave { height: 3.4rem; display: flex; align-items: center; gap: 3px; overflow: hidden; color: oklch(0.82 0.14 72); }
.media-wave i { width: max(2px, calc(100% / 40)); height: calc(0.25rem + var(--bar) * 2.7rem); display: block; background: currentColor; opacity: 0.7; transform-origin: center; }
.media-wave.is-playing i { animation: player-meter 620ms ease-in-out infinite alternate; animation-delay: calc(var(--index) * -34ms); }
@keyframes player-meter { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
.media-range { display: grid; gap: var(--space-xs); }
.media-range > span { display: flex; align-items: center; justify-content: space-between; }
.media-range small { color: color-mix(in oklch, var(--paper-light), transparent 45%); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
.media-range input,
.media-volume input { width: 100%; accent-color: oklch(0.82 0.14 72); }
.media-controls { display: flex; align-items: center; justify-content: center; gap: var(--space-md); }
.media-controls button { width: 2.75rem; aspect-ratio: 1; display: grid; place-items: center; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 56%); border-radius: 50%; background: transparent; color: var(--paper-light); transition: background-color 180ms var(--ease-out-quart), color 180ms var(--ease-out-quart), transform 180ms var(--ease-out-quart); }
.media-controls button:hover { background: var(--paper-light); color: var(--ink); transform: translateY(-0.1rem); }
.media-controls button:active { transform: translateY(0.08rem) scale(0.96); }
.media-controls button svg { width: 1.1rem; }
.media-controls .media-controls__play { width: 4rem; border-color: var(--paper-light); background: var(--paper-light); color: var(--ink); }
.media-controls .media-controls__play svg { width: 1.35rem; }
.media-volume { display: grid; grid-template-columns: auto minmax(0, 1fr) 2rem; align-items: center; gap: var(--space-sm); color: color-mix(in oklch, var(--paper-light), transparent 30%); }
.media-volume > svg { width: 1rem; }
.media-volume strong { font-size: 0.7rem; font-variant-numeric: tabular-nums; text-align: end; }

.demo-app--messages { background: var(--paper); }
.chat-nav { min-width: 0; min-height: 4rem; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-lg); padding-inline: var(--space-lg); border-bottom: 1px solid var(--ink); background: var(--ink); color: var(--paper-light); }
.chat-nav > strong { letter-spacing: -0.03em; }
.chat-channels { min-width: 0; display: flex; justify-content: center; gap: var(--space-xs); overflow-x: auto; }
.chat-channels button,
.chat-nav > button { min-height: 2.75rem; border: 0; background: transparent; color: color-mix(in oklch, var(--paper-light), transparent 45%); font-size: 0.72rem; }
.chat-channels button { flex: none; padding-inline: var(--space-sm); }
.chat-channels button:hover,
.chat-channels button.active { background: color-mix(in oklch, var(--paper-light), transparent 88%); color: var(--paper-light); }
.chat-nav > button { display: inline-flex; align-items: center; gap: var(--space-xs); color: var(--paper-light); }
.chat-nav > button svg { width: 1rem; }
.chat-stage { min-width: 0; min-height: 34.5rem; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.chat-stage > header { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); padding-inline: clamp(1rem, 4vw, 2.5rem); border-bottom: 1px solid var(--rule); }
.chat-stage > header > span { min-width: 0; display: flex; align-items: center; gap: var(--space-xs); }
.chat-stage > header svg { width: 1rem; }
.chat-stage > header small { color: var(--ink-soft); }
.message-list { min-width: 0; display: grid; align-content: start; gap: var(--space-md); padding: clamp(1rem, 4vw, 2.5rem); overflow: hidden; }
.message-list article { min-width: 0; display: flex; align-items: start; gap: var(--space-sm); }
.message-list article.own { flex-direction: row-reverse; }
.message-avatar { width: 2.5rem; aspect-ratio: 1; flex: none; display: grid; place-items: center; border: 1px solid var(--ink); border-radius: 50%; background: var(--paper-deep); font-size: 0.72rem; font-weight: 700; }
.message-list article > div { min-width: 0; max-width: min(34rem, 78%); display: grid; justify-items: start; gap: var(--space-2xs); padding: var(--space-sm) var(--space-md); border: 1px solid var(--rule); background: var(--paper-light); }
.message-list article.own > div { justify-items: end; background: color-mix(in oklch, var(--accent), var(--paper-light) 90%); }
.message-list small { color: var(--ink-soft); font-size: 0.65rem; }
.message-list p { margin: 0; overflow-wrap: anywhere; line-height: 1.5; }
.message-list article button { min-width: 2.75rem; min-height: 1.8rem; padding-inline: var(--space-xs); border: 0; background: transparent; color: var(--ink-soft); text-align: start; }
.message-list article button:hover,
.message-list article button.reacted { color: var(--accent-dark); transform: scale(1.06); }
.message-composer { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-xs); margin: 0 clamp(1rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem); padding: var(--space-xs); border: 1px solid var(--ink); background: var(--paper-light); box-shadow: 0.3rem 0.3rem 0 var(--paper-deep); }
.message-composer > button { width: 2.75rem; aspect-ratio: 1; display: grid; place-items: center; border: 0; background: transparent; color: var(--ink-soft); }
.message-composer > button:hover { background: var(--paper-deep); color: var(--ink); }
.message-composer > button svg { width: 1rem; }
.message-composer .message-send { background: var(--ink); color: var(--paper-light); }
.message-composer input { min-width: 0; border: 0; box-shadow: none; }
.message-enter-enter-active { transition: opacity 200ms ease-out, transform 260ms var(--ease-out-quart); }
.message-enter-enter-from { opacity: 0; transform: translate3d(0, 0.7rem, 0); }

.demo-app--reward { background: oklch(0.25 0.045 176); color: oklch(0.965 0.015 82); }
.reward-nav { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; padding-inline: var(--space-xl); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.reward-nav span { font-size: 0.75rem; }
.reward-stage { min-width: 0; min-height: 34rem; display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 0.8fr); align-items: center; gap: clamp(2rem, 5vw, 5rem); padding: clamp(2rem, 6vw, 5rem); }
.reward-orbit { position: relative; width: min(25rem, 100%); aspect-ratio: 1; display: grid; place-items: center; justify-self: center; }
.orbit-ring { position: absolute; inset: 6%; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 60%); border-radius: 50%; transition: border-color 280ms var(--ease-out-quart), opacity 280ms var(--ease-out-quart); }
.orbit-ring--two { inset: 19%; border-style: dashed; rotate: 20deg; }
.reward-orbit.active .orbit-ring--one { animation: orbit-turn 12s linear infinite; }
.reward-orbit.active .orbit-ring--two { animation: orbit-turn-reverse 9s linear infinite; }
.reward-medal { position: relative; z-index: 2; width: 10rem; aspect-ratio: 1; display: grid; place-items: center; align-content: center; gap: 0.15rem; border: 0.7rem solid oklch(0.78 0.17 77); border-radius: 50%; background: var(--accent); color: var(--paper-light); box-shadow: 0 0 0 1rem color-mix(in oklch, var(--accent), transparent 78%); transition: transform 420ms var(--ease-out-expo), box-shadow 420ms var(--ease-out-expo), background-color 280ms var(--ease-out-quart); }
.active .reward-medal { transform: scale(1.035); }
.complete .reward-medal { transform: scale(1.11) rotate(-4deg); box-shadow: 0 0 0 1.25rem color-mix(in oklch, oklch(0.78 0.17 77), transparent 72%), 0 1.5rem 3.5rem color-mix(in oklch, var(--ink), transparent 62%); }
.advanced .reward-medal { transform: scale(1.12) rotate(4deg); background: oklch(0.58 0.18 300); }
.reward-medal svg { width: 2rem; }
.reward-medal small { font-size: 0.6rem; letter-spacing: 0.12em; }
.reward-medal strong { font-size: 2.2rem; line-height: 1; }
.reward-orbit > i { --angle: calc(var(--index) * 45deg); position: absolute; top: calc(50% + sin(var(--angle)) * 43%); left: calc(50% + cos(var(--angle)) * 43%); width: 0.7rem; aspect-ratio: 1; border: 1px solid color-mix(in oklch, var(--paper-light), transparent 38%); border-radius: 50%; background: transparent; opacity: 0.45; transform: translate(-50%, -50%) scale(0.78); transition: opacity 220ms ease-out, transform 360ms var(--ease-out-expo), background-color 220ms ease-out, box-shadow 220ms ease-out; }
.reward-orbit > i.earned { background: oklch(0.78 0.17 77); border-color: oklch(0.78 0.17 77); box-shadow: 0 0 0 0.35rem color-mix(in oklch, oklch(0.78 0.17 77), transparent 82%); opacity: 1; transform: translate(-50%, -50%) scale(1); }
.bonus-cache { position: absolute; z-index: 3; right: 11%; bottom: 14%; width: 3.5rem; aspect-ratio: 1; display: grid; place-items: center; border: 1px solid var(--paper-light); border-radius: 50%; background: oklch(0.78 0.17 77); color: var(--ink); box-shadow: 0.5rem 0.5rem 0 color-mix(in oklch, var(--ink), transparent 45%); animation: bonus-pop 520ms var(--ease-out-expo) both; }
.bonus-cache svg { width: 1.25rem; }
.reward-copy { min-width: 0; display: grid; align-content: center; justify-items: start; gap: var(--space-lg); }
.reward-copy .product-kicker { color: oklch(0.82 0.14 77); }
.reward-copy > p:not(.product-kicker) { color: color-mix(in oklch, var(--paper-light), transparent 28%); }
.reward-progress { width: 100%; display: grid; gap: var(--space-sm); }
.reward-progress > span { min-width: 0; display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-sm); }
.reward-progress small { color: color-mix(in oklch, var(--paper-light), transparent 40%); }
.game-actions { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-sm); }
.game-actions [data-slot='button'] { width: 100%; min-width: 0; justify-content: flex-start; overflow: hidden; text-overflow: ellipsis; }
@keyframes orbit-turn { to { transform: rotate(360deg); } }
@keyframes orbit-turn-reverse { to { transform: rotate(-360deg); } }
@keyframes bonus-pop { from { opacity: 0; transform: translate3d(0.7rem, 0.7rem, 0) scale(0.35) rotate(18deg); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); } }

.cue-trace { min-width: 0; display: grid; grid-template-rows: auto minmax(13rem, 1fr) auto auto; border-inline-start: 1px solid var(--ink); background: var(--ink); color: var(--paper-light); }
.cue-trace header { min-width: 0; min-height: 4.25rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); padding-inline: var(--space-md); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.cue-trace__events { min-width: 0; display: grid; align-content: start; }
.cue-trace__events > div { min-height: 3.5rem; display: grid; grid-template-columns: 2rem 1fr auto; align-items: center; gap: var(--space-xs); padding-inline: var(--space-md); border-bottom: 1px solid color-mix(in oklch, var(--paper-light), transparent 86%); }
.cue-trace__events span { color: color-mix(in oklch, var(--paper-light), transparent 52%); font-size: 0.6rem; }
.cue-trace__events strong { min-width: 0; overflow: hidden; font-size: 0.78rem; text-overflow: ellipsis; }
.cue-trace__events button { width: 2.75rem; min-height: 2.75rem; display: grid; place-items: center; border: 0; background: transparent; color: var(--accent); cursor: pointer; transition: background-color 160ms ease-out, transform 160ms var(--ease-out-quart); }
.cue-trace__events button:hover { background: color-mix(in oklch, var(--paper-light), transparent 90%); transform: scale(1.05); }
.cue-trace__empty { display: grid; place-items: center; align-content: center; gap: var(--space-sm); padding: var(--space-lg); color: color-mix(in oklch, var(--paper-light), transparent 48%); text-align: center; }
.cue-trace__empty span { font-size: 2rem; }
.cue-trace__empty p { margin: 0; font-size: 0.75rem; line-height: 1.5; }
.cue-trace__expected { min-width: 0; display: flex; flex-wrap: wrap; align-content: start; gap: var(--space-xs); padding: var(--space-md); border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.cue-trace__expected small { flex-basis: 100%; color: color-mix(in oklch, var(--paper-light), transparent 52%); font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; }
.cue-trace__expected button { min-width: 0; min-height: 2rem; padding: 0; border: 0; background: transparent; color: inherit; }
.cue-trace__expected code { display: block; max-width: 100%; overflow: hidden; padding: 0.35rem 0.5rem; background: color-mix(in oklch, var(--paper-light), transparent 90%); font-size: 0.62rem; text-overflow: ellipsis; white-space: nowrap; transition: background-color 160ms ease-out, color 160ms ease-out, transform 160ms var(--ease-out-quart); }
.cue-trace__expected button:hover code { background: var(--accent); color: var(--ink); transform: translateY(-0.08rem); }
.cue-trace footer { min-width: 0; display: grid; gap: var(--space-xs); padding: var(--space-md); border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
.cue-trace footer span { color: var(--accent); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.cue-trace footer code { min-width: 0; overflow: hidden; color: color-mix(in oklch, var(--paper-light), transparent 22%); font-size: 0.66rem; text-overflow: ellipsis; white-space: nowrap; }
.cue-print-enter-active, .cue-print-leave-active { transition: opacity 180ms ease-out, transform 220ms var(--ease-out-quart); }
.cue-print-enter-from { opacity: 0; transform: translate3d(0.65rem, 0, 0); }
.cue-print-leave-to { opacity: 0; transform: translate3d(-0.45rem, 0, 0); }

@media (max-width: 72rem) {
  .patterns-lab { grid-template-columns: minmax(0, 1fr); }
  .cue-trace { grid-template-columns: 11rem minmax(0, 1fr); grid-template-rows: auto auto auto; border-block-start: 1px solid var(--ink); border-inline-start: 0; }
  .cue-trace header { grid-column: 1; grid-row: 1; }
  .cue-trace__events, .cue-trace__empty { grid-column: 2; grid-row: 1 / 3; min-width: 0; min-height: 7rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); align-content: stretch; }
  .cue-trace__events > div { min-width: 0; grid-template-columns: 1.5rem minmax(0, 1fr) 2.75rem; border-bottom: 0; border-inline-start: 1px solid color-mix(in oklch, var(--paper-light), transparent 86%); }
  .cue-trace__expected { grid-column: 1; grid-row: 2; border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
  .cue-trace footer { grid-column: 1 / -1; grid-row: 3; grid-template-columns: auto minmax(0, 1fr); align-items: center; border-top: 1px solid color-mix(in oklch, var(--paper-light), transparent 78%); }
}

@media (max-width: 52rem) {
  .patterns-heading { grid-template-columns: 1fr; align-items: start; }
  .patterns-toolbar { grid-template-columns: minmax(0, 1fr); align-items: stretch; gap: var(--space-xs); }
  .patterns-toolbar [data-slot='tabs-list'] { width: 100%; overflow-x: auto; }
  .patterns-toolbar [data-slot='tabs-trigger'] { flex: none; }
  .patterns-toolbar > span { min-height: 2rem; }
  .saas-layout, .product-stage, .reward-stage, .media-stage { grid-template-columns: minmax(0, 1fr); }
  .mini-sidebar { display: none; }
  .product-visual { min-height: 22rem; }
  .media-art { min-height: 23rem; }
  .media-copy { padding: 2.25rem clamp(1.25rem, 6vw, 2.5rem); }
  .chat-nav { gap: var(--space-xs); padding-inline: var(--space-sm); }
  .chat-channels { justify-content: start; }
  .chat-stage > header { min-height: 3.5rem; }
  .reward-stage { padding-block: 3rem; }
  .reward-orbit { max-width: 19rem; }
  .cue-trace { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto auto auto; }
  .cue-trace header { grid-column: 1; grid-row: 1; }
  .cue-trace__events, .cue-trace__empty { grid-column: 1; grid-row: 2; min-height: 4.25rem; display: flex; overflow-x: auto; overscroll-behavior-inline: contain; }
  .cue-trace__events > div { flex: 0 0 10rem; border-inline-start: 0; border-inline-end: 1px solid color-mix(in oklch, var(--paper-light), transparent 86%); }
  .cue-trace__empty { display: grid; }
  .cue-trace__expected { grid-column: 1; grid-row: 3; overflow: hidden; }
  .cue-trace footer { grid-column: 1; grid-row: 4; }
}

@media (max-width: 38rem) {
  .patterns-section { width: 100%; }
  .patterns-heading { width: calc(100% - 2rem); margin-inline: auto; }
  .patterns-heading h2 { font-size: clamp(3rem, 16vw, 4.6rem); }
  .patterns-lab { border-inline: 0; }
  .patterns-toolbar [data-slot='tabs-list'] { display: flex; scroll-snap-type: x proximity; }
  .patterns-toolbar [data-slot='tabs-trigger'] { flex: none; white-space: nowrap; }
  .workspace-topline { align-items: stretch; flex-direction: column; }
  .workspace-search { width: 100%; }
  .task-module { grid-template-columns: 1fr; }
  .task-module [data-slot='button'] { width: 100%; }
  .task-module [data-slot='progress'] { grid-column: 1; }
  .saas-lower { grid-template-columns: 1fr; }
  .shop-nav nav { display: none; }
  .product-copy { padding: 2rem 1.25rem; }
  .product-actions [data-slot='button'] { flex: 1; }
  .media-art { min-height: 19rem; }
  .media-art__disc { width: min(14rem, 62%); }
  .media-copy { padding-inline: 1.25rem; }
  .chat-nav > button span { display: none; }
  .chat-stage > header small { display: none; }
  .message-list article > div { max-width: 82%; }
  .message-composer { margin-inline: 0.75rem; }
  .reward-stage { padding: 2.5rem 1.25rem; }
  .reward-nav { padding-inline: var(--space-md); }
  .reward-nav span { max-width: 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .game-actions { grid-template-columns: minmax(0, 1fr); }
  .cue-trace__expected { flex-wrap: nowrap; overflow-x: auto; }
  .cue-trace__expected small { position: sticky; left: 0; z-index: 1; flex: none; display: grid; align-items: center; padding-inline-end: var(--space-xs); background: var(--ink); }
}

@media (prefers-reduced-motion: reduce) {
  .scenario-panel[data-state='active'] .demo-app,
  .upload-zone.is-queued > span,
  .media-art.is-playing .media-art__disc,
  .media-wave.is-playing i,
  .reward-orbit.active .orbit-ring--one,
  .reward-orbit.active .orbit-ring--two,
  .bonus-cache { animation: none; }
  .reward-medal,
  .reward-orbit > i,
  [data-slot='progress'] > * { transition: none; }
}
</style>
