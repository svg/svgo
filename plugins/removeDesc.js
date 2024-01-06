import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeDesc';
export const description = 'removes <desc>';

const standardDescs = /^(Created with|Created using)/;

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements 'cause it can be used for accessibility.
 * Enable parameter 'removeAny' to remove any description.
 *
 * https://developer.mozilla.org/docs/Web/SVG/Element/desc
 *
 * @author Daniel Wabyick
 *
 * @type {import('./plugins-types.js').Plugin<'removeDesc'>}
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
