import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    /* Prevent CSS order issues in production */
    cssCodeSplit: false,
    /* Ensure consistent minification with esbuild */
    minify: 'esbuild',
    /* Disable source maps if not needed (reduces size) */
    sourcemap: false,
  },
  /* Ensure viewport is preserved during dev */
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    },
    headers: {
      'X-UA-Compatible': 'IE=edge',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
