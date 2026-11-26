import { attrsGroups } from './_collections.js';

export const name = 'removeEmptyAttrs';
export const description = 'removes empty attributes';

const languageAttrs = new Set(['lang', 'xml:lang']);

/**
 * Remove attributes with empty values.
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin}
 * @since 0.0.1
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        for (const [name, value] of Object.entries(node.attributes)) {
          if (
            value === '' &&
            // empty conditional processing attributes prevents elements from rendering
            !attrsGroups.conditionalProcessing.has(name) &&
            // empty language attributes reset the language inherited from ancestors
            !languageAttrs.has(name)
          ) {
            delete node.attributes[name];
          }
        }
      },
    },
  };
};
