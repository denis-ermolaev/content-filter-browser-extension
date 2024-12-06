// @ts-nocheck
// @ts-ignore
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: {
    background: './src/background.js',
    'contentScripts/contentEnd': './src/contentScripts/contentEnd.js',
    'contentScripts/contentStart': './src/contentScripts/contentStart.js',
    'contentScripts/contentVideo': './src/contentScripts/contentVideo.js',
    'pages/Options/index': './src/pages/Options/index.js',
    'pages/BlockPage/index': './src/pages/BlockPage/index.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      'languageDetector': path.resolve(__dirname, 'src/efficient-language-detector-js-main/languageDetector.js'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  cache: {
    type: 'filesystem',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/pages/Options/index.html', to: 'pages/Options/index.html' },
        { from: 'src/pages/Options/index.css', to: 'pages/Options/index.css' },
        { from: 'src/pages/BlockPage/index.html', to: 'pages/BlockPage/index.html' },
        { from: 'src/pages/BlockPage/style.css', to: 'pages/BlockPage/style.css' },
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/utils', to: 'utils/' },
        { from: 'src/assets', to: 'assets/' },
        // добавьте другие HTML-страницы, которые нужно скопировать
      ],
    }),
  ],
};