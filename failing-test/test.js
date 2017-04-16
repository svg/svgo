'use strict';

var FS = require('fs'),
    PATH = require('path'),
    SVGO = require('../lib/svgo'),
    filepath = PATH.resolve(__dirname, 'construction_equipment.svg'),
    svgo = new SVGO();

FS.readFile(filepath, 'utf8', function(err, data) {
    if (err) { throw err; }

    console.log(data.length);
    svgo.optimize(data, function(result) {
        console.log(result);
    });
});