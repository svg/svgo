
'use strict';

var path = require('path');
var spawn = require('child_process').spawn;
var stream = require('stream');

describe('cli', function() {

    it('should process svgs from stdin', function(done) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';

        var readable = new stream.Readable();
        readable._read = function noop() {};
        readable.push(svg);
        readable.push(null);

        var exec = path.join(__dirname, '..', '..', 'bin', 'svgo');
        var child = spawn(exec, ['-i', '-', '-o', '-'], { stdio: 'pipe' });
        child.stdout.once('data', function(output) {
            //FIXME: resulting svg has a '\n' appended and should not
            output.toString('utf-8').should.equal(svg + '\n');
            done();
        });

        readable.pipe(child.stdin);
    });

});
