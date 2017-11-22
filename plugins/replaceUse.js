'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'replace all <use> elements with the node they clone';

/**
 * Replace <use> elements with the nodes they clone and remove the top-level xlink attribute and remove their referenced element if it's within <defs>. While this doesn't "optimize" the SVG, it allows the contents to be used in SVG sprites within <symbol> elements.
 *
 * @param {Object} SVG-as-JS
 *
 * @author Tim Shedor
 */
exports.fn = function(data) {
    var defs = {};
    var usedDefs = [];

    function addToDefs(item) {
        if (item.hasAttr('id')) {
            defs['#' + item.attr('id').value] = item;
        }
    }

    findItems(data, addToDefs);

    findItems(data, function(item) {
        // xlink is no longer necessary
        if (item.isElem('svg') && item.hasAttr('xmlns:xlink')) {
            item.removeAttr('xmlns:xlink');
        }

        if (item.isElem('use') && (item.hasAttr('href') || item.hasAttr('xlink:href'))) {
            var id = item.hasAttr('href') ? item.attr('href').value : item.attr('xlink:href').value;
            var def = defs[id];
            var replacement = def.clone();
            replacement.removeAttr('id');

            item.removeAttr('xlink:href');
            item.removeAttr('href');
            item.renameElem('g');

            if (usedDefs.indexOf(def) === -1) {
                usedDefs.push(def);
            }

            item.content = [replacement];
        }
    });

    usedDefs.forEach(removeItem);

    return data;
};

/**
 * Remove the referenced node if it's within <defs> and <defs> if it's ultimately empty
 * @param  {Node} item
 */
function removeItem(item) {
    var parent = item.parentNode;

    if (parent && (parent.isElem('defs') || item.isElem('defs'))) {
        var idx = parent.content.indexOf(item);
        parent.content.splice(idx, 1);

        if (parent.isEmpty() && parent.isElem('defs')) {
            removeItem(parent);
        }
    }
}

function findItems(items, fn) {
    items.content.forEach(function(item) {
        fn(item);

        if (item.content) {
            findItems(item, fn);
        }
    });
    return items;
}
