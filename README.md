# Hawk Webpack Plugin
Webpack plugin for sending source maps to the Hawk.

## Install 

```
yarn add @hawk.so/webpack-plugin --save-dev
```

## Connect

Next you need to connect plugin to the Webpack config.

Pass your Integration Token as plugin option. It is useful to store it in .env file. 

```js
const HawkWebpackPlugin = require('@hawk.so/webpack-plugin');

module.exports = {
  // ... other webpack options
  plugins: [
    new HawkWebpackPlugin({
      integrationToken: '' // Your project's Integration Token
    })
  ],
  devtool: 'hidden-source-map',
}
```

See [example](/example/) of connection. 
