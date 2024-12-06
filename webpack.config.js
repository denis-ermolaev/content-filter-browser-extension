const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: {
    background: './src/background.js',
    contentScript1: './src/contentScripts/contentEnd.js',
    contentScript2: './src/contentScripts/contentStart.js',
    contentScript3: './src/contentScripts/contentVideo.js',
    options: './src/pages/Options/index.js',
    blockpage: './src/pages/BlockPage/index.js',
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
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'pages/Options/index.html', to: 'pages/Options/index.html' },
        { from: 'pages/Options/index.css', to: 'pages/Options/index.css' },
        { from: 'pages/BlockPage/index.html', to: 'pages/BlockPage/index.html' },
        { from: 'pages/BlockPage/style.css', to: 'pages/BlockPage/style.css' },
        { from: 'efficient-language-detector-js-main', to: 'efficient-language-detector-js-main' },
        // добавьте другие HTML-страницы, которые нужно скопировать
      ],
    }),
  ],
};