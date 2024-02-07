import { computeStyle, collectStylesheet } from '../lib/style.js';
import { inheritableAttrs, elemsGroups } from './_collections.js';

/**
 * @typedef {import('../lib/types.js').XastElement} XastElement
 * @typedef {import('../lib/types.js').XastNode} XastNode
 */

export const name = 'collapseGroups';
export const description = 'collapses useless groups';

/**
 * @type {(node: XastNode, name: string) => boolean}
 */
const hasAnimatedAttr = (node, name) => {
  if (node.type === 'element') {
    if (
      elemsGroups.animation.has(node.name) &&
      node.attributes.attributeName === name
    ) {
      return true;
    }
    for (const child of node.children) {
      if (hasAnimatedAttr(child, name)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Collapse useless groups.
 *
 * @example
 * <g>
 *     <g attr1="val1">
 *         <path d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <g>
 *     <g>
 *         <path attr1="val1" d="..."/>
 *     </g>
 * </g>
 *         ⬇
 * <path attr1="val1" d="..."/>
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'collapseGroups'>}
 */
export const fn = (root) => {
  const stylesheet = collectStylesheet(root);

  return {
    element: {
      exit: (node, parentNode) => {
        if (parentNode.type === 'root' || parentNode.name === 'switch') {
          return;
        }
        // non-empty groups
        if (node.name !== 'g' || node.children.length === 0) {
          return;
        }

        // move group attributes to the single child element
        if (
          Object.keys(node.attributes).length !== 0 &&
          node.children.length === 1
        ) {
          const firstChild = node.children[0];
          const nodeHasFilter = !!(
            node.attributes.filter || computeStyle(stylesheet, node).filter
          );
          // TODO untangle this mess
          if (
            firstChild.type === 'element' &&
            firstChild.attributes.id == null &&
            !nodeHasFilter &&
            (node.attributes.class == null ||
              firstChild.attributes.class == null) &&
            ((node.attributes['clip-path'] == null &&
              node.attributes.mask == null) ||
              (firstChild.name === 'g' &&
                node.attributes.transform == null &&
                firstChild.attributes.transform == null))
          ) {
            const newChildElemAttrs = { ...firstChild.attributes };

            for (const [name, value] of Object.entries(node.attributes)) {
              // avoid copying to not conflict with animated attribute
              if (hasAnimatedAttr(firstChild, name)) {
                return;
              }

              if (newChildElemAttrs[name] == null) {
                newChildElemAttrs[name] = value;
              } else if (name === 'transform') {
                newChildElemAttrs[name] = value + ' ' + newChildElemAttrs[name];
              } else if (newChildElemAttrs[name] === 'inherit') {
                newChildElemAttrs[name] = value;
              } else if (
                !inheritableAttrs.has(name) &&
                newChildElemAttrs[name] !== value
              ) {
                return;
              }
            }

            node.attributes = {};
            firstChild.attributes = newChildElemAttrs;
          }
        }

        // collapse groups without attributes
        if (Object.keys(node.attributes).length === 0) {
          // animation elements "add" attributes to group
          // group should be preserved
          for (const child of node.children) {
            if (
              child.type === 'element' &&
              elemsGroups.animation.has(child.name)
            ) {
              return;
            }
          }
          // replace current node with all its children
          const index = parentNode.children.indexOf(node);
          parentNode.children.splice(index, 1, ...node.children);
          // TODO remove legacy parentNode in v4
          for (const child of node.children) {
            Object.defineProperty(child, 'parentNode', {
              writable: true,
              value: parentNode,
            });
          }
        }
      },
    },
  };
};
