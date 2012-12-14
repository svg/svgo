'use strict';

var SVGO = require('../lib/svgo'),
    svgo = new SVGO(/*{ custom config object }*/);

svgo
    // optimize SVG data string
    .fromString('<svg version="1.1" width="10" height="20">test</svg>')
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
                    inBytes: 52,
                    outBytes: 38,
                    time: N
                }
            }
        */

    })
    // end promises chain
    .done();
