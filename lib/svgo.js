var CONFIG = require('./config'),
    SVG2JS = require('./svg2js'),
    PLUGINS = require('./plugins'),
    JS2SVG = require('./js2svg');

module.exports = function(svg, options) {

    return CONFIG(options)
        .then(function(config) {

            return SVG2JS(svg, config.saxXMLParser)
                .then(function(json) {

                    return JS2SVG(PLUGINS(json, config.plugins));

                });

        });

};
