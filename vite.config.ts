import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages project site when GITHUB_PAGES=true; "/" for local dev
  base: process.env.GITHUB_PAGES === 'true' || process.env.VITE_BASE
    ? process.env.VITE_BASE || '/pokemon-collectr/'
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
