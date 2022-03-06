'use strict';

exports.type = 'visitor';
exports.name = 'removeXMLSpace';
exports.active = false;
exports.description =
  'removes xml:space attribute (for inline svg, disabled by default)';

/**
 * Remove the xml:space attribute when present.
 *
 * @example
 * <svg viewBox="0 0 100 50" xml:space="default">
 *   ↓
 * <svg viewBox="0 0 100 50">
 *
 * @author Ingyu Tae
 *
 * @type {import('../lib/types').Plugin<void>}
 */
exports.fn = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'svg') {
          delete node.attributes.xmlSpace;
          delete node.attributes['xml:space'];
        }
      },
    },
  };
};
