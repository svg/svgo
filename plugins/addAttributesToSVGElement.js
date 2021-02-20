'use strict';

exports.type = 'full';

exports.active = false;

exports.description = 'adds attributes to an outer <svg> element';

var ENOCLS = `Error in plugin "addAttributesToSVGElement": absent parameters.
It should have a list of "attributes" or one "attribute".
Config example:

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attribute: "mySvg"
    }
  }
]

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attributes: ["mySvg", "size-big"]
    }
  }
]

plugins: [
  {
    name: 'addAttributesToSVGElement',
    params: {
      attributes: [
        {
          focusable: false
        },
        {
          'data-image': icon
        }
      ]
    }
  }
]
`

/**
 * Add attributes to an outer <svg> element. Example config:
 *
 * @author April Arcus
 */
exports.fn = function(data, params) {
    if (!params || !(Array.isArray(params.attributes) || params.attribute)) {
        console.error(ENOCLS);
        return data;
    }

    var attributes = params.attributes || [ params.attribute ],
        svg = data.content[0];

    if (svg.isElem('svg')) {
        attributes.forEach(function (attribute) {
            if (typeof attribute === 'string') {
                if (!svg.hasAttr(attribute)) {
                    svg.addAttr({
                        name: attribute,
                        prefix: '',
                        local: attribute
                    });
                }
            } else if (typeof attribute === 'object') {
                Object.keys(attribute).forEach(function (key) {
                    if (!svg.hasAttr(key)) {
                        svg.addAttr({
                            name: key,
                            value: attribute[key],
                            prefix: '',
                            local: key
                        });
                    }
                });
            }
        });
    }

    return data;

};
