var CONFIG = require('./config'),
    SVG2JS = require('./svg2js'),
    PLUGINS = require('./plugins'),
    JS2SVG = require('./js2svg');

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see http://deepsweet.github.com/svgo/
 *
 * @module svgo
 *
 * @param {String} svgdata input data
 * @param {Object} [options] options
 * @return {String} output data deferred promise
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.github.com/deepsweet/svgo/master/LICENSE
 */
module.exports = function(svgdata, options) {

    return CONFIG(options)
        .then(function(config) {

            return SVG2JS(svgdata, config.svg2js)
                .then(function(jsdata) {

                    return JS2SVG(PLUGINS(jsdata, config.plugins), config.js2svg);

                });

        });

};
