<script setup lang="ts">
import type { DialogTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogTitle, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()
const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template><DialogTitle v-bind="forwarded" data-slot="dialog-title" :class="cn('pr-8 text-2xl font-bold leading-tight tracking-[-0.025em]', props.class)"><slot /></DialogTitle></template>
