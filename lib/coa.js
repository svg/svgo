var Q = require('q'),
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
        .act(function(opts) {
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
    .act(function(options) {

        var input = [],
            deferred = Q.defer(),
            SVGO = require('./svgo'),
            inBytes,
            outBytes,
            profitPercents;

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
                inBytes = Buffer.byteLength(svg, 'utf-8');

                return SVGO(svg, { coa: options });
            })
            .then(function(svgmin) {
                var output = options.output;

                output.write(svgmin);

                if (output === process.stdout) {
                    output.write('\n');
                } else {
                    output.end();

                    outBytes = Buffer.byteLength(svgmin, 'utf-8');
                    profitPercents = 100 - outBytes * 100 / inBytes;

                    console.log(
                        '\nDone!\n\n' +
                        (Math.round((inBytes / 1024) * 1000) / 1000) + ' KiB - ' +
                        (Math.round(profitPercents * 10) / 10) + '% = ' +
                        (Math.round((outBytes / 1024) * 1000) / 1000) + ' KiB\n'
                    );
                }

            });

    });
