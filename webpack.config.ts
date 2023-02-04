import * as webpack from 'webpack'
import * as path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

const env = process.env.NODE_ENV
const DIST_DIR = path.resolve(__dirname, 'layouts/partials/head/amp/css')

module.exports = {
  mode: 'development',
  entry: {
    style: './src/pcss/style.amp.pcss',
    hybrid: './src/css/hybrid.css',
  },
  output: {
    filename: '[name].js',
    path: DIST_DIR,
  },
  module: {
    rules: [
      {
        test: /\.p?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              url: false,
              sourceMap: env !== 'production',
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['postcss-import', {addDependencyTo: webpack}],
                  ['postcss-url', {url: 'inline'}],
                  ['postcss-preset-env', {stage: 0}],
                  'postcss-browser-reporter',
                  'postcss-reporter',
                  'postcss-calc',
                  //require('stylelint')(),
                ],
              },
              sourceMap: env !== 'production'
            }
          }
        ]
      },
    ],
  },
optimization: {
  minimizer: env === 'production' ? [new CssMinimizerPlugin()] : []
},
  plugins: [
    new RemoveEmptyScriptsPlugin({}),
    new MiniCssExtractPlugin(),
  ]
}
