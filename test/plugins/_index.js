'use strict';

const { expect } = require('chai');

var FS = require('fs'),
    PATH = require('path'),
    EOL = require('os').EOL,
    regEOL = new RegExp(EOL, 'g'),
    regFilename = /^(.*)\.(\d+)\.svg$/,
    SVGO = require('../../lib/svgo');

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
                        svgo;
                  
                    const plugin = {
                      name,
                      params: (params ? JSON.parse(params) : {}),
                    };

                    svgo = new SVGO({
                        plugins : [ plugin ],
                        js2svg  : { pretty: true }
                    });

                    const result = svgo.optimize(orig, {path: file});
                    //FIXME: results.data has a '\n' at the end while it should not
                    expect(normalize(result.data)).to.equal(should);
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
