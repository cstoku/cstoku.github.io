import * as path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

const mode = process.env.NODE_ENV || 'production'
const DIST_DIR = path.resolve(__dirname, 'layouts/partials/head/amp/css')

module.exports = {
  mode: mode,
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
              sourceMap: mode !== 'production',
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-import',
                  ['postcss-url', {url: 'inline'}],
                  ['postcss-preset-env', {stage: 0}],
                  'postcss-browser-reporter',
                  'postcss-reporter',
                  'postcss-calc',
                  //require('stylelint')(),
                ],
              },
              sourceMap: mode !== 'production'
            }
          }
        ]
      },
    ],
  },
optimization: {
  minimizer: mode === 'production' ? [new CssMinimizerPlugin()] : []
},
  plugins: [
    new RemoveEmptyScriptsPlugin({}),
    new MiniCssExtractPlugin(),
  ]
}
