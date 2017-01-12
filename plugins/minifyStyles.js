'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'minifies styles and removes unused styles based on usage data';

exports.params = {
    // ... CSSO options goes here
    svgo: {},

    // additional 
    usage: {
        ids: true,
        classes: true,
        tags: true
    }
};

var csso = require('csso');

/**
 * Minifies styles (<style> element + style attribute) using CSSO
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(ast, options) {
    options = options || {};

    var minifyOptionsForStylesheet = cloneObject(options);
    var minifyOptionsForAttribute = cloneObject(options);
    var elems = findStyleElems(ast);

    minifyOptionsForStylesheet.usage = collectUsageData(ast, options);
    minifyOptionsForAttribute.usage = null;

    elems.forEach(function(elem) {
        if (elem.isElem('style')) {
            // <style> element
            var styleCss = elem.content[0].text || elem.content[0].cdata || [];
            var DATA = styleCss.indexOf('>') >= 0 || styleCss.indexOf('<') >= 0 ? 'cdata' : 'text';

            elem.content[0][DATA] = csso.minify(styleCss, minifyOptionsForStylesheet).css;
        } else {
            // style attribute
            var elemStyle = elem.attr('style').value;

            elem.attr('style').value = csso.minifyBlock(elemStyle, minifyOptionsForAttribute).css;
        }
    });

    return ast;
};

function cloneObject(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = obj[key];
    }

    return result;
}

function findStyleElems(ast) {

    function walk(items, styles) {
        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            // go deeper
            if (item.content) {
                walk(item, styles);
            }

            if (item.isElem('style') && !item.isEmpty()) {
                styles.push(item);
            } else if (item.isElem() && item.hasAttr('style')) {
                styles.push(item);
            }
        }

        return styles;
    }

    return walk(ast, []);
}

function shouldFilter(options, name) {
    if ('usage' in options === false) {
        return true;
    }

    if (options.usage && name in options.usage === false) {
        return true;
    }

    return Boolean(options.usage && options.usage[name]);
}

function collectUsageData(ast, options) {

    function walk(items, usageData) {
        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            // go deeper
            if (item.content) {
                walk(item, usageData);
            }

            if (item.isElem()) {
                usageData.tags[item.elem] = true;

                if (item.hasAttr('id')) {
                    usageData.ids[item.attr('id').value] = true;
                }

                if (item.hasAttr('class')) {
                    item.attr('class').value.replace(/^\s+|\s+$/g, '').split(/\s+/).forEach(function(className) {
                        usageData.classes[className] = true;
                    });
                }
            }
        }

        return usageData;
    }

    var hasData = false;
    var usageData = walk(ast, {
        ids: Object.create(null),
        classes: Object.create(null),
        tags: Object.create(null)
    });

    for (var key in usageData) {
        usageData[key] = shouldFilter(options, key) && Object.keys(usageData[key]);

        if (usageData[key]) {
            hasData = true;
        }
    }

    return hasData ? usageData : null;
}
