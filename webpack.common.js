const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            // this will apply to both plain `.js` files
            // AND `<script>` blocks in `.vue` files
            
            // this will apply to both plain `.css` files
            // AND `<style>` blocks in `.vue` files
            {
              test: /\.css$/,
              use: [
                'vue-style-loader',
                'css-loader'
              ]
            }
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    plugins: [
      // make sure to include the plugin!
      new VueLoaderPlugin()
    ],
    output: {
        filename: 'vodplayer.js',
        path: path.resolve(__dirname, 'dist'),
    },
};