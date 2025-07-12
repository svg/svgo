/**
 * @typedef AddAttributesToSVGElementParams
 * @property {string | Record<string, null | string>=} attribute
 * @property {Array<string | Record<string, null | string>>=} attributes
 */

export const name = 'addAttributesToSVGElement';
export const description = 'adds attributes to an outer <svg> element';

const ENOCLS = `Error in plugin "addAttributesToSVGElement": absent parameters.
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
 * Add attributes to an outer <svg> element.
 *
 * @author April Arcus
 *
 * @type {import('../lib/types.js').Plugin<AddAttributesToSVGElementParams>}
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
                // @ts-expect-error disallow explicit nullable attribute value
                node.attributes[attribute] = undefined;
              }
            }
            if (typeof attribute === 'object') {
              for (const key of Object.keys(attribute)) {
                if (node.attributes[key] == null) {
                  // @ts-expect-error disallow explicit nullable attribute value
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
