'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'adds width and height attributes based on value of viewBox attribute';

exports.params = {
    replaceExistingAttributes: false,
    addPixelUnits: true
};

/**
 * Add width and height attributes to an outer <svg> element.
 * Values are extracted from the viewBox attribute.
 *
 * This allows the SVG to display at the correct size when rendered in a web browser without additional CSS.
 *
 * @author Keegan Street
 */
exports.fn = function(data, params) {
    var svg = data.content[0],
        viewBox,
        width,
        height;

    if (
        svg.isElem('svg') &&
        svg.hasAttr('viewBox') &&
        (params.replaceExistingAttributes || (!svg.hasAttr('height') && !svg.hasAttr('width')))
    ) {
        viewBox = svg.attr('viewBox').value.split(' ');
        width = viewBox[2];
        height = viewBox[3];

        if (params.addPixelUnits) {
            width += 'px';
            height += 'px';
        }

        svg.addAttr({
            name: 'width',
            prefix: '',
            local: 'width',
            value: width
        });

        svg.addAttr({
            name: 'height',
            prefix: '',
            local: 'height',
            value: height
        });
    }

    return data;

};
