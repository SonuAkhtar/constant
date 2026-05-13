import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['new-logo-full.png', 'new-logo-c-only.png'],
      manifest: {
        name: 'Constant',
        short_name: 'Constant',
        description: 'wellness, routine, progress',
        theme_color: '#4c6056',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'new-logo-full.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'new-logo-full.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
