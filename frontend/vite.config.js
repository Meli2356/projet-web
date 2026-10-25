import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Garde les @media (max-width: ...) classiques pour les anciens navigateurs Android
    cssTarget: ['chrome61', 'safari12'],
  },
})