/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'addAttributesToSVGElement';
export const description = 'adds attributes to an outer <svg> element';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  required: ['attributes'],
  properties: {
    attributes: {
      title: 'Attributes',
      description:
        'Attributes to add to the `<svg>` element. If key/value pairs are passed, the attributes are added with the paired value. If an array is passed, attributes are added with no key associated with them.',
      type: 'array',
      default: undefined,
      minItems: 1,
      items: {
        type: 'string',
      },
    },
  },
};

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
`;

/**
 * Add attributes to an outer <svg> element. Example config:
 *
 * @author April Arcus
 *
 * @type {import('./plugins-types.js').Plugin<'addAttributesToSVGElement'>}
 */
export const fn = (root, params) => {
  if (!Array.isArray(params.attributes) && !params.attribute) {
    console.error(ENOCLS);
    return null;
  }
  const attributes = params.attributes || [params.attribute];
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          for (const attribute of attributes) {
            if (typeof attribute === 'string') {
              if (node.attributes[attribute] == null) {
                // @ts-ignore disallow explicit nullable attribute value
                node.attributes[attribute] = undefined;
              }
            }
            if (typeof attribute === 'object') {
              for (const key of Object.keys(attribute)) {
                if (node.attributes[key] == null) {
                  // @ts-ignore disallow explicit nullable attribute value
                  node.attributes[key] = attribute[key];
                }
              }
            }
          }
        }
      },
    },
  };
};
