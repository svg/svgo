'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'replace all <use> elements with the node they clone';

/**
 * Replace <use> elements with the nodes they clone and remove the top-level xlink attribute. While this doesn't "optimize" the SVG, it allows the contents to be used in SVG sprites within <symbol> elements. Goes great with removeUselessDefs.
 *
 * @param {Object} SVG-as-JS
 *
 * @author Tim Shedor
 */
exports.fn = function(data) {
    var defs = {};

    function addToDefs(item) {
        if (item.hasAttr('id')) {
            defs['#' + item.attr('id').value] = item;
            item.removeAttr('id');
        }
    }

    function generateDefs(item) {
        if (item.isElem('defs')) {
            findItems(item, addToDefs);
        }
    }

    findItems(data, generateDefs);

    findItems(data, function(item) {
        // xlink is no longer necessary
        if (item.isElem('svg') && item.hasAttr('xmlns:xlink')) {
            item.removeAttr('xmlns:xlink');
        }

        if (item.isElem('use') && (item.hasAttr('href') || item.hasAttr('xlink:href'))) {
            var id = item.hasAttr('href') ? item.attr('href').value : item.attr('xlink:href').value;
            var def = defs[id];

            if (def) {
                item.removeAttr('xlink:href');
                item.removeAttr('href');
                item.renameElem(def.elem);
                def.eachAttr(function(attr) {
                    item.addAttr(attr);
                });
                item.removeAttr('id');
                if (def.content) item.content = def.content;
            }
        }
    });

    return data;
};

function findItems(items, fn) {
    if (!items.content) {
        return undefined
    }
    items.content.forEach(function(item) {
        fn(item);

        if (item.content) {
            findItems(item, fn);
        }
    });
    return items;
}
