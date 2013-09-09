'use strict';

var FS = require('fs'),
    PATH = require('path'),
    regFilename = /^(.*)\.(\d+)\.svg$/,
    SVGO = require(process.env.COVERAGE ?
                   '../../lib-cov/svgo':
                   '../../lib/svgo');

describe('plugins tests', function() {

    FS.readdirSync(__dirname).forEach(function(file) {

        var match = file.match(regFilename),
            index,
            name,
            svgo,
            plugins;

        if (match) {

            name = match[1];
            index = match[2];

            file = PATH.resolve(__dirname, file);

            plugins = {};
            plugins[name] = true;

            svgo = new SVGO({
                full: true,
                plugins: [ plugins ],
                js2svg: { pretty: true }
            });

            it(name + '.' + index, function() {

                var data = FS.readFileSync(file, 'utf8');

                var splitted = data.split('@@@'),
                    orig = splitted[0],
                    should = splitted[1];


                var result = svgo.optimize(orig) 
                result = '\n\n' + result.data;

                result.should.be.equal(should);

            });

        }

    });

});
