<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="uisfx-mark" :class="{ 'uisfx-mark--compact': compact }" aria-label="UI SFX">
    <span class="uisfx-mark__word">ui sfx</span>
    <span class="uisfx-mark__wave" aria-hidden="true"><i /><i /><i /></span>
  </span>
</template>
