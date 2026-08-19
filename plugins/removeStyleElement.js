import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeStyleElement';
export const description = 'removes <style> element';

/**
 * Remove <style>.
 *
 * https://www.w3.org/TR/SVG11/styling.html#StyleElement
 *
 * @author Betsy Dupuis
 *
 * @type {import('../lib/types.js').Plugin}
 * @since 0.6.0
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
