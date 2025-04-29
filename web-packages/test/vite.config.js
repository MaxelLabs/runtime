import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@max/rhi': resolve(__dirname, '../../packages/rhi/src/index.ts'),
      '@max/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@max/math': resolve(__dirname, '../../packages/math/src/index.ts')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    include: ['@max/rhi', '@max/core', '@max/math'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020'
  },
  server: {
    port: 3000
  }
}); 