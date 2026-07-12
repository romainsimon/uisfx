import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    server: { allowedHosts: ['.trycloudflare.com'] },
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'UI Sound Design & Interface Sound Effects Library | UI SFX',
      meta: [
        { name: 'description', content: 'Explore 780 open-source UI sound effects for web, mobile, SaaS, and games. Preview 10 styles, compare one-shots and loops, then install UI SFX.' },
        { name: 'theme-color', content: '#f5eddd' },
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },
})
