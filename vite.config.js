import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Landing page (static HTML — no module scripts, Vite just copies it)
        landing: resolve(__dirname, 'index.html'),
        // React SPA entry
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
});
