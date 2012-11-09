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
    PATH = require('path'),
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
     * @param {Object} [config] config to extend
     *
     * @constructs
     *
     * @private
     */
    __constructor: function(config) {

        this.config = CONFIG(config);

    },

    fromString: function(str) {

        str = decodeSVGDatauri(str);

        return this.config
            .then(function(config) {

                return SVG2JS(str, config.svg2js)
                    .then(function(jsdata) {

                        var out = JS2SVG(PLUGINS(jsdata, config.plugins), config.js2svg);

                        out.info.startBytes = Buffer.byteLength(str, 'utf-8');
                        out.info.endBytes = Buffer.byteLength(out.data, 'utf-8');

                        return out;

                    });

            });

    },

    fromStream: function(stream) {

        var deferred = Q.defer(),
            inputData = [],
            self = this;

        stream.pause();

        stream
            .on('data', function(chunk) {
                inputData.push(chunk);
            })
            .once('end', function() {
                deferred.resolve(inputData.join());
            })
            .resume();

        return deferred.promise
            .then(function(str) {

                return self.fromString(str);

            });

    },

    fromFile: function(path) {

        path = PATH.resolve(__dirname, path);

        return this.fromStream(FS.createReadStream(path, { encoding: 'utf8' }));

    }

});
