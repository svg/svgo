'use strict';

var SAX = require('sax'),
    JSAPI = require('./jsAPI');

var config = {
    strict: true,
    trim: true,
    normalize: true,
    lowercase: true,
    xmlns: true,
    position: false
};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 * @param {Function} callback
 */
module.exports = function(data, callback) {

    var sax = SAX.parser(config.strict, config),
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

        // https://github.com/isaacs/sax-js#events
        // "The error will be hanging out on parser.error,
        // and must be deleted before parsing can continue"
        this.error = null;

        callback({ error: e.message });
        throw new Error(e.message);

    };

    sax.onend = function() {

        callback(root);

    };

    sax.write(data).close();

};
