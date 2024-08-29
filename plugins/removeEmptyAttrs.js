import { attrsGroups } from './_collections.js';

export const name = 'removeEmptyAttrs';
export const description = 'removes empty attributes';

/**
 * Remove attributes with empty values.
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'removeEmptyAttrs'>}
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
