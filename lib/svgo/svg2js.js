'use strict';

var SAX = require('sax'),
    JSAPI = require('./jsAPI.js'),
    CSSClassList = require('./css-class-list'),
    CSSStyleDeclaration = require('./css-style-declaration'),
    textElems = require('../../plugins/_collections.js').textElems,
    entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g;

var config = {
    strict: true,
    trim: false,
    normalize: false,
    lowercase: true,
    xmlns: true,
    position: true
};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 */
module.exports = function(data) {

    var sax = SAX.parser(config.strict, config),
        root = new JSAPI({ elem: '#document', content: [] }),
        current = root,
        stack = [root],
        textContext = null;

    function pushToContent(content) {

        content = new JSAPI(content, current);

        (current.content = current.content || []).push(content);

        return content;

    }

    sax.ondoctype = function(doctype) {

        pushToContent({
            doctype: doctype
        });

        var subsetStart = doctype.indexOf('['),
            entityMatch;

        if (subsetStart >= 0) {
            entityDeclaration.lastIndex = subsetStart;

            while ((entityMatch = entityDeclaration.exec(data)) != null) {
                sax.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3];
            }
        }
    };

    sax.onprocessinginstruction = function(data) {

        pushToContent({
            processinginstruction: data
        });

    };

    sax.oncomment = function(comment) {

        pushToContent({
            comment: comment.trim()
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
            local: data.local,
            attrs: {}
        };

        elem.class = new CSSClassList(elem);
        elem.style = new CSSStyleDeclaration(elem);

        if (Object.keys(data.attributes).length) {
            for (var name in data.attributes) {

                if (name === 'class') { // has class attribute
                    elem.class.hasClass();
                }

                if (name === 'style') { // has style attribute
                    elem.style.hasStyle();
                }

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

        // Save info about tags containing text to prevent trimming of meaningful whitespace
        if (textElems.includes(data.name) && !data.prefix) {
            textContext = current;
        }

        stack.push(elem);

    };

    sax.ontext = function(text) {

        if (/\S/.test(text) || textContext) {

            if (!textContext)
                text = text.trim();

            pushToContent({
                text: text
            });

        }

    };

    sax.onclosetag = function() {

        var last = stack.pop();

        if (last == textContext) {
            textContext = null;
        }
        current = stack[stack.length - 1];

    };

    sax.onerror = function(e) {

        e.message = 'Error in parsing SVG: ' + e.message;
        if (e.message.indexOf('Unexpected end') < 0) {
            throw e;
        }

    };

    try {
        sax.write(data).close();
        return root;
    } catch (e) {
        return { error: e.message };
    }

};
