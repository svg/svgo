'use strict';

var FS = require('fs'),
    PATH = require('path'),
    EOL = require('os').EOL,
    regEOL = new RegExp(EOL, 'g'),
    regFilename = /^(.*)\.(\d+)\.svg$/,
    SVGO = require(process.env.COVERAGE ?
                   '../../lib-cov/svgo':
                   '../../lib/svgo');

describe('plugins tests', function() {

    FS.readdirSync(__dirname).forEach(function(file) {

        var match = file.match(regFilename),
            index,
            name;

        if (match) {

            name  = match[1];
            index = match[2];

            file = PATH.resolve(__dirname, file);

            it(name + '.' + index, function() {

                return readFile(file)
                .then(function(data) {
                    var splitted = normalize(data).split(/\s*@@@\s*/),
                        orig     = splitted[0],
                        should   = splitted[1],
                        params   = splitted[2],

                        plugins = {},
                        svgo;

                    plugins[name] = (params) ? JSON.parse(params) : true;

                    svgo = new SVGO({
                        full    : true,
                        plugins : [ plugins ],
                        js2svg  : { pretty: true }
                    });

                    return svgo.optimize(orig, {path: file}).then(function(result) {
                        //FIXME: results.data has a '\n' at the end while it should not
                        normalize(result.data).should.be.equal(should);
                    });
                });

            });

        }

    });

});

function normalize(file) {
    return file.trim().replace(regEOL, '\n');
}

function readFile(file) {
    return new Promise(function(resolve, reject) {
        FS.readFile(file, 'utf8', function(err, data) {
            if (err) return reject(err);
            resolve(data);
        });
    });
}