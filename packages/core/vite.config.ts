import { resolve } from 'path';
import { defineConfig, type PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import ip from 'ip';
import { getSWCPlugin } from '../../scripts/rollup-config-helper';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(async ({ mode, command }) => {
  const development = mode === 'development';
  const plugins: PluginOption[] = [
    getSWCPlugin({
      baseUrl: resolve(__dirname, '..', '..'),
    }) as PluginOption,
    tsconfigPaths() as PluginOption,
    configureServerPlugin() as PluginOption,
  ];

  if (command === 'build') {
    const { default: legacy } = await import('@vitejs/plugin-legacy');
    plugins.unshift(
      legacy({
        targets: ['iOS >= 9'],
        modernPolyfills: ['es/global-this'],
      }) as PluginOption
    );
  }

  return {
    base: './',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'demo/index.html'),
          simple: resolve(__dirname, 'demo/simple.html'),
        },
      },
      minify: false, // iOS 9 等低版本加载压缩代码报脚本异常
    },
    server: {
      host: ip.address(),
      port: 3000,
      open: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 8081,
    },
    define: {
      __VERSION__: 0,
      __DEBUG__: development,
    },
    plugins,
    resolve: {
      alias: {
        '@maxellabs/core': resolve(__dirname, '../core/src'),
        '@maxellabs/math': resolve(__dirname, '../math/src'),
      },
    },
  };
});

// 用于配置开发服务器的钩子
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
      console.log(`  \x1b[1m\x1b[32m->\x1b[97m Demo: \x1b[0m\x1b[96m${baseUrl}/demo/index.html\x1b[0m`);
    }, 1000);
  };

  return {
    name: 'configure-server',
    configurePreviewServer(server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
    configureServer(server) {
      server.httpServer.once('listening', handleServer.bind(this, server));
    },
  };
}
