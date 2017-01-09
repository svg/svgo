'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'removes unused styles from <style> based on usage data';

exports.params = {
    removeUnusedStyles: {
        ids: true,
        classes: true,
        tags: true
    }
};

var csso = require('csso');

/**
 * Remove unused styles from <style> based on usage data
 *
 * @author Roman Dvornov
 */
exports.fn = function(ast, params) {

    var usageData = collectUsageData(ast);
    var styles = findStyleElems(ast);

    for (var key in usageData) {
        if (!shouldFilter(params, key)) {
            usageData[key] = false;
        }
    }

    styles.forEach(function(style) {
        var styleCss = style.content[0].text || style.content[0].cdata || [];
        var DATA = styleCss.indexOf('>') >= 0 || styleCss.indexOf('<') >= 0 ? 'cdata' : 'text';

        style.content[0][DATA] = csso.minify(styleCss, {
            usage: usageData
        }).css;
    });

    return ast;
};

function shouldFilter(params, name) {
    if (!params || 'removeUnusedStyles' in params === false) {
        return true;
    }

    if (params.removeUnusedStyles && name in params.removeUnusedStyles === false) {
        return true;
    }

    return Boolean(params.removeUnusedStyles && params.removeUnusedStyles[name]);
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
            }
        }

        return styles;
    }

    return walk(ast, []);
}

function collectUsageData(ast) {

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

    var usageData = walk(ast, {
        ids: Object.create(null),
        classes: Object.create(null),
        tags: Object.create(null)
    });

    for (var key in usageData) {
        usageData[key] = Object.keys(usageData[key]);
    }

    return usageData;
}
