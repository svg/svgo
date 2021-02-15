'use strict';

const FS = require('fs');
const PATH = require('path');
const { optimize } = require('../lib/svgo');
const filepath = PATH.resolve(__dirname, 'test.svg'),
const config {
  plugins: [
    'cleanupAttrs',
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeTitle',
    'removeDesc',
    'removeUselessDefs',
    'removeEditorsNSData',
    'removeEmptyAttrs',
    'removeHiddenElems',
    'removeEmptyText',
    'removeEmptyContainers',
    // 'removeViewBox',
    'cleanupEnableBackground',
    'convertStyleToAttrs',
    'convertColors',
    'convertPathData',
    'convertTransform',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeUnusedNS',
    'cleanupIDs',
    'cleanupNumericValues',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    // 'removeRasterImages',
    'mergePaths',
    'convertShapeToPath',
    'sortAttrs',
    'removeDimensions',
    { name: 'removeAttrs', attrs: '(stroke|fill)'},
  ]
};

FS.readFile(filepath, 'utf8', function(err, data) {

    if (err) {
        throw err;
    }

    const result = svgo.optimize(data, {path: filepath, ...config});

    console.log(result);

    // {
    //     // optimized SVG data string
    //     data: '<svg width="10" height="20">test</svg>'
    //     // additional info such as width/height
    //     info: {
    //         width: '10',
    //         height: '20'
    //     }
    // }

});
