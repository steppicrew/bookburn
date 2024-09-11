import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,  // Automatically open the browser on start
  },
  build: {
    outDir: 'dist',  // Output directory for production build
  },
});
