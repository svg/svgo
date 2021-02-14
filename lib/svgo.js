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

var CONFIG = require('./svgo/config.js'),
    SVG2JS = require('./svgo/svg2js.js'),
    PLUGINS = require('./svgo/plugins.js'),
    JSAPI = require('./svgo/jsAPI.js'),
    encodeSVGDatauri = require('./svgo/tools.js').encodeSVGDatauri,
    JS2SVG = require('./svgo/js2svg.js');

var SVGO = function(config) {
    this.config = CONFIG(config);
};

SVGO.prototype.optimize = function(svgstr, info = {}) {
    const config = this.config;
    if (config.error) {
        throw Error(config.error);
    }
    const maxPassCount = config.multipass ? 10 : 1;
    let prevResultSize = Number.POSITIVE_INFINITY;
    let svgjs = null;
    for (let i = 0; i < maxPassCount; i += 1) {
        svgjs = SVG2JS(svgstr);
        if (svgjs.error == null) {
            svgjs = PLUGINS(svgjs, info, config.plugins);
        }
        svgjs = JS2SVG(svgjs, config.js2svg);
        if (svgjs.error) {
            throw Error(svgjs.error);
        }
        info.multipassCount = i;
        if (svgjs.data.length < prevResultSize) {
            prevResultSize = svgjs.data.length
        } else {
            if (config.datauri) {
                svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
            }
            if (info && info.path) {
                svgjs.path = info.path;
            }
            return svgjs;
        }
    }
    return svgjs;
};

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which is passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
SVGO.prototype.createContentItem = function(data) {
    return new JSAPI(data);
};

SVGO.Config = CONFIG;

module.exports = SVGO;
// Offer ES module interop compatibility.
module.exports.default = SVGO;
