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
