import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'hatches.json', 'recipes.json'],
      manifest: {
        name: 'Hatch Matcher',
        short_name: 'HatchMatcher',
        description: 'Streamside fly selection guide — works offline.',
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
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        skipWaiting: true,
        clientsClaim: true,
        // Cache the JSON data files with a cache-first strategy so they work offline
        runtimeCaching: [
          {
            urlPattern: /\/(hatches|recipes)\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hatch-data-v1',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
