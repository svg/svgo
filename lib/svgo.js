'use strict';

/**
 * SVGO is a Nodejs-based tool for optimizing SVG vector graphics files.
 *
 * @see http://deepsweet.github.com/svgo/
 *
 * @author Kir Belevich <kir@soulshine.in> (https://github.com/deepsweet)
 * @copyright © 2012 Kir Belevich
 * @license MIT https://raw.github.com/deepsweet/svgo/master/LICENSE
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

        svgjs = PLUGINS(svgjs, config.plugins);

        callback(JS2SVG(svgjs, config.js2svg));

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
