'use strict';

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see https://github.com/svg/svgo
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.githubusercontent.com/svg/svgo/master/LICENSE
 */

var CONFIG = require('./svgo/config'),
    SVG2JS = require('./svgo/svg2js'),
    PLUGINS = require('./svgo/plugins'),
    JSAPI = require('./svgo/jsAPI.js'),
    JS2SVG = require('./svgo/js2svg');

var SVGO = module.exports = function(config) {

    this.config = CONFIG(config);

};

SVGO.prototype.optimize = function(svgstr, callback) {

    var config = this.config;

    SVG2JS(svgstr, function(svgjs) {

        if (svgjs.error) {
            callback(svgjs);
            return;
        }

        var svg = { data : null },
            maxIterationCount = config.multipass ? 10 : 1,
            counter = 0,
            prevResult;

        do {
            prevResult = svg;
            svgjs = PLUGINS(svgjs, config.plugins);
            svg = JS2SVG(svgjs, config.js2svg);
        } while(++counter < maxIterationCount && prevResult.data !== svg.data);

        callback(svg);

    });

};


/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
SVGO.prototype.createContentItem = function(data) {

    return new JSAPI(data);

};
