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
    JS2SVG = require('./svgo/js2svg');

var SVGO = module.exports = function(config) {

    this.config = CONFIG(config);

};

SVGO.prototype.optimize = function(svgstr) {

    var config = this.config;
    var result;

    var svgjs = SVG2JS(svgstr);
    svgjs = PLUGINS(svgjs, config.plugins);
    result = JS2SVG(svgjs, config.js2svg);

    return result;

};
