const { babel } = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { terser } = require('rollup-plugin-terser');
const pkg = require('./package.json');

const name = 'ImageCompressor';
const isProduction = (process.env.NODE_ENV = 'production');

module.exports = {
  input: './src/index.js',
  output: {
    name,
    file: `dist/${pkg.name}${isProduction && '.min'}.js`,
    format: 'umd',
  },
  plugins: [
    nodeResolve(),
    babel({
      exclude: 'node_modules/**',
    }),
    commonjs(),
    isProduction && terser(),
  ],
};
