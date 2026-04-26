import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Project_Tracker/',
  server: {
    proxy: {
      '/api': {
        target: 'https://203.57.51.49:443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})