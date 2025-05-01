import { attrsGroups } from './_collections.js';

/**
 * @typedef {import('../lib/types.js').Plugin} Plugin
 */

export const name = 'removeEmptyAttrs';
export const description = 'removes empty attributes';

/**
 * Remove attributes with empty values.
 *
 * @author Kir Belevich
 *
 * @type {Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        for (const [name, value] of Object.entries(node.attributes)) {
          if (
            value === '' &&
            // empty conditional processing attributes prevents elements from rendering
            !attrsGroups.conditionalProcessing.has(name)
          ) {
            delete node.attributes[name];
          }
        }
      },
    },
  };
};
