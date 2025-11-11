import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'react',
        'react/',
        'react-dom',
        'react-dom/',
        /^firebase\/.*/, // Match all firebase imports like 'firebase/app', 'firebase/auth'
        '@google/genai'
      ]
    }
  }
})
