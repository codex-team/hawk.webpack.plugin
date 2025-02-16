# Hawk Webpack Plugin example

In this example we are storing the Hawk Integration Token in .env file:

```
# Integration Token for Hawk errors monitoring
HAWK_TOKEN = ""
```

Then, get it in node process through the [dotenv](https://github.com/motdotla/dotenv) package.

```cjs
//  webpack.config.cjs

const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HawkWebpackPlugin = require("@hawk.so/webpack-plugin");

/**
 * Add ability to use .env file in webpack.config.cjs
 * It is used to get HAWK_TOKEN from env variables
 */
require('dotenv').config();

/**
 * Create a random release key that will be used in HawkWebpackPlugin and in HawkCatcher
 */
const releaseKey = [...Array(10)].map(() => Math.random().toString(36)[2]).join('');

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HawkWebpackPlugin({
      integrationToken: process.env.HAWK_TOKEN,
      release: releaseKey,
    }),

    /**
     * Replace HAWK_TOKEN and RELEASE with actual values
     * It is used for cathcer to get hawk token and release key
     */
    new webpack.DefinePlugin({
      'HAWK_TOKEN': JSON.stringify(process.env.HAWK_TOKEN),
      'RELEASE': JSON.stringify(releaseKey),
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  devtool: "hidden-source-map",
};

```

In this example we pass the manually created release key to the HawkWebpackPlugin.

If the release id is not specified manually, then the plugin will use webpack compilation hash. 
We'll could access it through the `release.json` file, that will be created at the output directory.
