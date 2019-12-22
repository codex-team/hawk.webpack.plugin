const HawkWebpackPlugin = require('../src/index');

module.exports = {
  plugins: [
    new HawkWebpackPlugin({
      integrationToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiI1ZGYwYTFmZjkyMmRjYjAxMDM3YmMwYzkiLCJpYXQiOjE1NzYwNTExOTl9.4wOKwQ1z_tujBhazdR-UQjIOcKGZ2I_q2fbffYwQ9gw'
    })
  ],
  devtool: 'hidden-source-map',
}
