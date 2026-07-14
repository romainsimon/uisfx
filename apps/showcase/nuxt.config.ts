import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  devtools: { enabled: false },
  features: {
    // Social crawlers should reach the page metadata before any component CSS.
    // X is particularly sensitive to large SSR heads and may stop parsing early.
    inlineStyles: false,
  },
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/': {
      headers: {
        Link: '</llms.txt>; rel="alternate"; type="text/plain", </docs/agent-guide.md>; rel="alternate"; type="text/markdown"',
      },
    },
    '/ui-sound-design': {
      headers: {
        Link: '</llms.txt>; rel="alternate"; type="text/plain", </docs/agent-guide.md>; rel="alternate"; type="text/markdown"',
      },
    },
    '/og-ui-sound-design.png': {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    },
    '/og-ui-sound-design-936.jpg': {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    },
    '/og-ui-sound-effects-v2.jpg': {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    },
    '/og-ui-sound-effects-v3.jpg': {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'UI Sound Design: 936 Interface Sound Effects | UI SFX',
      meta: [
        { name: 'description', content: 'Preview 936 open-source UI sound effects for web, mobile, SaaS, and games. Compare 12 sonic styles, one-shots, and seamless loops.' },
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
