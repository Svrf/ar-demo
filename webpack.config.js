const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    // For demo_tiger.js script
    new webpack.ProvidePlugin({
      THREE: 'three',
      TWEEN: 'tween.js',
    }),
  ],
};