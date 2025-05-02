import {
  attrsGroups,
  inheritableAttrs,
  presentationNonInheritableGroupAttrs,
} from './_collections.js';

/**
 * @typedef {import('../lib/types.js').Plugin} Plugin
 */

export const name = 'removeNonInheritableGroupAttrs';
export const description =
  "removes non-inheritable group's presentational attributes";

/**
 * Remove non-inheritable group's "presentation" attributes.
 *
 * @author Kir Belevich
 *
 * @type {Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'g') {
          for (const name of Object.keys(node.attributes)) {
            if (
              attrsGroups.presentation.has(name) &&
              !inheritableAttrs.has(name) &&
              !presentationNonInheritableGroupAttrs.has(name)
            ) {
              delete node.attributes[name];
            }
          }
        }
      },
    },
  };
};
