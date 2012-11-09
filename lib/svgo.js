/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see http://deepsweet.github.com/svgo/
 *
 * @module svgo
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.github.com/deepsweet/svgo/master/LICENSE
 */

var INHERIT = require('inherit'),
    CONFIG = require('./svgo/config'),
    SVG2JS = require('./svgo/svg2js'),
    PLUGINS = require('./svgo/plugins'),
    JS2SVG = require('./svgo/js2svg');

/**
 * @class SVGO.
 */
module.exports = INHERIT(/** @lends SVGO.prototype */{

    /**
     * @param {Object} [config] config to extend
     *
     * @constructs
     *
     * @private
     */
    __constructor: function(config) {

        this.config = CONFIG(config);

    },

    /**
     * Main optimize function.
     *
     * @param {String} svgdata input data
     *
     * @return {String} output data deferred promise
     */
    optimize: function(svgdata) {

        return this.config
            .then(function(config) {

                return SVG2JS(svgdata, config.svg2js)
                    .then(function(jsdata) {

                        return JS2SVG(PLUGINS(jsdata, config.plugins), config.js2svg);

                    });

            });

    }

});
