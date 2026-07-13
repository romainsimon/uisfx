<script setup lang="ts">
import { computed } from 'vue'
import { createRecipe, renderRecipe, type CueName, type PackName } from 'uisfx'

const props = withDefaults(defineProps<{
  cue: CueName
  pack: PackName
  points?: number
}>(), { points: 44 })

const bars = computed(() => {
  const sound = renderRecipe(createRecipe(props.pack, props.cue), 4_000)
  const count = props.points
  const framesPerBar = Math.max(1, Math.floor(sound.left.length / count))
  const values = Array.from({ length: count }, (_, index) => {
    let peak = 0
    const start = index * framesPerBar
    const end = Math.min(sound.left.length, start + framesPerBar)
    for (let frame = start; frame < end; frame += 1) {
      peak = Math.max(peak, Math.abs(sound.left[frame] ?? 0), Math.abs(sound.right[frame] ?? 0))
    }
    return Math.max(0.06, peak)
  })
  const max = Math.max(...values)
  return values.map((value) => value / max)
})
</script>

<template>
  <span class="waveform" aria-hidden="true">
    <i v-for="(bar, index) in bars" :key="index" :style="{ '--bar': bar }" />
  </span>
</template>
