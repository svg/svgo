'use strict';

var FS = require('fs'),
    PATH = require('path'),
    SVGO = require(process.env.COVERAGE ?
                   '../../lib-cov/svgo':
                   '../../lib/svgo');

describe('indentation', function() {

    it('should create indent with 2 spaces', function(done) {

        var filepath = PATH.resolve(__dirname, './test.svg'),
            svgo;

        FS.readFile(filepath, 'utf8', function(err, data) {
            if (err) {
                throw err;
            }

            var splitted = data.trim().split(/\s*@@@\s*/),
                orig     = splitted[0],
                should   = splitted[1];

            svgo = new SVGO({
                full    : true,
                plugins : [],
                js2svg  : { pretty: true, indent: 2 }
            });

            svgo.optimize(orig, function(result) {
                ( result.data.trim() ).should.be.equal(should);
                done();
            });

        });

    });

});
