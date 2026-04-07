import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  plugins: [react()],

  build: {
    // No source maps in production — prevents reverse engineering of minified output
    sourcemap: false,
    // esbuild minifier: fast and tree-shaking friendly
    minify: 'esbuild' as const,
  },

  preview: {
    port: 3000,
    host: true,
  },
}))
