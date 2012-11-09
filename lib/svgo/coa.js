var Q = require('q'),
    FS = require('fs'),
    UTIL = require('util'),
    SVGO = require('../svgo'),
    info = JSON.parse(require('fs').readFileSync(__dirname + '/../../package.json')),
    datauriPrefix = 'data:image/svg+xml;base64,';

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
        .name('input').title('Input: stdin (default) | filename | Data URI base64 string')
        .short('i').long('input')
        .def(process.stdin)
        .val(function(val) {
            return val || this.reject('Option --input must have a value.');
        })
        .end()
    .opt()
        .name('output').title('Output: stdout (default) | filename')
        .short('o').long('output')
        .def(process.stdout)
        .val(function(val) {
            return val || this.reject('Option --output must have a value.');
        })
        .end()
    .opt()
        .name('config').title('Local config file to extend default')
        .short('c').long('config')
        .val(function(val) {
            return val || this.reject('Option --config must have a value.');
        })
        .end()
    .opt()
        .name('disable').title('Disable plugin by name')
        .long('disable')
        .arr()
        .val(function(val) {
            return val || this.reject('Option --disable must have a value.');
        })
        .end()
    .opt()
        .name('enable').title('Enable plugin by name')
        .long('enable')
        .arr()
        .val(function(val) {
            return val || this.reject('Option --enable must have a value.');
        })
        .end()
    .opt()
        .name('datauri').title('Output as Data URI base64 string')
        .long('datauri')
        .flag()
        .end()
    .opt()
        .name('pretty').title('Make SVG pretty printed')
        .long('pretty')
        .flag()
        .end()
    .opt()
        .name('test').title('Make a visual comparison of two files (PhantomJS pre-required)')
        .long('test')
        .flag()
        .end()
    .arg()
        .name('input').title('Alias to --input')
        .end()
    .arg()
        .name('output').title('Alias to --output')
        .end()
    .act(function(opts, args) {

        var input = args && args.input ? args.input : opts.input,
            output = args && args.output ? args.output : opts.output,
            inputData = [],
            deferred = Q.defer(),
            startTime = Date.now(),
            endTime,
            startBytes,
            endBytes;

        // https://github.com/joyent/node/issues/2130
        process.stdin.pause();

        // if value is a string and not a Data URI string
        if (typeof input === 'string' && !isDatauri(input)) {
            // then create stream
            input = FS.createReadStream(input, { encoding: 'utf8' });
            input.pause();
        }

        // if run as just 'svgo' display help and exit
        if (input.isTTY) return this.usage();

        // datauri base64 string
        if (typeof input === 'string') {
            deferred.resolve(convertDatauriInput(input));
        // stdin or file stream
        } else {
            input
                .on('data', function(chunk) {
                    inputData.push(chunk);
                })
                .once('end', function() {
                    deferred.resolve(convertDatauriInput(inputData.join()));
                })
                .resume();
        }

        return deferred.promise
            .then(function(svg) {
                startBytes = Buffer.byteLength(svg, 'utf-8');

                return new SVGO({ coa: opts }).optimize(svg);
            })
            .then(function(svgmin) {
                endTime = Date.now();
                endBytes = Buffer.byteLength(svgmin.data, 'utf-8');

                // --datauri
                if (opts.datauri) {
                    // convert to Data URI base64 string
                    svgmin.data = datauriPrefix + new Buffer(svgmin.data).toString('base64');
                }

                if (typeof output === 'string') {
                    output = FS.createWriteStream(output, { encoding: 'utf8' });
                }

                output.write(svgmin.data);

                if (output === process.stdout) {
                    output.write('\n');
                } else {
                    output.end();

                    // print time info
                    printTimeInfo(startTime, endTime);

                    // print optimization profit info
                    printProfitInfo(startBytes, endBytes);

                    // --test
                    if (opts.test) {
                        // make a visual comparison of two files with PhantomJS and print info
                        printPhantomTestInfo(
                            input.path,
                            output.path,
                            svgmin.info.width || 500,
                            svgmin.info.height || 500
                        );
                    }
                }

            })
            .done();

    });

/**
 * Check if string is a Data URI base64.
 *
 * @param {String} str input string
 *
 * @return {Boolean}
 */
function isDatauri(str) {

    return str.substring(0, 26) === datauriPrefix;

}

/**
 * Convert Data URI base64 string to plain SVG.
 *
 * @param {String} str input string
 *
 * @return {String} output string
 */
function convertDatauriInput(str) {

    // if datauri base64 string
    if (isDatauri(str)) {
        // then convert
        str = new Buffer(str.substring(26), 'base64').toString('utf8');
    }

    return str;

}

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
                answer = 'Oops, files are not visually identical!\n\nIf you do not see any visual differences with your eyes then ALL IS OK and there are only very minor floating-point numbers rounding errors in some browsers.\nBut if you see significant errors then things are bad :), please create an issue at https://github.com/svg/svgo/issues';
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
