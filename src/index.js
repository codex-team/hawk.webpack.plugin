const fs = require('fs');

/**
 * @typedef {import("webpack/lib/Compiler")} Compiler
 * @typedef {import("webpack/lib/Compilation")} Compilation
 */
/**
 * @typedef {object} SourceMapFound
 * @property {string} name - file name
 * @property {string} path - full path from the system root
 */
/**
 * Plugin provides sending of Source Map to the Hawk
 */
class HawkWebpackPlugin {
  /**
   * @param {string} integrationToken - Integration Token got from the Project Settings page
   */
  constructor({integrationToken}) {
    this.collectorEndpoint = 'http://localhost:3000/sourcemap'
    this.integrationToken = integrationToken
  }


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
          const releaseId = this.getReleaseId(compilation)
          const sourceMaps = this.findSourceMaps(compilation)

          if (!sourceMaps.length){
            resolve()
            return
          }

          this.sendSourceMaps(sourceMaps, releaseId)
            .then(resolve)
        }
      ))
    });
  }

  /**
   * Return unique release id based on content hash sum
   * @param {Compilation} compilation
   * @return {string}
   */
  getReleaseId(compilation){
    return compilation.hash
  }

  /**
   * Find source maps in emitted assets
   * @param {Compilation} compilation
   * @return {SourceMapFound[]}
   */
  findSourceMaps(compilation){
    const maps = [];

    Object.keys(compilation.assets).forEach(name => {
      if (name.split('.').pop() === 'map'){
        maps.push({
          name,
          path: compilation.assets[name].existsAt
        })
      }
    })

    return maps;
  }

  /**
   * Deliver found source maps to the Hawk Collector
   *
   * @param {SourceMapFound[]} maps - found source maps list
   * @param {string} releaseId - release hash
   * @return {Promise<Response[]>}
   */
  sendSourceMaps(maps, releaseId){
    return Promise.all(maps.map(map => this.sendOne(map, releaseId)))
  }

  /**
   * Send a single source map
   *
   * @param {SourceMapFound} map - source map info
   * @param {string} releaseId - release hash
   * @return {Promise<Response>}
   */
  sendOne(map, releaseId){
    const body = new FormData
    body.append('file', "@main.min.js.map")
    body.append('release', releaseId)

    console.log(`Sending map [${map.name}] ...`)

    return fetch(this.collectorEndpoint, {
      body,
      headers: {
        Authorization: `Bearer ${this.integrationToken}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      console.log('(⌐■_■) Hawk Collector Response: ', response)
    }).catch(error => {
      console.log('ლ(´ڡ`ლ) Error while sending Source Map.', error)
    })
  }

  /**
   * Load file content
   * @param {string} path - file path
   * @return {Promise<Buffer>}
   */
  loadSourceMapFile(path){
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err)
          return
        }

        resolve(data);
      });
    })
  }
}

module.exports = HawkWebpackPlugin;
