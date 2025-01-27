export const name = 'cleanupTitle';
export const description = 'trims the text contents of <title> elements';

/**
 * Trims the text contents of <title> elements.
 *
 * @type {import('./plugins-types.js').Plugin<'cleanupTitle'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'title') {
          node.children = node.children.map((child) => {
            if (child.type === 'text') {
              child.value = child.value.trim();
            }
            return child;
          });
        }
      },
    },
  };
};
