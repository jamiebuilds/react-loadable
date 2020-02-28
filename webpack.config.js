const path = require('path');
const { ReactLoadablePlugin } = require('./webpack');

module.exports = {
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
              'syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-object-assign',
              require.resolve('./babel'),
            ],
          }
        },
      },
    ],
  },
  devtool: 'inline-source-map',
  resolve: {
    alias: {
      'react-loadable': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new ReactLoadablePlugin({
      filename:  path.resolve(__dirname, 'example', 'dist', 'react-loadable.json'),
    }),
  ]
};
