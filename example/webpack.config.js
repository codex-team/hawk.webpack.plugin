const HawkWebpackPlugin = require('../src/index');

module.exports = {
  plugins: [
    new HawkWebpackPlugin()
  ],
  devtool: 'hidden-source-map',
}
