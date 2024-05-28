const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');
const http = require('http');
const gitlog = require('gitlog').default;

/**
 * @typedef {require("webpack/lib/Compiler")} Compiler
 * @typedef {require("webpack/lib/Compilation")} Compilation
 */
/**
 * @typedef {object} SourceMapFound
 * @property {string} name - file name
 * @property {string} path - full path from the system root
 */
/**
 * @typedef {object} Commit
 * @property {string} hash - full commit hash
 * @property {string} title - commit title
 * @property {string} author - autho email
 * @property {string} date - date in string format
 *
 * @typedef {object} GitOptions
 * @property {string} repo - path to repository with .git directory
 * @property {number} number - the number of commits we want to get
 */
/**
 * Plugin provides sending of Source Map to the Hawk
 */
class HawkWebpackPlugin {
  /**
   * @param {string} integrationToken - Integration Token got from the Project Settings page
   * @param {string} release - Unique id of current build
   * @param {string|boolean} releaseInfoFile - Pass where `release.json` file will be created. If false passed, file won't be created
   * @param {string} [collectorEndpoint] - Custom collector endpoint for debug
   * @param {boolean} [removeSourceMaps] - Should the plugin to remove emitted source map files. Default is `true`.
   * @param {GitOptions | boolean} commits - Git options for getting the commits
   */
  constructor({
    integrationToken,
    release,
    releaseInfoFile,
    collectorEndpoint = '',
    removeSourceMaps = true,
    commits = true,
  }) {
    this.releaseId = release;
    this.releaseInfoFile = releaseInfoFile;
    this.requestTimeout = 50;
    this.removeSourceMaps = removeSourceMaps;

    this.integrationToken = integrationToken;
    this.integrationId = this.getIntegrationId();

    this.collectorEndpoint = collectorEndpoint || `https://${this.integrationId}.k1.hawk.so/release`;
    this.isHttps = this.collectorEndpoint.startsWith('https');

    this.commits = false;

    if (commits === true || typeof commits === 'object') {
      this.commits = {
        repo: __dirname,
        number: 5,
        ...(commits === true ? {} : commits),
      };
    }
  }

  /**
   * This method is called once by the webpack compiler while installing the plugin.
   * The apply method is given a reference to the underlying webpack compiler, which grants access to compiler callbacks.
   *
   * @param {Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('HawkWebpackPlugin',
      /**
       * @param {Compilation} compilation
       * @returns {Promise<>}
       */
      (compilation) => {
        return new Promise((resolve, reject) => {
          /**
           * If there is not integration ID, stop Webpack plugin
           */
          if (!this.integrationId || this.integrationId === '') {
            console.error('Invalid Integration Token passed.');
            resolve();

            return;
          }

          /**
           * If there is no release identifier passed from user, get webpack compilation hash
           */
          if (!this.releaseId) {
            this.releaseId = this.getReleaseId(compilation);
          }

          const sourceMaps = this.findSourceMaps(compilation);

          if (!sourceMaps.length) {
            resolve();

            return;
          }

          const timerLabel = '🕊   Hawk Webpack Plugin';

          console.time(timerLabel);

          const tasks = [];

          if (this.commits) {
            const sendingCommits = this.sendCommits(this.releaseId)
              .catch((error) => {
                this.log('(⌐■_■) Sending failed: \n\n' + error.message, consoleColors.fgRed);
              });

            tasks.push(sendingCommits);
          }

          const sendingSourceMaps = this.sendSourceMaps(sourceMaps, this.releaseId)
            .then(() => {
              /**
               * Save release info to the release.json file
               */
              if (this.releaseInfoFile !== false) {
                /**
                 * If release info path does not specified, use the webpack's output directory
                 */
                this.releaseInfoFile = this.releaseInfoFile || compilation.outputOptions.path;
                this.saveReleaseId();
              }

              /**
               * Remove source maps
               */
              if (this.removeSourceMaps) {
                this.deleteSourceMaps(sourceMaps);
              }
            })
            .catch((error) => {
              this.log('(⌐■_■) Sending failed: \n\n' + error.message, consoleColors.fgRed);
            });

          tasks.push(sendingSourceMaps);

          this.promiseAllSettled(tasks).then(() => {
            console.timeEnd(timerLabel);

            /**
             * Continue webpack building
             */
            resolve();
          });
        }
        );
      });
  }

  /**
   * Returns integration id from integration token
   *
   * @returns {string}
   */
  getIntegrationId() {
    try {
      const decodedIntegrationTokenAsString = Buffer
        .from(this.integrationToken, 'base64')
        .toString('utf-8');
      const decodedIntegrationToken = JSON.parse(decodedIntegrationTokenAsString);
      const integrationId = decodedIntegrationToken.integrationId;

      if (!integrationId || integrationId === '') {
        throw new Error('Invalid Integration Token');
      }

      return integrationId;
    } catch (error) {
      console.error('Invalid Integration token');
    }
  }

  /**
   * Return unique release id based on content hash sum
   *
   * @param {Compilation} compilation
   * @returns {string}
   */
  getReleaseId(compilation) {
    return compilation.hash;
  }

  /**
   * Find source maps in emitted assets
   *
   * @param {Compilation} compilation
   * @returns {SourceMapFound[]}
   */
  findSourceMaps(compilation) {
    const maps = [];
    const outputPath = compilation.outputOptions.path;

    Object.keys(compilation.assets).forEach(name => {
      const filename = name.split('?')[0];
      const extension = filename.split('.').pop();

      if (extension === 'map') {
        maps.push({
          name,
          path: path.join(outputPath, name),
        });
      }
    });

    return maps;
  }

  /**
   * Find commits in the project directory
   *
   * @returns {Commit[]}
   */
  findCommits() {
    const options = {
      repo: this.commits.repo,
      number: this.commits.number,
      fields: ['hash', 'subject', 'authorEmail', 'authorDate'],
    };

    const commits = gitlog(options);

    return commits.map(commit => ({
      hash: commit.hash,
      title: commit.subject,
      author: commit.authorEmail,
      date: commit.authorDate,
    }));
  }

  /**
   * Send git commits
   *
   * @param {string} releaseId - release hash
   * @returns {Promise<Response>}
   */
  async sendCommits(releaseId) {
    const body = new FormData();

    body.append('release', releaseId);

    try {
      const commits = this.findCommits();

      body.append('commits', JSON.stringify(commits));

      this.log(wrapInColor('Founded some commits', consoleColors.fgGreen), consoleColors.fgCyan, true);
    } catch (e) {
      this.log("(⌐■_■) Couldn't get commits: " + e, consoleColors.fgRed);

      return;
    }

    return this.fetch(body).then(response => {
      try {
        response = JSON.parse(response);

        if (response && response.error === false) {
          this.log(wrapInColor('Commits successfully sent', consoleColors.fgGreen), consoleColors.fgCyan, true);
        } else {
          this.log(wrapInColor('Sending commits failed: ' + response.message, consoleColors.fgRed), consoleColors.fgCyan, true);
        }
      } catch (error) {
        this.log('(⌐■_■) Hawk Collector Unparsed response: \n\n' + response, consoleColors.fgRed);
      }
    });
  }

  /**
   * Deliver found source maps to the Hawk Collector
   *
   * @param {SourceMapFound[]} maps - found source maps list
   * @param {string} releaseId - release hash
   * @returns {Promise<Response[]>}
   */
  sendSourceMaps(maps, releaseId) {
    return Promise.all(maps.map(map => this.sendOne(map, releaseId)));
  }

  /**
   * Send a single source map
   *
   * @param {SourceMapFound} map - source map info
   * @param {string} releaseId - release hash
   * @returns {Promise<Response>}
   */
  sendOne(map, releaseId) {
    return this.loadSourceMapFile(map.path)
      .then(file => {
        const body = new FormData();

        body.append('file', file, {
          filename: map.name,
        });
        body.append('release', releaseId);

        return this.fetch(body).then(response => {
          try {
            response = JSON.parse(response);

            if (response && response.error === false) {
              this.log(map.name + ' – ' + wrapInColor('sent', consoleColors.fgGreen), consoleColors.fgCyan, true);
            } else {
              this.log(map.name + ' – ' + wrapInColor('failed: ' + response.message, consoleColors.fgRed), consoleColors.fgCyan, true);
            }
          } catch (error) {
            this.log('(⌐■_■) Hawk Collector Unparsed response: \n\n' + response, consoleColors.fgRed);
          }
        })
          .catch(error => {
            this.log(map.name + ' – ' + wrapInColor('ლ(´ڡ`ლ) sending failed: ' + error.message, consoleColors.fgRed), consoleColors.fgCyan, true);
          });
      })
      .catch((error) => {
        this.log('(⌐■_■) Sending ' + map.name + ' failed: \n\n' + error.message, consoleColors.fgRed);
      });
  }

  /**
   * Performs XHR request
   *
   * @param {FormData} data - send FormData to the server
   * @returns {Promise<string>}
   */
  fetch(data) {
    return new Promise((resolve, reject) => {
      const lib = this.isHttps ? https : http;
      const request = lib.request(this.collectorEndpoint, {
        method: 'POST',
        timeout: this.requestTimeout,
        headers: {
          Authorization: `Bearer ${this.integrationToken}`,
          ...data.getHeaders(),
        },
      }, (response) => {
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          resolve(chunk);
        });
      });

      request.on('error', (e) => {
        reject(e);
      });

      request.write(data.getBuffer());
      request.end();
    });
  }

  /**
   * Load file content
   *
   * @param {string} filePath - file path
   * @returns {Promise<Blob>}
   */
  loadSourceMapFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);

          return;
        }

        resolve(data);
      });
    });
  }

  /**
   * Promise.allSettled polyfil
   *
   * @param {Promise[]} promises - array of promises to settle
   * @returns {Promise}
   */
  promiseAllSettled(promises) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(value => ({
      status: 'fulfilled',
      value: value,
    }), error => ({
      status: 'rejected',
      reason: error,
    }))));
  };

  /**
   * Saves current release identifier to the release.json file
   */
  saveReleaseId() {
    const releaseInfoFilename = 'release.json';
    const fullPath = path.join(this.releaseInfoFile, releaseInfoFilename);

    fs.writeFileSync(fullPath, JSON.stringify({
      release: this.releaseId,
      date: Date.now(),
    }));

    this.log(`release information saved to the ${fullPath}`);
  }

  /**
   * Removes source map files
   *
   * @param {SourceMapFound[]} sourceMaps - found .map files
   * @returns {void}
   */
  deleteSourceMaps(sourceMaps) {
    sourceMaps.forEach(({ name, path: filePath }) => {
      fs.unlinkSync(filePath);
      this.log(`Map ${name} deleted`, consoleColors.fgCyan, true);
    });
  }

  /**
   * Decorates terminal log
   *
   * @param {string} message - message to print
   * @param {string} [color] - message color
   * @param {boolean} [skipLineBreak] - pass true to prevent adding an empty linebreak
   */
  log(message, color = consoleColors.fgCyan, skipLineBreak = false) {
    console.log(wrapInColor('🦅 Hawk | ' + message + (!skipLineBreak ? '\n' : ''), color));
  }
}

/**
 * Set a terminal color to the message
 *
 * @param {string} msg - text to wrap
 * @param {string} color - color
 */
function wrapInColor(msg, color) {
  return '\x1b[' + color + 'm' + msg + '\x1b[0m';
}

/**
 * Terminal output colors
 */
const consoleColors = {
  fgCyan: 36,
  fgRed: 31,
  fgGreen: 32,
};

module.exports = HawkWebpackPlugin;
