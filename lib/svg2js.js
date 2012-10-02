var Q = require('q'),
    SAX = require('sax'),
    TOOLS = require('./tools'),
    JSAPI = require('./jsAPI');

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @module svg2js
 *
 * @param {String} svgdata input data
 * @param {Object} config sax xml parser config
 * @return {Object} output data deferred promise
 */
module.exports = function(svgdata, config) {

    var strict = config.strict;
    delete config.strict;

    var deferred = Q.defer(),
        sax = SAX.parser(strict, config),
        root = {},
        current = root,
        stack = [];

    function pushToContent(content) {

        content = new JSAPI.Nodes(content);

        (current.content = current.content || []).push(content);

        return content;

    };

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

    sax.onend = function() {

        deferred.resolve(root);

    };

    sax.write(svgdata).close();

    return deferred.promise;

};
