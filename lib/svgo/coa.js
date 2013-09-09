'use strict';

require('colors');
require('js-yaml');

var FS = require('fs'),
    PATH = require('path'),
    UTIL = require('util'),
    SVGO = require('../svgo'),
    PKG = require('../../package.json'),
    encodeSVGDatauri = require('./tools').encodeSVGDatauri,
    decodeSVGDatauri = require('./tools').decodeSVGDatauri,
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
        .name('config').title('Config file to extend or replace default')
        .long('config')
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
        .name('datauri').title('Output as Data URI string (base64, URI encoded or unencoded)')
        .long('datauri')
        .val(function(val) {
            return val || this.reject('Option --datauri must have one of the following values: base64, enc or unenc');
        })
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
                config = require(PATH.resolve(opts.config));
            }

        }

        // --disable
        if (opts.disable) {
            config = changePluginsState(opts.disable, false, config);
        }

        // --enable
        if (opts.enable) {
            config = changePluginsState(opts.enable, true, config);
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

        // --input
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
                        optimizeFromString(data, config, opts.datauri, input, output);
                    })
                    .resume();

            // file
            } else {

                try {

                    var data = FS.readFileSync(input, 'utf8');
                    optimizeFromString(data, config, opts.datauri, input, output);

                }

                catch (err) {

                    throw err;

                }

            }

        // --string
        } else if (opts.string) {

            opts.string = decodeSVGDatauri(opts.string);

            optimizeFromString(opts.string, config, opts.datauri, input, output);

        }

    });

function optimizeFromString(svgstr, config, datauri, input, output) {

    var startTime = Date.now(config),
        time,
        inBytes = Buffer.byteLength(svgstr, 'utf8'),
        outBytes,
        svgo = new SVGO(config);

    var result = svgo.optimize(svgstr)

    if (result.error) {

        console.log(result.error);
        return;

    }
    if (datauri) {
        result.data = encodeSVGDatauri(result.data, datauri);
    }

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

}

function saveFileAndPrintInfo(data, path, inBytes, outBytes, time) {

    try {

        FS.writeFileSync(path, data, 'utf8');

        // print time info
        printTimeInfo(time);

        // print optimization profit info
        printProfitInfo(inBytes, outBytes);
    }
    catch (err) {

        throw err;

    }

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

/**
 * Change plugins state by names array.
 *
 * @param {Array} names plugins names
 * @param {Boolean} state active state
 * @param {Object} config original config
 * @return {Object} changed config
 */
function changePluginsState(names, state, config) {

    // extend config
    if (config && config.plugins) {

        names.forEach(function(name) {

            var matched,
                key;

            config.plugins.forEach(function(plugin) {

                // get plugin name
                if (typeof plugin === 'object') {
                    key = Object.keys(plugin)[0];
                } else {
                    key = plugin;
                }

                // if there are such plugin name
                if (key === name) {
                    // do not replace plugin's params with true
                    if (typeof plugin[key] !== 'object' || !state) {
                        plugin[key] = state;
                    }

                    // mark it as matched
                    matched = true;
                }

            });

            // if not matched and current config is not full
            if (!matched && !config.full) {

                var obj = {};

                obj[name] = state;

                // push new plugin Object
                config.plugins.push(obj);

                matched = true;

            }

        });

    // just push
    } else {

        config = { plugins: [] };

        names.forEach(function(name) {
            var obj = {};

            obj[name] = state;

            config.plugins.push(obj);
        });

    }

    return config;

}

function optimizeFolder(path, config) {

    var svgo = new SVGO(config);

    // absoluted folder path
    path = PATH.resolve(path);

    UTIL.puts('\n' + path + ':\n');

    // list folder content
    var files
    
    try {
    
        files = FS.readdirSync(path);
    
    }
    catch (err) {

        throw err;

    }


    var i = 0;

    function optimizeFile(file) {

        if (file == undefined) {

           return;

        }

        // absoluted file path
        var filepath = PATH.resolve(path, file);

        // check if file name matches *.svg
        if (regSVGFile.test(filepath)) {

            try {

                var data = FS.readFileSync(filepath, 'utf8');

                var startTime = Date.now(),
                    time,
                    inBytes = Buffer.byteLength(data, 'utf8'),
                    outBytes;

                var result = svgo.optimize(data);

                if (result.error) {

                    console.log(result.error);

                    return;

                }

                outBytes = Buffer.byteLength(result.data, 'utf8');
                time = Date.now() - startTime;

                FS.writeFile(filepath, result.data, 'utf8');
                UTIL.puts(file + ':');

                // print time info
                printTimeInfo(time);

                // print optimization profit info
                printProfitInfo(inBytes, outBytes);

            }

            catch(err) {

                throw err;

            } 

        }

        if (++i < files.length) {
            optimizeFile(files[i]);
        }

    }

    optimizeFile(files[i]);

}
