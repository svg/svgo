import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef RemoveDescParams
 * @property {boolean=} removeAny
 */

export const name = 'removeDesc';
export const description = 'removes <desc>';

const standardDescs = /^(Created with|Created using)/;

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements because it can be
 * used for accessibility. Enable parameter 'removeAny' to remove any
 * description.
 *
 * @author Daniel Wabyick
 * @see https://developer.mozilla.org/docs/Web/SVG/Element/desc
 *
 * @type {import('../lib/types.js').Plugin<RemoveDescParams>}
 */
export const fn = (root, params) => {
  const { removeAny = false } = params;
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'desc') {
          if (
            removeAny ||
            node.children.length === 0 ||
            (node.children[0].type === 'text' &&
              standardDescs.test(node.children[0].value))
          ) {
            detachNodeFromParent(node, parentNode);
          }
        }
      },
    },
  };
};
