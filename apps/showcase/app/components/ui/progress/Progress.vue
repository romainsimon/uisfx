<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(), { modelValue: 0 })
</script>

<template>
  <ProgressRoot v-bind="reactiveOmit(props, 'class')" data-slot="progress" :class="cn('relative h-2 w-full overflow-hidden bg-[var(--paper-deep)]', props.class)">
    <ProgressIndicator class="h-full w-full bg-[var(--accent)] transition-transform duration-300" :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%)`" />
  </ProgressRoot>
</template>
