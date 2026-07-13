<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const modelValue = useVModel(props, 'modelValue', emits, { passive: true, defaultValue: props.defaultValue })
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="cn('h-10 w-full min-w-0 rounded-[0.3rem] border border-[var(--rule)] bg-[var(--paper-light)] px-3 text-base text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-soft)] focus-visible:border-[var(--ink)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklch,var(--accent),transparent_72%)] disabled:opacity-45 md:text-sm', props.class)"
  >
</template>
