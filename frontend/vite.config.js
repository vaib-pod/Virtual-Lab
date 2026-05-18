import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Add this block to force all packages to use the same React instance
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})