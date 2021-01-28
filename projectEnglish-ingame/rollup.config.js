import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
 
const config = {
  input: './views/src/js/snabbdom.js',
  output: {
    dir: './views/build/js/index.js',
    format: 'esm'
  },
  plugins: [
    babel({
        exclude: 'node_modules/**'
    }),
    resolve(),
    commonjs(),
    // uglify()
  ]
};
 
export default config;