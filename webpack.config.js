const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {parser: {amd: false}},
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: ['transform-class-properties'],
          },
        },
      }
    ],
  },
  plugins: [
    // For the demo_tiger.js script
    new webpack.ProvidePlugin({
      THREE: 'three',
      TWEEN: 'tween.js',
    }),
    //new webpack.IgnorePlugin(/fs/),
  ],
};
