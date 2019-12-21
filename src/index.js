/**
 * @typedef {import("webpack/lib/Compiler")} Compiler
 * @typedef {import("webpack/lib/Compilation")} Compilation
 */
/**
 * Plugin provides sending of Source Map to the Hawk
 */
class HawkWebpackPlugin {
  /**
   * This method is called once by the webpack compiler while installing the plugin.
   * The apply method is given a reference to the underlying webpack compiler, which grants access to compiler callbacks.
   * @param {Compiler} compiler
   */
  apply(compiler){
    compiler.hooks.afterEmit.tapPromise('HawkWebpackPlugin',
      /**
       * @param {Compilation} compilation
       * @return {Promise<>}
       */
      (compilation) => {
        return new Promise(((resolve, reject) => {
            Object.keys(compilation.assets).forEach(name => {
              if (name.split('.').pop() === 'map'){
                console.log('Source map found:', compilation.assets[name].existsAt);
              }
            })
            resolve();
        }
      ))
    });
  }
}

module.exports = HawkWebpackPlugin;
