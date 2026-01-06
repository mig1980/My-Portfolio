import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          lucide: ['lucide-react'],
        },
      },
    },
    cssCodeSplit: true,
    minify: 'esbuild',
    // es2020 for better Safari iOS compatibility (esnext can cause parse delays)
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
