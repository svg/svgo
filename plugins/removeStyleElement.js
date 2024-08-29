import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeStyleElement';
export const description = 'removes <style> element (disabled by default)';

/**
 * Remove <style>.
 *
 * https://www.w3.org/TR/SVG11/styling.html#StyleElement
 *
 * @author Betsy Dupuis
 *
 * @type {import('./plugins-types.js').Plugin<'removeStyleElement'>}
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
