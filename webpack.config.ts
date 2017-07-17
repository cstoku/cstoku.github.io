import * as webpack from 'webpack';
import * as path from 'path';
import * as RemoveAssetsPlugin from 'remove-assets-webpack-plugin';
import * as StyleLintPlugin from 'stylelint-webpack-plugin';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';

module.exports = [
  {
    entry: {
      entry: './src/ts/index.ts',
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'static/assets')
    },
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'tslint-loader'
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'ts-loader'
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  plugins: (loader) => [
                    require('autoprefixer')(),
                  ]
                }
              }
            ]
          }),
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  plugins: (loader) => [
                    require('autoprefixer')(),
                  ]
                }
              },
              'sass-loader',
            ]
          }),
        },
        {
          test: /\.(woff2?|ttf|eot|svg)$/,
          use: [
              'file-loader'
          ]
        },
      ]
    },
    plugins: [
      //new StyleLintPlugin(),
      new ExtractTextPlugin('style.css'),
    ]
  },
  {
    entry: {
      style: './src/scss/style.amp.scss'
    },
    output: {
      filename: 'dummy',
      path: path.resolve(__dirname, 'layouts/partials')
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  plugins: (loader) => [
                    require('autoprefixer')(),
                  ]
                }
              }
            ]
          })
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  plugins: (loader) => [
                    require('autoprefixer')(),
                  ]
                }
              },
              'sass-loader',
            ]
          })
        },
        {
          test: /\.(woff2?|ttf|eot|svg)$/,
          use: [
              'file-loader'
          ]
        },
      ],
    },
    plugins: [
      new RemoveAssetsPlugin(/^dummy$/),
      //new StyleLintPlugin(),
      new ExtractTextPlugin('style.amp.css'),
    ]
  }
];

