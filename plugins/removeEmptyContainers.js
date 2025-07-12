import { elemsGroups } from './_collections.js';
import { detachNodeFromParent } from '../lib/xast.js';
import { collectStylesheet, computeStyle } from '../lib/style.js';

export const name = 'removeEmptyContainers';
export const description = 'removes empty container elements';

/**
 * Remove empty containers.
 *
 * @see https://www.w3.org/TR/SVG11/intro.html#TermContainerElement
 *
 * @example
 * <defs/>
 *
 * @example
 * <g><marker><a/></marker></g>
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = (root) => {
  const stylesheet = collectStylesheet(root);

  return {
    element: {
      exit: (node, parentNode) => {
        // remove only empty non-svg containers
        if (
          node.name === 'svg' ||
          !elemsGroups.container.has(node.name) ||
          node.children.length !== 0
        ) {
          return;
        }
        // empty patterns may contain reusable configuration
        if (
          node.name === 'pattern' &&
          Object.keys(node.attributes).length !== 0
        ) {
          return;
        }

        // empty <mask> hides masked element
        if (node.name === 'mask' && node.attributes.id != null) {
          return;
        }
        if (parentNode.type === 'element' && parentNode.name === 'switch') {
          return;
        }

        // The <g> may not have content, but the filter may cause a rectangle
        // to be created and filled with pattern.
        if (
          node.name === 'g' &&
          (node.attributes.filter != null ||
            computeStyle(stylesheet, node).filter)
        ) {
          return;
        }

        detachNodeFromParent(node, parentNode);
      },
    },
  };
};
