'use strict';

exports.type = 'visitor';
exports.name = 'removeXMLNS';
exports.active = false;
exports.description =
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
 * @type {import('../lib/types').Plugin<void>}
 */
exports.fn = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'svg') {
          delete node.attributes.xmlns;
          delete node.attributes['xmlns:xlink'];
        }
      },
    },
  };
};
