import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@maxellabs/engine': resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@maxellabs/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@maxellabs/math': resolve(__dirname, '../../packages/math/src/index.ts'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  optimizeDeps: {
    include: ['@maxellabs/engine', '@maxellabs/core', '@maxellabs/math'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
  },
  server: {
    port: 8800,
  },
});
