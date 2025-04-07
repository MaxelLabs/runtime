//@ts-nocheck
import { defineConfig } from 'vite';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import legacy from '@vitejs/plugin-legacy';
import ip from 'ip';
import { glslInner, getSWCPlugin } from '../../scripts/rollup-config-helper';

//@ts-expect-error
export default defineConfig({
  root: 'demo',
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@sruim/rhi': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    tsconfigPaths(),
    legacy({
      targets: '> 0.25%, not dead',
      polyfills: true,
    }),
  ],
});

// 用于配置开发服务器的钩子
function configureServerPlugin() {
  const handleServer = function (server) {
    const host = ip.address() ?? 'localhost';
    const port = server.config.server.port;
    const baseUrl = `http://${host}:${port}`;

    setTimeout(() => {
      console.info(`  \x1b[1m\x1b[32m->\x1b[97m Demo: \x1b[0m\x1b[96m${baseUrl}/demo/index.html\x1b[0m`);
    }, 1000);
  }

  return {
    name: 'configure-server',
    configurePreviewServer(server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
    configureServer(server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
  }
}
