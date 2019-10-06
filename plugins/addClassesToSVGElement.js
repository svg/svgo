var path = require('path');

'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'adds classnames to an outer <svg> element';

var ENOCLS = `Error in plugin "addClassesToSVGElement": absent parameters.
It should have a list of classes in "classNames" or one "className".
Config example:

plugins:
- addClassesToSVGElement:
    className: "mySvg"

plugins:
- addClassesToSVGElement:
    classNames: ["mySvg", "size-big", "svg-[name]"]
`;

/**
 * Add classnames to an outer <svg> element. Example config:
 *
 * plugins:
 * - addClassesToSVGElement:
 *     className: 'mySvg'
 *
 * plugins:
 * - addClassesToSVGElement:
 *     classNames: ['mySvg', 'size-big', 'svg-[name]']
 *
 * @author April Arcus
 */
exports.fn = function(data, params, source) {

    if (!params || !(Array.isArray(params.classNames) && params.classNames.some(String) || params.className)) {
        console.error(ENOCLS);
        return data;
    }

    var filename = path.basename(source.path, '.svg'),
	    classNames = params.classNames || [ params.className ],
        svg = data.content[0],
		el;

    if (svg.isElem('svg')) {

        classNames.forEach(function(className) {
            if( className.includes('[name]') ) {
                el = className.replace('[name]', filename);
                classNames.pop(className);
                classNames.push(el);
            }
        });

        svg.class.add.apply(svg.class, classNames);
    }

    return data;

};
