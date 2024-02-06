import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'removeEmptyText';
export const description = 'removes empty <text> elements';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    text: {
      title: 'Remove <text>',
      description:
        'If to remove empty [`<text>`](https://developer.mozilla.org/docs/Web/SVG/Element/text) elements.',
      type: 'boolean',
      default: true,
    },
    tspan: {
      title: 'Remove <tspan>',
      description:
        'If to remove empty [`<tspan>`](https://developer.mozilla.org/docs/Web/SVG/Element/tspan) elements.',
      type: 'boolean',
      default: true,
    },
    tref: {
      title: 'Remove <tref>',
      description:
        'If to remove empty [`<tref>`](https://developer.mozilla.org/docs/Web/SVG/Element/tref) elements.',
      type: 'boolean',
      default: true,
    },
  },
};

/**
 * Remove empty Text elements.
 *
 * @see https://www.w3.org/TR/SVG11/text.html
 *
 * @example
 * Remove empty text element:
 * <text/>
 *
 * Remove empty tspan element:
 * <tspan/>
 *
 * Remove tref with empty xlink:href attribute:
 * <tref xlink:href=""/>
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'removeEmptyText'>}
 */
export const fn = (root, params) => {
  const { text = true, tspan = true, tref = true } = params;
  return {
    element: {
      enter: (node, parentNode) => {
        // Remove empty text element
        if (text && node.name === 'text' && node.children.length === 0) {
          detachNodeFromParent(node, parentNode);
        }
        // Remove empty tspan element
        if (tspan && node.name === 'tspan' && node.children.length === 0) {
          detachNodeFromParent(node, parentNode);
        }
        // Remove tref with empty xlink:href attribute
        if (
          tref &&
          node.name === 'tref' &&
          node.attributes['xlink:href'] == null
        ) {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
