'use strict';

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
    Q = require('q'),
    FS = require('fs'),
    CONFIG = require('./svgo/config'),
    SVG2JS = require('./svgo/svg2js'),
    PLUGINS = require('./svgo/plugins'),
    JS2SVG = require('./svgo/js2svg'),
    decodeSVGDatauri = require('./svgo/tools').decodeSVGDatauri;

/**
 * @class SVGO.
 */
module.exports = INHERIT(/** @lends SVGO.prototype */{

    /**
     * @param {Object} [config] custom config to extend default
     *
     * @constructs
     *
     * @private
     */
    __constructor: function(config) {

        this.config = CONFIG(config);

    },

    /**
     * Optimize SVG data from string.
     *
     * @param {String} str input string
     *
     * @return {Object} output string deferred promise
     */
    fromString: function(str) {

        var startTime = Date.now();

        str = decodeSVGDatauri(str);

        return this.config
            .then(function(config) {

                return SVG2JS(str, config.svg2js)
                    .then(function(jsdata) {

                        var result = JS2SVG(PLUGINS(jsdata, config.plugins), config.js2svg);

                        result.info.inBytes = Buffer.byteLength(str, 'utf-8');
                        result.info.outBytes = Buffer.byteLength(result.data, 'utf-8');

                        result.info.time = Date.now() - startTime;

                        return result;

                    });

            });

    },

    /**
     * Optimize SVG data from Stream.
     *
     * @param {Object} stream input stream
     *
     * @return {Object} output string deferred promise
     */
    fromStream: function(stream) {

        var deferred = Q.defer(),
            inputData = '',
            self = this;

        stream.pause();

        stream
            .on('data', function(chunk) {
                inputData += chunk;
            })
            .once('end', function() {
                deferred.resolve(inputData);
            })
            .resume();

        return deferred.promise
            .then(function(str) {

                return self.fromString(str);

            });

    },

    /**
     * Optimize SVG data from file.
     *
     * @param {String} path file path
     *
     * @return {Object} output string deferred promise
     */
    fromFile: function(path) {

        return this.fromStream(FS.createReadStream(path, { encoding: 'utf8' }));

    }

});
