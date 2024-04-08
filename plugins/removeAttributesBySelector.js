import { matches } from '../lib/xast.js';

export const name = 'removeAttributesBySelector';
export const description =
  'removes attributes of elements that match a css selector';

const ENOATTRS = `Warning: The plugin "removeAttributesBySelector" is missing parameters.
It should have a list of "selectors", or one "selector" and one "attributes".
Without either, the plugin is a noop.`;

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
  if (
    !Array.isArray(params.selectors) &&
    (!params.selector || !params.attributes)
  ) {
    console.warn(ENOATTRS);
    return null;
  }

  const selectors = Array.isArray(params.selectors)
    ? params.selectors
    : [params];

  return {
    element: {
      enter: (node) => {
        for (const { selector, attributes } of selectors) {
          if (matches(node, selector)) {
            if (Array.isArray(attributes)) {
              for (const name of attributes) {
                delete node.attributes[name];
              }
            } else {
              delete node.attributes[attributes];
            }
          }
        }
      },
    },
  };
};
