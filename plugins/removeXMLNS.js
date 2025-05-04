export const name = 'removeXMLNS';
export const description =
  'removes xmlns attribute (for inline svg, disabled by default)';

/**
 * Remove the xmlns attribute when present.
 *
 * @example
 * <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
 *   ↓
 * <svg viewBox="0 0 100 50">
 *
 * @author Ricardo Tomasi
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'svg') {
          delete node.attributes.xmlns;
        }
      },
    },
  };
};
