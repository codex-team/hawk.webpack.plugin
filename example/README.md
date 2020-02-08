# Hawk Webpack Plugin example

In this example we are storing the Hawk Integration Token in .env file:

```
# Integration Token for Hawk errors monitoring
HAWK_TOKEN = ""
```

Then, get it in node process through the [dotenv](https://github.com/motdotla/dotenv) package.

```js
//  webpack.config.js
const HawkWebpackPlugin = require('@hawk.so/webpack-plugin');
const dotenv = require('dotenv');

dotenv.config()

module.exports = {
  plugins: [
    new HawkWebpackPlugin({
      integrationToken: process.env.HAWK_TOKEN
    })
  ],
  devtool: 'hidden-source-map',
}
```

The release id is not specified manually, so the plugin will use webpack compilation hash. 
We'll access it through the `release.json` file, that will be created at the output directory.
