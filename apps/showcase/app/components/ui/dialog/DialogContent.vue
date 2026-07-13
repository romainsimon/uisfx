<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { X } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
import DialogOverlay from './DialogOverlay.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<DialogContentProps & { class?: HTMLAttributes['class'], showCloseButton?: boolean }>(), { showCloseButton: true })
const emits = defineEmits<DialogContentEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'showCloseButton'), emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent v-bind="{ ...$attrs, ...forwarded }" data-slot="dialog-content" :class="cn('fixed left-1/2 top-1/2 z-50 grid w-[min(calc(100%-2rem),30rem)] -translate-x-1/2 -translate-y-1/2 gap-5 border border-[var(--ink)] bg-[var(--paper-light)] p-6 text-[color:var(--ink)] shadow-[0.75rem_0.75rem_0_var(--accent)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95', props.class)">
      <slot />
      <DialogClose v-if="showCloseButton" class="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[color:var(--ink-soft)] outline-none hover:bg-[var(--paper-deep)] hover:text-[color:var(--ink)] focus-visible:ring-3 focus-visible:ring-[var(--accent)]">
        <X class="size-4" /><span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
