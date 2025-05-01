import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('../lib/types.js').Plugin} Plugin
 */

export const name = 'removeStyleElement';
export const description = 'removes <style> element (disabled by default)';

/**
 * Remove <style>.
 *
 * https://www.w3.org/TR/SVG11/styling.html#StyleElement
 *
 * @author Betsy Dupuis
 *
 * @type {Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'style') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
