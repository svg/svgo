'use strict';

var JSAPI = require('../lib/svgo/jsAPI.js');

exports.type = 'full';
exports.active = true;
exports.description = 'inlines svg definitions';

/**
 * plugin options
 * @typedef {{onlyUnique: boolean}} Params
 */
exports.params = {
    onlyUnique: false
};


/**
 * replaces use tag with the corresponding definitions
 * if onlyUnique = true, replaces only use tags with definitions referred to only once
 * @param {Object} document
 * @param {Params} params
 * @returns {Object}
 */
exports.fn = function(document, params) {

    var defs = document.querySelector('defs');
    var uses = document.querySelectorAll( 'use' );

    if(!uses) {
        return document;
    }

    var useCount = null;
    if (params.onlyUnique === true) {
        useCount = _countUses(uses);
    }

    for (var i = 0; i < uses.length; i++) {
        var href = uses[i].attr('xlink:href').value;
        if (params.onlyUnique === true && useCount[href] > 1) {
            continue;
        }

        var x = uses[i].hasAttr('x') ? uses[i].attr('x').value : null;
        var y = uses[i].hasAttr('y') ? uses[i].attr('y').value : null;

        var attr_value = null;
        if (x && y) {
            attr_value = 'translate(' + x + ', ' + y + ')';
        } else if (x) {
            attr_value = 'translate(' + x + ')';
        }

        var def = defs.querySelector(href);
        if (params.onlyUnique === true && useCount[href] === 1) {
            def = _replaceElement(def);
        }
        if (!def) {
            continue;
        }

        for (var key in uses[i].attrs) {
            if (uses[i].attrs.hasOwnProperty(key) && key !== 'x' && key !== 'y' && key !== 'xlink:href') {
                def.addAttr(uses[i].attrs[key]);
            }
        }

        if (attr_value) {
            var g = new JSAPI({
                elem: 'g',
                attrs: {
                    transform: {
                        name: 'transform',
                        value: attr_value,
                        prefix: null,
                        local: 'transform'
                    }
                },
                content: [def]
            });
            _replaceElement(uses[i], g);
        }
        else {
            _replaceElement(uses[i], def);
        }

    }

    _removeDefs(document, params);


    return document;

};

/**
 * removes defs tag from the svg if possible
 * @param {Object} document
 * @param {Object} params
 * @private
 */
function _removeDefs(document, params) {
    if (params.onlyUnique === false || document.querySelector('defs').content.length === 0) {
        _replaceElement(document.querySelector('defs'));
    }
}

/**
 * counts the number of uses of definitions
 * @param {Array} elements
 * @returns {Object<string, number>}
 * @private
 */
function _countUses(elements) {

    return elements.reduce(function(result, item) {

        var href = item.attr('xlink:href').value;
        if (result.hasOwnProperty(href)) {
            result[href]++;
        }
        else {
            result[href] = 1;
        }

        return result;

    }, {});

}

/**
 * replace element with another
 * if new_element is omitted, old_element will be removed without replacement
 * @param {Object} old_element
 * @param {Object} [new_element]
 * @returns {Object}
 * @private
 */
function _replaceElement(old_element, new_element) {

    var element_index = _getElementIndex(old_element);

    if (new_element) {
        old_element.parentNode.spliceContent(element_index, 1, new_element);
    } else {
        old_element.parentNode.spliceContent(element_index, 1);
    }

    return old_element;

}

/**
 * returns index of the element in the list of siblings
 * returns -1 if element could not be found
 * @param {Object} element
 * @returns {number}
 * @private
 */
function _getElementIndex(element) {

    element.addAttr({
        name: 'data-defs-index',
        value: 'true',
        prefix: '',
        local: 'data-defs-index'
    });

    var index = element.parentNode.content.findIndex(function(content_element) {

        return content_element.hasAttr('data-defs-index', 'true');

    });

    element.removeAttr('data-defs-index');

    return index;

}
