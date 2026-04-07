import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    // No source maps in production — prevents reverse engineering of minified output
    sourcemap: false,
    // esbuild minifier: fast and tree-shaking friendly
    minify: 'esbuild',
  },

  esbuild: {
    // Strip console.* and debugger statements from production bundles only.
    // In dev mode (npm run dev) logs are preserved for debugging.
    drop: mode === 'production' ? (['console', 'debugger'] as const) : [],
  },

  preview: {
    port: 3000,
    host: true,
  },
}))
