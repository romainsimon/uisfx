<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsList } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <TabsList v-bind="reactiveOmit(props, 'class')" data-slot="tabs-list" :class="cn('inline-flex w-fit items-center border border-[var(--ink)] bg-[var(--paper-deep)] p-1', props.class)">
    <slot />
  </TabsList>
</template>
