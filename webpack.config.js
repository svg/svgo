var path = require('path');
var webpack = require('webpack');

module.exports = {
	entry: [
		'./lib/svgo.js'
	],
	output: {
		path: path.join(__dirname, 'dist'),
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
		new webpack.optimize.UglifyJsPlugin()
	],
};