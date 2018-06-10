import * as webpack from 'webpack';
import * as path from 'path';
import * as RemoveAssetsPlugin from 'remove-assets-webpack-plugin';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';

const extractStyle = new ExtractTextPlugin('style.css');
const extractHighlight = new ExtractTextPlugin('hybrid.css');

module.exports = [
    {
        mode: 'development',
        entry: {
            style: './src/css/style.amp.css',
        },
        output: {
            filename: 'dummy',
            path: path.resolve(__dirname, 'layouts/partials/head/amp/css')
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: extractStyle.extract({
                        fallback: 'style-loader',
                        use: [
                            {loader: 'css-loader', options: {importLoaders: 1}},
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
                                    ]
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
        mode: 'development',
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
                                minimize: true,
                                sourceMap: false
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

