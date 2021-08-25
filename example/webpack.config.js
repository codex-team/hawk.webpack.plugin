const HawkWebpackPlugin = require('../src/index');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  plugins: [
    new HawkWebpackPlugin({
      integrationToken: process.env.HAWK_TOKEN,
    }),
  ],
  devtool: 'hidden-source-map',
};
