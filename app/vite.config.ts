import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => ({
  // הוספנו את השורה הזו כדי שגיטהאב פייג'ס ימצא את הקבצים
  base: '/Leittner-Quest/', 
  
  plugins: [react()],

  build: {
    sourcemap: false,
  },

  preview: {
    port: 3000,
    host: true,
  },
}))
