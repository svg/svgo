import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeTitle';
export const description = 'removes <title>';

/**
 * Remove <title>.
 *
 * https://developer.mozilla.org/docs/Web/SVG/Element/title
 *
 * @author Igor Kalashnikov
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'title') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
