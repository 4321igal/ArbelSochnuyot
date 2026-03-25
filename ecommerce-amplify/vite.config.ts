import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Avoid manualChunks that split React vs Amplify — that creates a circular chunk graph and
 * production TDZ errors: "Cannot access 'Sf' before initialization" (minified actions/helpers).
 * Lazy routes still split admin/pages. dedupe + optimizeDeps keep RxJS/tslib stable in dev.
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
