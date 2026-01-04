import { resolve } from 'path';
import { defineConfig, type PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import legacy from '@vitejs/plugin-legacy';
import ip from 'ip';
import { getSWCPlugin } from '../../scripts/rollup-config-helper';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const development = mode === 'development';

  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'demo/index.html'),
          'quick-start': resolve(__dirname, 'demo/html/quick-start.html'),
        },
      },
      minify: false,
    },
    server: {
      host: ip.address(),
      port: 3002, // Use a different port from RHI (3000) and Core (3001)
      open: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 8082,
    },
    define: {
      __VERSION__: 0,
      __DEBUG__: development,
    },
    plugins: [
      legacy({
        targets: ['iOS >= 9'],
        modernPolyfills: ['es/global-this'],
      }) as PluginOption,
      getSWCPlugin({
        baseUrl: resolve(__dirname, '..', '..'),
      }) as PluginOption,
      tsconfigPaths() as PluginOption,
      configureServerPlugin() as PluginOption,
    ],
    resolve: {
      alias: {
        '@maxellabs/core': resolve(__dirname, '../core/src'),
        '@maxellabs/rhi': resolve(__dirname, '../rhi/src'),
        '@maxellabs/math': resolve(__dirname, '../math/src'),
        '@maxellabs/specification': resolve(__dirname, '../specification/src'),
      },
    },
  };
});

// Configure dev server hooks
function configureServerPlugin() {
  interface Server {
    config: {
      server: {
        port: number;
      };
    };
    httpServer: {
      once(event: string, listener: (...args: any[]) => void): void;
    };
  }

  const handleServer = function (server: Server): void {
    const host: string = ip.address() ?? 'localhost';
    const port: number = server.config.server.port;
    const baseUrl: string = `http://${host}:${port}`;

    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`  \x1b[1m\x1b[32m->\x1b[97m Demo Gallery: \x1b[0m\x1b[96m${baseUrl}/demo/index.html\x1b[0m`);
      // eslint-disable-next-line no-console
      console.log(
        `  \x1b[1m\x1b[32m->\x1b[97m Quick Start:  \x1b[0m\x1b[96m${baseUrl}/demo/html/quick-start.html\x1b[0m`
      );
    }, 1000);
  };

  return {
    name: 'configure-server',
    configurePreviewServer(server: Server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
    configureServer(server: Server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
  };
}
