import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('../lib/types.js').Plugin} Plugin
 */

export const name = 'removeMetadata';
export const description = 'removes <metadata>';

/**
 * Remove <metadata>.
 *
 * https://www.w3.org/TR/SVG11/metadata.html
 *
 * @author Kir Belevich
 *
 * @type {Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'metadata') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
