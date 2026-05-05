import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 清理了对旧 svg 图标的引用，只包含猫猫图
      includeAssets: ['pwa-512x512.png'], 
      manifest: {
        name: 'Jihua Planner',
        short_name: 'Planner',
        description: '我的专属猫猫计划表',
        theme_color: '#FFFBF8',
        background_color: '#FFFBF8',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})