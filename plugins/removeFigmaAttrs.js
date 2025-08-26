export const name = 'removeFigmaAttrs';
export const description = 'removes figma data attributes';

/**
 * Remove attributes data-figma-skip-parse
 *
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        for (const name of Object.keys(node.attributes)) {
          if (
            name === 'data-figma-skip-parse'
          ) {
            delete node.attributes[name];
          }
        }
      },
    },
  };
};
