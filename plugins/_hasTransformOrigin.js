import { computeStyle } from '../lib/style.js';

/**
 * Whether an element has a transform origin whose context must be preserved.
 *
 * @param {import('../lib/types.js').XastElement} node
 * @param {ReturnType<typeof import('../lib/style.js').collectStylesheet>} stylesheet
 * @returns {boolean}
 */
export const hasTransformOrigin = (node, stylesheet) => {
  return (
    node.attributes['transform-origin'] != null ||
    computeStyle(stylesheet, node)['transform-origin'] != null
  );
};
