const {resolve} = require('path');
const webpack = require('webpack');

module.exports = {
	entry: [
		'./lib/svgo.js'
	],
	output: {
		path: resolve(__dirname, 'dist'),
		filename: 'svgo.js',
		libraryTarget: "var",
		library: "SVGO"
	},
	module: {
		loaders: [
			{
				test: /\.json$/,
				loader: 'json-loader'
			}
		]
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: {
					warnings: true
			},
			output: {
				comments: false
			}
		})
	],
};