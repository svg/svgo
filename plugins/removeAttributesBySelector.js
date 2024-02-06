import { querySelectorAll } from '../lib/xast.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'removeAttributesBySelector';
export const description =
  'removes attributes of elements that match a css selector';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  required: ['selectors'],
  properties: {
    selectors: {
      title: 'Selectors',
      description:
        'An array of objects with two properties, `selector`, and `attributes`, which represent a CSS selector and the attributes to remove respectively.',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
          },
          attributes: {
            type: 'attributes',
          },
        },
      },
    },
  },
};

/**
 * Removes attributes of elements that match a css selector.
 *
 * @example
 * <caption>A selector removing a single attribute</caption>
 * plugins: [
 *   {
 *     name: "removeAttributesBySelector",
 *     params: {
 *       selector: "[fill='#00ff00']"
 *       attributes: "fill"
 *     }
 *   }
 * ]
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100" stroke="#00ff00"/>
 *
 * <caption>A selector removing multiple attributes</caption>
 * plugins: [
 *   {
 *     name: "removeAttributesBySelector",
 *     params: {
 *       selector: "[fill='#00ff00']",
 *       attributes: [
 *         "fill",
 *         "stroke"
 *       ]
 *     }
 *   }
 * ]
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100"/>
 *
 * <caption>Multiple selectors removing attributes</caption>
 * plugins: [
 *   {
 *     name: "removeAttributesBySelector",
 *     params: {
 *       selectors: [
 *         {
 *           selector: "[fill='#00ff00']",
 *           attributes: "fill"
 *         },
 *         {
 *           selector: "#remove",
 *           attributes: [
 *             "stroke",
 *             "id"
 *           ]
 *         }
 *       ]
 *     }
 *   }
 * ]
 *
 * <rect x="0" y="0" width="100" height="100" fill="#00ff00" stroke="#00ff00"/>
 *   ↓
 * <rect x="0" y="0" width="100" height="100"/>
 *
 * @link https://developer.mozilla.org/docs/Web/CSS/CSS_Selectors|MDN CSS Selectors
 *
 * @author Bradley Mease
 *
 * @type {import('./plugins-types.js').Plugin<'removeAttributesBySelector'>}
 */
export const fn = (root, params) => {
  const selectors = Array.isArray(params.selectors)
    ? params.selectors
    : [params];
  for (const { selector, attributes } of selectors) {
    const nodes = querySelectorAll(root, selector);
    for (const node of nodes) {
      if (node.type === 'element') {
        if (Array.isArray(attributes)) {
          for (const name of attributes) {
            delete node.attributes[name];
          }
        } else {
          delete node.attributes[attributes];
        }
      }
    }
  }
  return {};
};
