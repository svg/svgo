'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'adds focusable="false" attribute to an outer <svg> element';

/**
 * Add focusable="false" attribute to an outer <svg> element.
 *
 * Internet Explorer and Edge (prior to version 14) make all embedded <svg> elements
 * keyboard focusable by default, which is not consistent with the SVG specification.
 * To prevent this behaviour, you can add focusable="false" to the <svg>.
 *
 * @see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8090208/
 *
 * @author Keegan Street
 */
exports.fn = function(data) {
    var svg = data.content[0];

    if (svg.isElem('svg')) {
        svg.addAttr({
            name: 'focusable',
            prefix: '',
            local: 'focusable',
            value: 'false'
        });
    }

    return data;
};
