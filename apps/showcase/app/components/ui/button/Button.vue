<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), { as: 'button' })
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant ?? 'default'"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>

<style scoped>
[data-slot='button'][data-variant='default'] { color: var(--paper-light); }
[data-slot='button'][data-variant='accent'] { color: var(--paper-light); }
[data-slot='button'][data-variant='destructive'] { color: var(--paper-light); }
[data-slot='button'][data-variant='outline'],
[data-slot='button'][data-variant='ghost'] { color: var(--ink); }
</style>
