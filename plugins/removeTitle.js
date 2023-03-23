'use strict';

const { detachNodeFromParent } = require('../lib/xast.js');

exports.name = 'removeTitle';
exports.description = 'removes <title>';

/**
 * Remove <title>.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
 *
 * @author Igor Kalashnikov
 *
 * @type {import('./plugins-types').Plugin<'removeTitle'>}
 */
exports.fn = () => {
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
