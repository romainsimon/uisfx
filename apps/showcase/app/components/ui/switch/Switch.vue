<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<SwitchRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <SwitchRoot v-slot="slotProps" v-bind="forwarded" data-slot="switch" :class="cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[var(--ink)] bg-[var(--paper-deep)] p-0.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[var(--accent)] data-[state=checked]:bg-[var(--accent)] disabled:opacity-45', props.class)">
    <SwitchThumb class="pointer-events-none block size-4 rounded-full bg-[var(--ink)] transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-[var(--paper-light)] data-[state=unchecked]:translate-x-0">
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
