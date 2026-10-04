import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['new-logo-full.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Progress',
        short_name: 'Progress',
        description: 'wellness, routine, progress',
        theme_color: '#4c6056',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png',     sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png',     sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
