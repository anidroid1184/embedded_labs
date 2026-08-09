import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'spa-fallback-404',
      closeBundle() {
        const dist = path.resolve(__dirname, 'dist')
        const index = path.join(dist, 'index.html')
        const notFound = path.join(dist, '404.html')
        try {
          copyFileSync(index, notFound)
          writeFileSync(path.join(dist, '.nojekyll'), '')
        } catch {
          // ignore if dist/index.html is missing
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
