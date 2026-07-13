<script setup lang="ts">
import type { ToasterProps } from 'vue-sonner'
import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from '@lucide/vue'
import { Toaster as Sonner } from 'vue-sonner'
import { cn } from '@/lib/utils'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    v-bind="props"
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--paper-light)',
      '--normal-text': 'var(--ink)',
      '--normal-border': 'var(--ink)',
      '--border-radius': '0.3rem',
    }"
  >
    <template #success-icon><CircleCheck class="size-4" /></template>
    <template #info-icon><Info class="size-4" /></template>
    <template #warning-icon><TriangleAlert class="size-4" /></template>
    <template #error-icon><OctagonX class="size-4" /></template>
    <template #loading-icon><LoaderCircle class="size-4 animate-spin" /></template>
  </Sonner>
</template>
