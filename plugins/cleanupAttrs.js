/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'cleanupAttrs';
export const description =
  'cleanups attributes from newlines, trailing and repeating spaces';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    newlines: {
      title: 'New Lines',
      description: 'Replace instances of a newline with a single whitespace.',
      type: 'boolean',
      default: true,
    },
    trim: {
      title: 'Trim',
      description:
        'Trim whitespace characters from the start and end of attribute values.',
      type: 'boolean',
      default: true,
    },
    spaces: {
      title: 'Spaces',
      description:
        'Replace all instances of 2 or more whitespace characters with a single whitespace.',
      type: 'boolean',
      default: true,
    },
  },
};

const regNewlinesNeedSpace = /(\S)\r?\n(\S)/g;
const regNewlines = /\r?\n/g;
const regSpaces = /\s{2,}/g;

/**
 * Cleanup attributes values from newlines, trailing and repeating spaces.
 *
 * @author Kir Belevich
 * @type {import('./plugins-types.js').Plugin<'cleanupAttrs'>}
 */
export const fn = (root, params) => {
  const { newlines = true, trim = true, spaces = true } = params;
  return {
    element: {
      enter: (node) => {
        for (const name of Object.keys(node.attributes)) {
          if (newlines) {
            // new line which requires a space instead of themself
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
