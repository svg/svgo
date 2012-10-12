var Q = require('q'),
    UTIL = require('util'),
    SVGO = require('./svgo'),
    info = JSON.parse(require('fs').readFileSync(__dirname + '/../package.json'));

/**
 * Command-Option-Argument.
 *
 * @see https://github.com/veged/coa
 *
 * @module coa
 */
module.exports = require('coa').Cmd()
    .helpful()
    .name(info.name)
    .title(info.description)
    .opt()
        .name('version').title('Version')
        .short('v').long('version')
        .only()
        .flag()
        .act(function() {
            return info.version;
        })
        .end()
    .opt()
        .name('config').title('Local config')
        .short('c').long('config')
        .val(function(val) {
            return val || this.reject('Option --config must have a value.');
        })
        .end()
    .opt()
        .name('disable').title('Disable plugin')
        .short('d').long('disable')
        .arr()
        .val(function(val) {
            return val || this.reject('Option --disable must have a value.');
        })
        .end()
    .opt()
        .name('enable').title('Enable plugin')
        .short('e').long('enable')
        .arr()
        .val(function(val) {
            return val || this.reject('Option --enable must have a value.');
        })
        .end()
    .opt()
        .name('input').title('Input file (default: stdin)')
        .short('i').long('input')
        .input()
        .end()
    .opt()
        .name('output').title('Output file (default: stdout)')
        .short('o').long('output')
        .output()
        .end()
    .opt()
        .name('pretty').title('Make SVG pretty printed')
        .short('p').long('pretty')
        .flag()
        .end()
    .opt()
        .name('test').title('Make a visual comparison of two files (PhantomJS pre-required)')
        .short('t').long('test')
        .flag()
        .end()
    .act(function(options) {

        var input = [],
            deferred = Q.defer(),
            startTime = new Date(),
            endTime,
            startBytes,
            endBytes;

        // if run as just 'svgo' display help and exit
        if (options.input.isTTY) return this.usage();

        options.input
            .on('data', function(chunk) {
                input.push(chunk);
            })
            .once('end', function() {
                deferred.resolve(input.join());
            })
            .resume();

        return deferred.promise
            .then(function(svg) {
                startBytes = Buffer.byteLength(svg, 'utf-8');

                return SVGO(svg, { coa: options });
            })
            .then(function(svgmin) {
                var output = options.output;

                output.write(svgmin.data);

                if (output === process.stdout) {
                    output.write('\n');
                } else {
                    output.end();

                    // print time info
                    endTime = new Date();
                    printTimeInfo(startTime, endTime);

                    // print optimization profit info
                    endBytes = Buffer.byteLength(svgmin.data, 'utf-8');
                    printProfitInfo(startBytes, endBytes);

                    // --test
                    if (options.test) {
                        // make a visual comparison of two files with PhantomJS and print info
                        printPhantomTestInfo(
                            options.input.path,
                            options.output.path,
                            svgmin.info.width || 500,
                            svgmin.info.height || 500
                        );
                    }
                }

            });

    });

/**
 * Print time info.
 *
 * @param {Date} startTime start time
 * @param {Date} endTime end time
 */
function printTimeInfo(startTime, endTime) {

    UTIL.puts('\nDone in ' + (endTime - startTime) + ' ms!\n');

}

/**
 * Print optimization profit info.
 *
 * @param {Number} inBytes input file byteLength
 * @param {Number} outBytes output file byteLength
 */
function printProfitInfo(inBytes, outBytes) {

    var profitPercents = 100 - outBytes * 100 / inBytes;

    UTIL.puts(
        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB - ' +
        (Math.round(profitPercents * 10) / 10) + '% = ' +
        (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n'
    );

}

/**
 * Make a visual comparison of two files with PhantomJS and print info.
 *
 * @param {String} file1 file1 path
 * @param {String} file2 file2 path
 * @param {Number} width width
 * @param {Number} height height
 */
function printPhantomTestInfo(file1, file2, width, height) {

    var PHANTOM = require('./phantom');

    UTIL.print('Visual comparison: ');

    PHANTOM.test(file1, file2, width, height)
        .then(function(code) {

            var answer;

            if (code === 1) {
                answer = 'OK';
            } else if (code === 2) {
                answer = 'Oops, files are not visually identical!\n\nIf you do not see any visual differences with your eyes then ALL IS OK and there are only very minor floating point numbers rounding errors in some browsers.\nBut if you see significant errors then things are bad :), please create an issue at https://github.com/svg/svgo/issues';
            } else if (code === 3) {
                answer = 'Error while rendering SVG\nPlease create an issue at https://github.com/svg/svgo/issues';
            } else if (code === 127) {
                answer = 'Error, you need to install PhantomJS first http://phantomjs.org/download.html';
            } else {
                answer = 'Error, something went wrong\nPlease create an issue at https://github.com/svg/svgo/issues';
            }

            UTIL.print(answer + '\n\n');

        });

}
