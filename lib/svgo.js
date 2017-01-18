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
    JS2SVG = require('./svgo/js2svg.js');

var SVGO = module.exports = function(config) {

    this.config = CONFIG(config);

};


function SVG2JSAsync(s){
    return new Promise(function(resolve, reject) {
        SVG2JS(s, function(result){
            if (result.error) return reject(new Error(result.error));
            resolve(result);
        });
    });
}

function reoptimize(svgStr, config, passCount, prevSvgjs) {
    return SVG2JSAsync(svgStr)
    .then(function(_svgjs) {
        var svgjs = JS2SVG(PLUGINS(_svgjs, config.plugins), config.js2svg);
        if (prevSvgjs.data.length <= svgjs.data.length) return prevSvgjs;
        if (passCount <= 1) return svgjs;
        return reoptimize(svgjs.data, config, passCount-1, svgjs);
    });
}


SVGO.prototype.optim = function(svgStr, passes) {
    return reoptimize(svgStr, this.config, passes || (this.config.multipass ? 10 : 1), {data:{length:Infinity}});
};


SVGO.prototype.optimize = function(svgstr, callback) {
    if (this.config.error) return callback(this.config);

    var _this = this,
        config = this.config,
        maxPassCount = config.multipass ? 10 : 1,
        counter = 0,
        prevResultSize = Number.POSITIVE_INFINITY,
        optimizeOnceCallback = function(svgjs) {

            if (svgjs.error) {
                callback(svgjs);
                return;
            }

            if (++counter < maxPassCount && svgjs.data.length < prevResultSize) {
                prevResultSize = svgjs.data.length;
                _this._optimizeOnce(svgjs.data, optimizeOnceCallback);
            } else {
                callback(svgjs);
            }

        };

    _this._optimizeOnce(svgstr, optimizeOnceCallback);

};



SVGO.prototype._optimizeOnce = function(svgstr, callback) {
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
