<script setup lang="ts">
defineProps<{
  source: 'github' | 'npm'
}>()
</script>

<template>
  <svg
    class="source-brand-icon"
    :class="{ 'source-brand-icon--npm': source === 'npm' }"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="source === 'github'"
      fill="currentColor"
      d="M12 .3a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.69.83.57A12 12 0 0 0 12 .3Z"
    />
    <path
      v-else
      fill="currentColor"
      fill-rule="evenodd"
      d="M0 0h24v24H0V0Zm4.8 4.8v14.4H12V9.6h2.4v9.6h4.8V4.8H4.8Z"
      clip-rule="evenodd"
    />
  </svg>
</template>
