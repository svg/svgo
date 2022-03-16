'use strict';

/**
 * @typedef {import('../lib/types').XastParent} XastParent
 * @typedef {import('../lib/types').XastElement} XastElement
 */

exports.name = 'inlineDefs';
exports.type = 'visitor';
exports.active = true;
exports.description = 'inlines svg definitions';

/**
 * @typedef {(element: XastElement, parentNode: XastParent) => void} VisitCallback
 */

/**
 * @type {(element: XastParent, fn: VisitCallback) => void}
 */
const visitElements = (node, fn) => {
  for (const child of node.children) {
    if (child.type === 'element') {
      fn(child, node);
      visitElements(child, fn);
    }
  }
};

/**
 * Replaces use tag with the corresponding definitions
 * if onlyUnique is enabled, replaces only use tags with definitions referred to only once
 *
 * @type {import('../lib/types').Plugin<{
 *   onlyUnique?: boolean
 * }>}
 */
exports.fn = (root, params) => {
  const { onlyUnique = true } = params;
  // hacky extract JSAPI class to avoid imports from other modules
  const JSAPI = root.constructor;

  /**
   * @type {[XastElement, XastParent][]}
   */
  const uses = [];
  /**
   * @type {Map<string, number>}
   */
  const useCounts = new Map();
  /**
   * @type {Map<string, XastElement>}
   */
  const referencedElements = new Map();

  // collect defs container and all uses
  visitElements(root, (node, parentNode) => {
    if (node.name === 'use') {
      uses.push([node, parentNode]);
      const href = node.attributes['xlink:href'] || node.attributes.href;
      const count = useCounts.get(href) || 0;
      useCounts.set(href, count + 1);
    }
  });

  return {
    element: {
      enter: (node, parentNode) => {
        // find elements referenced by all <use>
        if (node.attributes.id == null) {
          return;
        }
        const href = `#${node.attributes.id}`;
        const count = useCounts.get(href);
        // not referenced
        if (count == null) {
          return;
        }
        referencedElements.set(href, node);
        /// remove id attribute when referenced yb <use> more than once
        if (onlyUnique === false && count > 1) {
          delete node.attributes.id;
        }
        // remove elements referenced by <use> only once
        if (onlyUnique === true && count === 1) {
          parentNode.children = parentNode.children.filter(
            (child) => child !== node
          );
        }
      },

      exit(node, parentNode) {
        // remove empty <defs> container
        if (node.name === 'defs') {
          if (onlyUnique === false || node.children.length === 0) {
            parentNode.children = parentNode.children.filter(
              (child) => child !== node
            );
          }
        }
      },
    },

    root: {
      exit: () => {
        for (const [use, useParentNode] of uses) {
          const href = use.attributes['xlink:href'] || use.attributes['href'];
          const count = useCounts.get(href) || 0;
          const referenced = referencedElements.get(href);

          if (onlyUnique === true && count > 1) {
            continue;
          }
          if (referenced == null) {
            continue;
          }

          // copy attrubutes from <use> to referenced element
          for (const [name, value] of Object.entries(use.attributes)) {
            if (
              name !== 'x' &&
              name !== 'y' &&
              name !== 'xlink:href' &&
              name !== 'href'
            ) {
              referenced.attributes[name] = value;
            }
          }

          const x = use.attributes.x;
          const y = use.attributes.y;
          let attrValue = null;
          if (x != null && y != null) {
            attrValue = `translate(${x}, ${y})`;
          } else if (x != null) {
            attrValue = `translate(${x})`;
          }

          let replacement = referenced;
          // wrap referenced element with <g> when <use> had coordinates
          if (attrValue != null) {
            /**
             * @type {XastElement}
             */
            const g = {
              type: 'element',
              name: 'g',
              attributes: {
                transform: attrValue,
              },
              children: [referenced],
            };
            // @ts-ignore
            replacement = new JSAPI(g);
          }
          useParentNode.children = useParentNode.children.map((child) => {
            if (child === use) {
              return replacement;
            } else {
              return child;
            }
          });
        }
      },
    },
  };
};
