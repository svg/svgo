'use strict';

var FS = require('fs'),
    PATH = require('path'),
    path = PATH.resolve(__dirname, '../examples/test.svg'),
    fileStream = FS.createReadStream(path, { encoding: 'utf8' });

var SVGO = require('../lib/svgo'),
    svgo = new SVGO(/*{ custom config object }*/);

svgo
    // optimize stream
    .fromStream(fileStream)
    // get optimized result
    .then(function(result) {

        console.log(result);
        /*
            output:

            {
                // optimized SVG data string
                data: '<svg width="10" height="20">test</svg>'
                // additional info such as width/height and start/end bytes length
                info: {
                    width: '10',
                    height: '20',
                    inBytes: 59,
                    outBytes: 38,
                    time: N
                }
            }
        */

    })
    // end promises chain
    .done();
