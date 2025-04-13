const { glsl } = require('./rollup-plugin-glsl-inner.js');
const { babel } = require('@rollup/plugin-babel');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const replace = require('@rollup/plugin-replace');
const { swc, defineRollupSwcOption, minify } = require('rollup-plugin-swc3');

function getPlugins(pkg, { min = false } = {}) {
  const plugins = [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
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

function getBanner(pkg) {
  return `/*!
 * ${pkg.name} v${pkg.version}
 * (c) 2024 Sruimeng
 * Released under the MIT License.
 */`;
}

function onwarn(warning) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return;
  }

  console.warn(`(!) ${warning.message}`)
}

function getSWCPlugin(
  jscOptions = {},
  external = [],
) {
  const jsc = {
    loose: true,
    externalHelpers: true,
    target: 'ES5',
    ...jscOptions,
  }
  const options = {
    exclude: [],
    jsc,
    sourceMaps: true,
  };

  // swc 会把 tsconfig 中配置的 paths 当作依赖打进包中，rollup 设置的 external 无效
  // 故此处通过独立的 tsconfig 配置 paths 为空来做
  if (external.length !== 0) {
    options['tsconfig'] = './tsconfig.external.json';
  }

  return swc(
    defineRollupSwcOption(options),
  );
}

module.exports = {
  getBanner,
  getPlugins,
  onwarn,
  getSWCPlugin
};
