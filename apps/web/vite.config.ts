import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../..'),
  publicDir: path.resolve(__dirname, '../../public'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kharcha/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@kharcha/shared'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
