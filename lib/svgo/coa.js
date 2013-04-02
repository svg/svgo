'use strict';

require('colors');

var FS = require('fs'),
    QFS = require('q-fs'),
    PATH = require('path'),
    UTIL = require('util'),
    SVGO = require('../svgo'),
    info = JSON.parse(require('fs').readFileSync(__dirname + '/../../package.json')),
    encodeSVGDatauri = require('./tools').encodeSVGDatauri,
    regSVGFile = /\.svg$/;

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
        .name('config').title('Local config file')
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
    .arg()
        .name('input').title('Alias to --input')
        .end()
    .arg()
        .name('output').title('Alias to --output')
        .end()
    .act(function(opts, args) {

        var input = args && args.input ? args.input : opts.input,
            output = args && args.output ? args.output : opts.output,
            string = opts.string,
            folder = opts.folder,
            svgo;

        if (
            (!input || input === '-') &&
            !string &&
            !opts.stdin &&
            !opts.folder &&
            process.stdin.isTTY
        ) return this.usage();

        // --folder
        if (folder) {
            optimizeFolder(folder, opts);
            return;
        }

        // --string
        if (string) {
            svgo = new SVGO({ coa: opts }).fromString(string);
        }

        // STDIN
        else if (input === '-') {
            svgo = new SVGO({ coa: opts }).fromStream(process.stdin);
        }

        // file
        else if (input) {
            svgo = new SVGO({ coa: opts }).fromFile(input);
        }

        return svgo.then(function(result) {

            // --datauri
            if (opts.datauri) {
                // convert to Data URI base64 string
                result.data = encodeSVGDatauri(result.data);
            }

            // stdout
            if (output === '-' || (input === '-' && !output)) {
                process.stdout.write(result.data + '\n');
            }

            // file
            else {

                // if input is from file - overwrite it
                if (!output && input) {
                    output = input;
                }

                UTIL.puts('\r');
                saveFileAndPrintInfo(result, output, opts.pretty);

            }

        })
        .done();

    });

/**
 * Save file and print info.
 *
 * @param {Object} result SVGO result
 * @param {String} output output filename
 * @param {Boolean} pretty is pretty printed?
 */
function saveFileAndPrintInfo(result, output, pretty) {

    // output file
    output = FS.createWriteStream(output, { encoding: 'utf8' });
    output.write(result.data);
    output.end();

    // print time info
    printTimeInfo(result.info.time);

    // print optimization profit info
    printProfitInfo(result.info.inBytes, result.info.outBytes);

}

/**
 * Print time info.
 *
 * @param {Number} time working time in ms
 */
function printTimeInfo(time) {

    UTIL.puts('Done in ' + time + ' ms!');

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
        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB' +
        (profitPercents < 0 ? ' + ' : ' - ') +
        String(Math.abs((Math.round(profitPercents * 10) / 10)) + '%').green + ' = ' +
        (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n'
    );

}

/**
 * Optimize all *.svg files in a specific folder.
 *
 * @param {String} folder folder path
 * @param {Object} opts COA options
 */
function optimizeFolder(folder, opts) {

    var svgo = new SVGO({ coa: opts });

    folder = PATH.resolve(process.cwd(), folder);

    UTIL.puts('\n' + folder + ':\n');

    // list directory
    QFS.list(folder).then(function(list) {

        list.forEach(function(item) {

            var filename = item;

            item = folder + '/' + item;

            // checkif item is a file
            QFS.isFile(item)
                .then(function(isFile) {

                    // and file name matches *.svg
                    if (isFile && regSVGFile.test(item)) {

                        // then optimize it and output profit information
                        return svgo.fromFile(item)
                            .then(function(result) {

                                UTIL.puts(filename + ':');
                                saveFileAndPrintInfo(result, item, opts.pretty);

                            });

                    }

                })
                .fail(function(e) {
                    UTIL.puts(filename + ':\n' + String('Error! "' +  e.message + '"').red + '\n');
                });

        });

    })
    .done();

}
