import { glsl } from './rollup-plugin-glsl-inner.js';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { swc, defineRollupSwcOption } from 'rollup-plugin-swc3';

export function getPlugins(pkg, { min = false } = {}) {
  const plugins = [
    nodeResolve(),
    commonjs(),
    // 使用 SWC 替代 TypeScript 插件
    swc(
      defineRollupSwcOption({
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: true,
          },
          target: 'es2020',
          loose: true,
        },
        sourceMaps: true,
      })
    ),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    glsl(),
  ];

  if (min) {
    plugins.push(
      terser({
        output: {
          comments: /^!/,
        },
      })
    );
  }

  return plugins;
}

export function getBanner(pkg) {
  return `/*!
 * ${pkg.name} v${pkg.version}
 * (c) 2024 Sruimeng
 * Released under the MIT License.
 */`;
}

export function onwarn(warning) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return;
  }

  console.warn(`(!) ${warning.message}`);
}

export function getSWCPlugin(jscOptions = {}, external = []) {
  const jsc = {
    loose: true,
    externalHelpers: true,
    target: 'ES5',
    ...jscOptions,
  };
  const options = {
    exclude: [],
    jsc,
    sourceMaps: true,
  };

  // // swc 会把 tsconfig 中配置的 paths 当作依赖打进包中，rollup 设置的 external 无效
  // // 故此处通过独立的 tsconfig 配置 paths 为空来做
  // if (external.length !== 0) {
  //   options['tsconfig'] = './tsconfig.external.json';
  // }

  return swc(defineRollupSwcOption(options));
}
