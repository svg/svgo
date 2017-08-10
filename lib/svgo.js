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

var SVGO = module.exports = function(config) {
    this.config = CONFIG(config);
};

SVGO.prototype.optimize = function(svgstr) {
    var config = this.config,
        maxPassCount = config.multipass ? 10 : 1,
        counter = 0,
        prevResultSize = Number.POSITIVE_INFINITY,
        optimRec = function(svgstr){
            return optimizeOnce(svgstr, config)
            .then(function(svgjs) {
                if (++counter < maxPassCount && svgjs.data.length < prevResultSize) {
                    prevResultSize = svgjs.data.length;
                    return optimRec(svgjs.data);
                }
                return svgjs;
            });
        };
    
    return optimRec(svgstr);

};

// SVGO.prototype.optimizeOnce = function(svgstr) { // could be exposed if needed?
//     return optimizeOnce(svgstr, this.config);
// };

function optimizeOnce(svgstr, config) {
    return new Promise(function(resolve, reject) {
        SVG2JS(svgstr, function(svgjs) {
            if (svgjs.error) {
                return reject(svgjs.error);
            }

            svgjs = PLUGINS(svgjs, config.plugins);
            if (config.datauri) {
                svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
            }
            resolve(JS2SVG(svgjs, config.js2svg));
        });
    });
}

/**
 * The factory that creates a content item with the helper methods.
 *
 * @param {Object} data which passed to jsAPI constructor
 * @returns {JSAPI} content item
 */
SVGO.prototype.createContentItem = function(data) {
    return new JSAPI(data);
};
