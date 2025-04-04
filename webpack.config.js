const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/app.js',  // Ensure the entry file exists
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),  // Ensure this path is correct
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',  // Ensure this file exists
      filename: 'index.html',
    }),
  ],
  stats: {
    children: true,  // Detailed logging for child compilations
  },
  devServer: {
    contentBase: './dist',
    open: true,
  },
};

