const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const buildDir = 'build';

let htmlOptions = {
    template: 'src/index.html',
    minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true
    }
};

module.exports = {
    mode: 'development',
    target: 'web',
    entry: `./src/js/index.js`,
    output: {
        path: path.resolve(__dirname, buildDir),
        filename: 'index.js'
    },
    devServer: {
        contentBase: `${buildDir}`
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new UglifyJSPlugin(),
        new CleanWebpackPlugin(),
        new CopyPlugin([
            { from: 'src/index.html', to: ``, flatten: true },
            { from: 'src/img/*', to: `img`, flatten: true },
            { from: 'src/css/*', to: `css`, flatten: true },
        ]),
    ],
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.css'],
    }
};
