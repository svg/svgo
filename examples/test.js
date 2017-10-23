'use strict';

var FS = require('fs'),
    PATH = require('path'),
    SVGO = require('../lib/svgo'),
    filepath = PATH.resolve(__dirname, 'test.svg'),
    svgo = new SVGO(/*{ custom config object }*/);

FS.readFile(filepath, 'utf8', function(err, data) {

    if (err) {
        throw err;
    }

    svgo.optimize(data, {path: filepath}).then(function(result) {

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

});
