const path = require('path');
const { ReactLoadablePlugin } = require('react-loadable-loader');

module.exports = {
  entry: {
    main: './src/index',
  },
  output: {
    path: path.join(__dirname, 'example', 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/dist/'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: 'babel-loader',
    }],
  },
  plugins: [
    new ReactLoadablePlugin({
      filename: path.resolve(__dirname, 'example', 'dist', 'react-loadable.json'),
    }),
  ]
};
