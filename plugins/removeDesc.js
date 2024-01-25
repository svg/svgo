import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'removeDesc';
export const description = 'removes <desc>';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    removeAny: {
      title: 'Remove Any',
      description:
        'By default, this plugin only removes descriptions that are either empty or contain editor attribution. Enabling this removes the `<desc>` element indiscriminately.',
      type: 'boolean',
      default: false,
    },
  },
};

const standardDescs = /^(Created with|Created using)/;

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements 'cause it can be used for accessibility.
 * Enable parameter 'removeAny' to remove any description.
 *
 * https://developer.mozilla.org/docs/Web/SVG/Element/desc
 *
 * @author Daniel Wabyick
 *
 * @type {import('./plugins-types.js').Plugin<'removeDesc'>}
 */
export const fn = (root, params) => {
  const { removeAny = false } = params;
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'desc') {
          if (
            removeAny ||
            node.children.length === 0 ||
            (node.children[0].type === 'text' &&
              standardDescs.test(node.children[0].value))
          ) {
            detachNodeFromParent(node, parentNode);
          }
        }
      },
    },
  };
};
