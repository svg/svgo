var FS = require('fs'),
    UTIL = require('util'),
    SVGO = require('../svgo'),
    info = JSON.parse(require('fs').readFileSync(__dirname + '/../../package.json')),
    encodeSVGDatauri = require('./tools').encodeSVGDatauri;

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
        .name('output').title('Output file (by default the same as the input), "-" for STDOUT')
        .short('o').long('output')
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
            startTime = Date.now(),
            svgo;

        if (
            (!input || input === '-') &&
            !string &&
            !opts.stdin &&
            process.stdin.isTTY
        ) return this.usage();

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

        return svgo.then(function(svgmin) {

            // --datauri
            if (opts.datauri) {
                // convert to Data URI base64 string
                svgmin.data = encodeSVGDatauri(svgmin.data);
            }

            // stdout
            if (output === '-' || (input === '-' && !output)) {
                process.stdout.write(svgmin.data + '\n');
            }

            // file
            else {

                // if input is from file - overwrite it
                if (!output && input) {
                    output = input;
                }

                // output file
                output = FS.createWriteStream(output, { encoding: 'utf8' });
                output.write(svgmin.data);
                output.end();

                // print time info
                printTimeInfo(startTime, Date.now());

                // print optimization profit info
                printProfitInfo(svgmin.info.startBytes, svgmin.info.endBytes);

            }

        })
        .done();

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
