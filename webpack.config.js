// @ts-nocheck
// @ts-ignore
const path = require('path'); //Раздражает это предупреждение, как его отключить ?
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // Код лучший для отладки, для продакшена другой режим
  devtool: false, // Без мапингов быстрее всего
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
        use: 'ts-loader', // Typescript компилятор(Есть вроде более быстрые, чем этот)
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { // Поменять импорты в ts
      'languageDetector': path.resolve(__dirname, 'src/efficient-language-detector-js-main/languageDetector.js'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Вроде отчищает папку dist от лишнего и старого
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