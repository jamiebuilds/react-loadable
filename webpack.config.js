const path = require('path');
const { ReactLoadablePlugin } = require('./webpack');

module.exports = {
  mode: "development",
  entry: {
    main: './example/client',
  },
  output: {
    path: path.join(__dirname, 'example', 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/dist/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              ['@babel/preset-env', { modules: false }],
              '@babel/preset-react',
            ],
            plugins: [
              require.resolve('./babel'),
            ],
          }
        },
      },
    ],
  },
  devtool: 'inline-source-map',
  plugins: [
    new ReactLoadablePlugin({
      filename: 'react-loadable.json',
    }),
  ]
};
