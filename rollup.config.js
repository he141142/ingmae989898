import babel from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


export default {
    input: 'src/js/ingame.js',
    output: {
      file: 'public/build/ingameBuild.js',
      format: 'iife',
      name: 'ingameBuild',
      sourcemap: 'inline'
    },
    watch: {
      chokidar: {
        // if the chokidar option is given, rollup-watch will
        // use it instead of fs.watch. You will need to install
        // chokidar separately.
        //
        // this options object is passed to chokidar. if you
        // don't have any options, just pass `chokidar: true`
      },
   
      // include and exclude govern which files to watch. by
      // default, all dependencies will be watched
      exclude: ['node_modules/**']
    },

    plugins: [ eslint({
            fix: true,
            exclude: ['./node_modules/**', './src/styles/**'],
        }),
        babel({
            exclude:'node_modules/**',
            babelHelpers: 'bundled'
        }),
        resolve(),
        commonjs()
    ]
  }