import { defineConfig } from 'vite';

export default defineConfig({
  base: '/model/',
  root: '.',
  build: {
    outDir: 'dist/model',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
}); 