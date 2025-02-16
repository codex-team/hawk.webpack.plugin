const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HawkWebpackPlugin = require("@hawk.so/webpack-plugin");
require('dotenv').config();

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
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new HawkWebpackPlugin({
      integrationToken: process.env.HAWK_TOKEN,
      release: releaseKey,
      /**
       * Custom collector endpoint for local development
      */
      // collectorEndpoint: 'http://localhost:3000/release',
    }),
    new webpack.DefinePlugin({
      'process.env.HAWK_TOKEN': JSON.stringify(process.env.HAWK_TOKEN),
      'process.env.RELEASE': JSON.stringify(releaseKey),
    }),
  ],
  resolve: {
    fallback: {
    "fs": false,
    "process": false
    }
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    compress: true,
    port: 9000,
  },
  devtool: "source-map",
};
