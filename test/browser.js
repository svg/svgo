var svgStr = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	width="120px" height="120px" viewBox="0 0 120 120"
	enable-background="new 0 0 120 120" xml:space="preserve"
>
	<style type="text/css"><![CDATA[
		svg { fill: red; }
	]]></style>
	<g>
		<g  style="font-family:sans-serif;font-weight:800;font-size:32px;fill:white;">
			<text x="299.79" y="207.94" transform="translate(-213.78 102.9) scale(.99587)">hello</text>
		</g>
	</g>
</svg>`;

var SVGO = require('../lib/svgo');
var assert = require('assert');

var svgoConfig = {multipass:true, floatPrecision:2, /*js2svg:{pretty:true},*/ plugins: [
	{mergePaths: false}, 
	{convertShapeToPath: false}
]};
var svgo = new SVGO(svgoConfig);


svgo.optim(svgStr, 1)
.then(svgjs => {
	assert(svgjs.data.length < svgStr.length);
	console.log('result:', svgjs.data)
	console.log('with node:', svgjs.data.length, svgStr.length)
})
.catch(console.error);

// var svgoConfig1 = {multipass:true, floatPrecision:2, plugins: [
// 	{mergePaths: false}, 
// 	{convertShapeToPath: false}
// ]};
// var svgo1 = new SVGO(svgoConfig1); // svgo bugs when creating a new instance with another config..

svgo.optim(svgStr, 1)
.then(svgjs => {
	assert(svgjs.data.length < svgStr.length);
	// console.log('result:', svgjs.data)
	console.log('with node:', svgjs.data.length, svgStr.length)
})
.catch(console.error);


var SVGO2 = Function(require('fs').readFileSync('../dist/svgo.js').toString()+'\nreturn SVGO;')();

var svgo2 = new SVGO2(svgoConfig);

svgo2.optim(svgStr)
.then(svgjs => {
	assert(svgjs.data.length < svgStr.length);
	console.log('with bundle:', svgjs.data.length, svgStr.length)
})
.catch(console.error);

