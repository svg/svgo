/**
 * @typedef CleanupAttrsParams
 * @property {boolean=} newlines
 * @property {boolean=} trim
 * @property {boolean=} spaces
 */

export const name = 'cleanupAttrs';
export const description =
  'cleanups attributes from newlines, trailing and repeating spaces';

const regNewlinesNeedSpace = /(\S)\r?\n(\S)/g;
const regNewlines = /\r?\n/g;
const regSpaces = /\s{2,}/g;

/**
 * Cleanup attributes values from newlines, trailing and repeating spaces.
 *
 * @author Kir Belevich
 * @type {import('../lib/types.js').Plugin<CleanupAttrsParams>}
 */
export const fn = (root, params) => {
  const { newlines = true, trim = true, spaces = true } = params;
  return {
    element: {
      enter: (node) => {
        for (const name of Object.keys(node.attributes)) {
          if (newlines) {
            // new line which requires a space instead
            node.attributes[name] = node.attributes[name].replace(
              regNewlinesNeedSpace,
              (match, p1, p2) => p1 + ' ' + p2,
            );
            // simple new line
            node.attributes[name] = node.attributes[name].replace(
              regNewlines,
              '',
            );
          }
          if (trim) {
            node.attributes[name] = node.attributes[name].trim();
          }
          if (spaces) {
            node.attributes[name] = node.attributes[name].replace(
              regSpaces,
              ' ',
            );
          }
        }
      },
    },
  };
};
