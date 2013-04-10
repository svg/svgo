'use strict';

require('colors');
require('js-yaml');

var FS = require('fs'),
    PATH = require('path'),
    UTIL = require('util'),
    SVGO = require('../svgo'),
    PKG = require('../../package.json'),
    encodeSVGDatauri = require('./tools').encodeSVGDatauri,
    regSVGFile = /\.svg$/;

/**
 * Command-Option-Argument.
 *
 * @see https://github.com/veged/coa
 */
module.exports = require('coa').Cmd()
    .helpful()
    .name(PKG.name)
    .title(PKG.description)
    .opt()
        .name('version').title('Version')
        .short('v').long('version')
        .only()
        .flag()
        .act(function() {
            return PKG.version;
        })
        .end()
    .opt()
        .name('input').title('Input file, "-" for STDIN')
        .short('i').long('input')
        .val(function(val) {
            return val || this.reject('Option --input must have a value.');
        })
        .end()
    .opt()
        .name('string').title('Input SVG data string')
        .short('s').long('string')
        .end()
    .opt()
        .name('folder').title('Input folder, optimize and rewrite all *.svg files')
        .short('f').long('folder')
        .val(function(val) {
            return val || this.reject('Option --folder must have a value.');
        })
        .end()
    .opt()
        .name('output').title('Output file (by default the same as the input), "-" for STDOUT')
        .short('o').long('output')
        .val(function(val) {
            return val || this.reject('Option --output must have a value.');
        })
        .end()
    .opt()
        .name('config').title('Config file to extend default')
        .long('config')
        .val(function(val) {
            return val || this.reject('Option --config must have a value.');
        })
        .end()
    .opt()
        .name('config-full').title('Config file to replace default')
        .long('config-full')
        .val(function(val) {
            return val || this.reject('Option --config-full must have a value.');
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
    .arg()
        .name('input').title('Alias to --input')
        .end()
    .arg()
        .name('output').title('Alias to --output')
        .end()
    .act(function(opts, args) {

        var input = args && args.input ? args.input : opts.input,
            output = args && args.output ? args.output : opts.output,
            config,
            configFull;

        // w/o anything
        if (
            (!input || input === '-') &&
            !opts.string &&
            !opts.stdin &&
            !opts.folder &&
            process.stdin.isTTY
        ) return this.usage();

        // --config
        if (opts.config) {

            // string
            if (opts.config.charAt(0) === '{') {
                config = JSON.parse(opts.config);

            // external file
            } else {
                config = require(opts.config);
            }

        // --config-full
        } else if (opts['config-full']) {
            config = require(opts['config-full']);

            configFull = true;
        }

        // --pretty
        if (opts.pretty) {

            config = config || {};
            config.js2svg = config.js2svg || {};
            config.js2svg.pretty = true;

        }

        // --folder
        if (opts.folder) {
            optimizeFolder(opts.folder, config, configFull);

            return;
        }

        // --inpput
        if (input) {

            // STDIN
            if (input === '-') {

                var data = '';

                process.stdin.pause();

                process.stdin
                    .on('data', function(chunk) {
                        data += chunk;
                    })
                    .once('end', function() {
                        optimizeFromString(data, config, configFull, input, output);
                    })
                    .resume();

            // file
            } else {

                FS.readFile(input, 'utf8', function(err, data) {
                    if (err) {
                        throw err;
                    }

                    optimizeFromString(data, config, configFull, input, output);
                });

            }

        // --string
        } else if (opts.string) {

            optimizeFromString(opts.string, config, configFull, input, output);

        }

    });

function optimizeFromString(svgstr, config, configFull, input, output) {

    var startTime = Date.now(config),
        time,
        inBytes = Buffer.byteLength(svgstr, 'utf8'),
        outBytes,
        svgo = new SVGO(config, configFull);

    svgo.optimize(svgstr, function(result) {

        outBytes = Buffer.byteLength(result.data, 'utf8');
        time = Date.now() - startTime;

        // stdout
        if (output === '-' || (input === '-' && !output)) {

            process.stdout.write(result.data + '\n');

        // file
        } else {

            // overwrite input file if there is no output
            if (!output && input) {
                output = input;
            }

            UTIL.puts('\r');

            saveFileAndPrintInfo(result.data, output, inBytes, outBytes, time);

        }

    });

}

function saveFileAndPrintInfo(data, path, inBytes, outBytes, time) {

    FS.writeFile(path, data, 'utf8', function() {

        // print time info
        printTimeInfo(time);

        // print optimization profit info
        printProfitInfo(inBytes, outBytes);

    });

}

function printTimeInfo(time) {

    UTIL.puts('Done in ' + time + ' ms!');

}

function printProfitInfo(inBytes, outBytes) {

    var profitPercents = 100 - outBytes * 100 / inBytes;

    UTIL.puts(
        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB' +
        (profitPercents < 0 ? ' + ' : ' - ') +
        String(Math.abs((Math.round(profitPercents * 10) / 10)) + '%').green + ' = ' +
        (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n'
    );

}

function optimizeFolder(path, config, configFull) {

    var svgo = new SVGO(config, configFull);

    // absoluted folder path
    path = PATH.resolve(process.cwd(), path);

    UTIL.puts('\n' + path + ':\n');

    // list folder content
    FS.readdir(path, function(err, files) {

        if (err) {
            throw err;
        }

        files.forEach(function(filename) {

            // absoluted file path
            var filepath = PATH.resolve(path, filename);

            // check if file name matches *.svg
            if (regSVGFile.test(filepath)) {

                FS.readFile(filepath, 'utf8', function(err, data) {

                    if (err) {
                        throw err;
                    }

                    var startTime = Date.now(),
                        time,
                        inBytes = Buffer.byteLength(data, 'utf8'),
                        outBytes;

                    svgo.optimize(data, function(result) {

                        outBytes = Buffer.byteLength(result.data, 'utf8');
                        time = Date.now() - startTime;

                        FS.writeFile(filepath, result.data, 'utf8', function() {

                            UTIL.puts(filename + ':');

                            // print time info
                            printTimeInfo(time);

                            // print optimization profit info
                            printProfitInfo(inBytes, outBytes);

                        });

                    });

                });

            }

        });

    });

}
