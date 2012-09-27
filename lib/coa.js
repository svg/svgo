var Q = require('q'),
    info = JSON.parse(require('fs').readFileSync(__dirname + '/../package.json'));

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
            SVGO = require('./svgo');

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
                return SVGO(svg, options);
            })
            .then(function(svgmin) {
                var output = options.output;

                output.write(svgmin);

                output === process.stdout ?
                    output.write('\n') :
                    output.end();
            });

    });
