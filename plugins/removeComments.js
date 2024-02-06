import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'removeComments';
export const description = 'removes comments';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    preservePatterns: {
      title: 'Preserve Patterns',
      description:
        'An array of regular expressions ((RegExp)[https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp] or string). If the comment matches any of these, including partial matches, the comment is preserved. Set to `false` to disable this behavior and remove comments indiscriminately.',
      type: ['array', 'boolean'],
      items: {
        type: 'string',
      },
      default: ['^!'],
    },
    floatPrecision: {
      title: 'Float Precision',
      description:
        'Number of decimal places to round to, using conventional rounding rules.',
      type: 'number',
    },
    noSpaceAfterFlags: {
      title: 'No Space After Flags',
      description:
        'If to omit spaces after flags. Flags are values that can only be `0` or `1` and are used by some path commands, namely [`A` and `a`](https://developer.mozilla.org/docs/Web/SVG/Attribute/d#elliptical_arc_curve).',
      type: 'boolean',
      default: false,
    },
  },
};

/**
 * If a comment matches one of the following patterns, it will be
 * preserved by default. Particularly for copyright/license information.
 */
const DEFAULT_PRESERVE_PATTERNS = [/^!/];

/**
 * Remove comments.
 *
 * @example
 * <!-- Generator: Adobe Illustrator 15.0.0, SVG Export
 * Plug-In . SVG Version: 6.00 Build 0)  -->
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'removeComments'>}
 */
export const fn = (_root, params) => {
  const { preservePatterns = DEFAULT_PRESERVE_PATTERNS } = params;

  return {
    comment: {
      enter: (node, parentNode) => {
        if (preservePatterns) {
          if (!Array.isArray(preservePatterns)) {
            throw Error(
              `Expected array in removeComments preservePatterns parameter but received ${preservePatterns}`,
            );
          }

          const matches = preservePatterns.some((pattern) => {
            return new RegExp(pattern).test(node.value);
          });

          if (matches) {
            return;
          }
        }

        detachNodeFromParent(node, parentNode);
      },
    },
  };
};
