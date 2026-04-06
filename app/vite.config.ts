import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Leittner-Quest/',
  plugins: [react()],
  preview: {
    port: 3000,
    host: true,
  },
})
