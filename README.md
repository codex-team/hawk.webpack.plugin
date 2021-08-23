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

Plugin options:

| option | required | description | 
| -- | -- | -- |
| `integrationToken` | **yes** | Your project's Integration Token | 
| `release` | no | Unique identifier of the release. By default, it will be Webpack compilation hash. You **should** pass this identifier to the [Javascript Catcher](https://github.com/codex-team/hawk.javascript) on initialization through the `release` option |
| `releaseInfoFile` | no | The path where `release.json` file will be created. By default, it will be got from Webpack `output.path` option. You can pass `false` to prevent creation of this file (can be useful, if you store and pass release id manually) |
| `removeSourceMaps` | no | Should the plugin to remove emitted source map files. Default is `true`. |
| `commits` | no | Object with options for getting the commits. Also can can be `false`. |

| Commits options | type | description |
| -- | -- | -- |
| `repo` | `string` | Path to repository with `.git` directory. Default is `__dirname`. |
| `number` | `number` | Max number of commits. Default is `10`. |

After plugin finish its work, it will save release information to the `release.json` file. 
You can use this file to get `release` identifier and pass it to the JavaScript Catcher on initialization. 

See [example](/example) of connection. 

## Usage in React project

If you want to send source maps of your React project, you need to use [react-app-rewired](https://github.com/timarney/react-app-rewired) or do `yarn eject`. Then you can override Webpack config of your project and use this plugin.
