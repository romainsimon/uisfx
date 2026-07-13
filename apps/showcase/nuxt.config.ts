import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: false },
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/': { redirect: { to: '/ui-sound-design', statusCode: 301 } },
  },
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
      title: 'UI Sound Design: 858 Interface Sound Effects | UI SFX',
      meta: [
        { name: 'description', content: 'Preview 858 open-source UI sound effects for web, mobile, SaaS, and games. Compare 11 sonic styles, one-shots, and seamless loops.' },
        { name: 'theme-color', content: '#f5eddd' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://stats.yukicapital.com', crossorigin: 'anonymous' },
      ],
      script: [
        {
          innerHTML: 'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}',
        },
        {
          src: 'https://stats.yukicapital.com/js/script.js',
          defer: true,
          'data-domain': 'uisfx.com',
        },
      ],
    },
  },
})
