import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'hatches.json'], // Tell it exactly what static assets to cache
      manifest: {
        name: 'Hatch Matcher Matrix',
        short_name: 'HatchMatcher',
        description: 'Streamside entomology and fly tying recipe database.',
        theme_color: '#141417',
        background_color: '#141417',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // This prevents the PWA builder from crashing if an asset pattern is temporarily empty
        globPatterns: ['**/*.{js,css,html}', 'hatches.json'],
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
});
