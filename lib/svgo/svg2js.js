'use strict';

var Q = require('q'),
    SAX = require('sax'),
    JSAPI = require('./jsAPI');

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @module svg2js
 *
 * @param {String} svg input data
 * @param {Object} config sax xml parser config
 *
 * @return {Object} output data deferred promise
 */
module.exports = function(svg, config) {

    var deferred = Q.defer(),
        sax = SAX.parser(config.strict, config),
        root = {},
        current = root,
        stack = [];

    function pushToContent(content) {

        content = new JSAPI(content);

        (current.content = current.content || []).push(content);

        return content;

    }

    sax.ondoctype = function(doctype) {

        pushToContent({
            doctype: doctype
        });

    };

    sax.onprocessinginstruction = function(data) {

        pushToContent({
            processinginstruction: data
        });

    };

    sax.oncomment = function(comment) {

        pushToContent({
            comment: comment
        });

    };

    sax.oncdata = function(cdata) {

        pushToContent({
            cdata: cdata
        });

    };

    sax.onopentag = function(data) {

        var elem = {
            elem: data.name,
            prefix: data.prefix,
            local: data.local
        };

        if (Object.keys(data.attributes).length) {
            elem.attrs = {};

            for (var name in data.attributes) {
                elem.attrs[name] = {
                    name: name,
                    value: data.attributes[name].value,
                    prefix: data.attributes[name].prefix,
                    local: data.attributes[name].local
                };
            }
        }

        elem = pushToContent(elem);
        current = elem;

        stack.push(elem);

    };

    sax.ontext = function(text) {

        pushToContent({
            text: text
        });

    };

    sax.onclosetag = function() {

        stack.pop();
        current = stack[stack.length - 1];

    };

    sax.onerror = function(e) {

        deferred.reject(new Error('svg2js: ' + e.message));

        // https://github.com/isaacs/sax-js#events
        // "The error will be hanging out on parser.error,
        // and must be deleted before parsing can continue"
        this.error = null;

    };

    sax.onend = function() {

        deferred.resolve(root);

    };

    sax.write(svg).close();

    return deferred.promise;

};
