<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <NuxtPage />
  <Toaster position="bottom-right" :duration="3600" close-button rich-colors />
</template>
