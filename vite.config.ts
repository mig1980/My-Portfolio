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
    sourcemap: false,
    rollupOptions: {
      // Separate entry for the private résumé editor, so none of its code ships in the public bundle.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
      },
      output: {
        manualChunks: {
          lucide: ['lucide-react'],
        },
      },
    },
    cssCodeSplit: true,
    // The admin editor chunk (CodeMirror) is ~600 kB; the public site never loads it.
    chunkSizeWarningLimit: 700,
    minify: 'esbuild',
    // es2020 for better Safari iOS compatibility (esnext can cause parse delays)
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
