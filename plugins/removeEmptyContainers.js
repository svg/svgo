import { elemsGroups } from './_collections.js';
import { detachNodeFromParent } from '../lib/xast.js';
import { collectStylesheet, computeStyle } from '../lib/style.js';
import { findReferences } from '../lib/svgo/tools.js';

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
  const removedIds = new Set();
  /**
   * @type {Map<string, {
   *   node: import('../lib/types.js').XastElement,
   *   parent: import('../lib/types.js').XastParent,
   * }[]>}
   */
  const usesById = new Map();

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'use') {
          // Record uses so those referencing empty containers can be removed.
          for (const [name, value] of Object.entries(node.attributes)) {
            const ids = findReferences(name, value);
            for (const id of ids) {
              let references = usesById.get(id);
              if (references === undefined) {
                references = [];
                usesById.set(id, references);
              }
              references.push({ node: node, parent: parentNode });
            }
          }
        }
      },
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
        if (node.attributes.id) {
          removedIds.add(node.attributes.id);
        }
      },
    },
    root: {
      exit: () => {
        // Remove any <use> elements that referenced an empty container.
        for (const id of removedIds) {
          const uses = usesById.get(id);
          if (uses) {
            for (const use of uses) {
              detachNodeFromParent(use.node, use.parent);
            }
          }
        }
      },
    },
  };
};
