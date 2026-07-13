<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <TabsTrigger v-bind="forwarded" data-slot="tabs-trigger" :class="cn('inline-flex h-11 cursor-pointer items-center justify-center gap-2 px-3 text-sm font-bold text-[color:var(--ink-soft)] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[var(--accent)] data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[color:var(--paper-light)] disabled:cursor-not-allowed disabled:opacity-45', props.class)">
    <slot />
  </TabsTrigger>
</template>

<style scoped>
[data-slot='tabs-trigger'] { color: var(--ink-soft); }
[data-slot='tabs-trigger'][data-state='active'] { color: var(--paper-light); }
</style>
