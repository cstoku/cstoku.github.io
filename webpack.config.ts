import * as webpack from 'webpack';
import * as path from 'path';
import * as RemoveAssetsPlugin from 'remove-assets-webpack-plugin';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';

const env = process.env.NODE_ENV;
const extractStyle = new ExtractTextPlugin('style.css');
const extractHighlight = new ExtractTextPlugin('hybrid.css');

module.exports = [
    {
        entry: {
            style: './src/pcss/style.amp.pcss',
        },
        output: {
            filename: 'dummy',
            path: path.resolve(__dirname, 'layouts/partials/head/amp/css')
        },
        module: {
            rules: [
                {
                    test: /\.pcss$/,
                    use: extractStyle.extract({
                        fallback: 'style-loader',
                        use: [
                            {   loader: 'css-loader',
                                options: {
                                    importLoaders: 1,
                                    sourceMap: env !== 'production',
                                    minimize: env === 'production'
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: (loader) => [
                                        require("postcss-import")({
                                            addDependencyTo: webpack,
                                            path: []
                                        }),
                                        require("postcss-url")(),
                                        require("postcss-preset-env")({stage: 0}),
                                        require("postcss-browser-reporter")(),
                                        require("postcss-reporter")(),
                                        require("postcss-math")(),
                                        //require('stylelint')(),
                                    ],
                                    sourceMap: env !== 'production' ? 'inline' : false
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                },
            ],
        },
        plugins: [
            new RemoveAssetsPlugin(/^dummy$/),
            extractStyle,
        ]
    },
    {
        entry: {
            style: './src/css/hybrid.css',
        },
        output: {
            filename: 'dummy',
            path: path.resolve(__dirname, 'layouts/partials/head/amp/css')
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: extractHighlight.extract({
                        fallback: 'style-loader',
                        use: {
                            loader: 'css-loader',
                            options: {
                                minimize: env === 'production',
                                sourceMap: env !== 'production'
                            }
                        }
                    })
                },
            ],
        },
        plugins: [
            new RemoveAssetsPlugin(/^dummy$/),
            extractHighlight,
        ]
    }
];
