'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'adds classnames to an outer <svg> element';

/**
 * Add classnames to an outer <svg> element.
 *
 * @author April Arcus
 */
exports.fn = function(data, params) {

    var classNames = params.classNames || [ params.className ];
    var svg = data.content[0];

    if (svg.isElem('svg')) {

        if (svg.hasAttr('class')) {
            svg.attr('class').value =
                svg.attr('class').value
                    .split(' ')
                    .concat(classNames)
                    .join(' ');
        } else {
            svg.addAttr({
                name: 'class',
                value: classNames.join(' '),
                prefix: '',
                local: 'class'
            });
        }

    }

    return data;

};
