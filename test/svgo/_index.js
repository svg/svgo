'use strict';

const { expect } = require('chai');
const FS = require('fs');
const PATH = require('path');
const EOL = require('os').EOL;
const regEOL = new RegExp(EOL, 'g');
const { optimize } = require('../../lib/svgo.js');

describe('indentation', function() {

    it('should create indent with 2 spaces', function(done) {

        var filepath = PATH.resolve(__dirname, './test.svg'),
            svgo;

        FS.readFile(filepath, 'utf8', function(err, data) {
            if (err) {
                throw err;
            }

            var splitted = normalize(data).split(/\s*@@@\s*/),
                orig     = splitted[0],
                should   = splitted[1];

            const result = optimize(orig, {
              path: filepath,
              plugins : [],
              js2svg  : { pretty: true, indent: 2 }
            });
            expect(normalize(result.data)).to.equal(should);
            done();

        });

    });

});

function normalize(file) {
    return file.trim().replace(regEOL, '\n');
}
