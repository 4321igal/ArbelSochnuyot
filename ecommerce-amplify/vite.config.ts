import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * RxJS (used by @aws-amplify/api-graphql) must stay in the same chunk as tslib / its internal graph.
 * Splitting rxjs away from Amplify or duplicating tslib across chunks causes:
 * "Class extends value undefined" in Subscriber.js (__extends from tslib).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@amplify': path.resolve(__dirname, './amplify'),
    },
    dedupe: ['rxjs', 'tslib'],
  },
  optimizeDeps: {
    include: ['rxjs', 'tslib', 'aws-amplify', '@aws-amplify/ui-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react';
          }
          if (
            id.includes('rxjs') ||
            id.includes('tslib') ||
            id.includes('aws-amplify') ||
            id.includes('@aws-amplify')
          ) {
            return 'vendor-amplify';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
