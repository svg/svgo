'use strict';

const { detachNodeFromParent } = require('../lib/xast.js');

exports.name = 'removeScriptElement';
exports.type = 'visitor';
exports.active = false;
exports.description = 'removes <script> elements (disabled by default)';

/** Namespaces that support executable <script> elements. */
const SCRIPT_NAMESPACES = [
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xhtml',
];

/**
 * @param {string} elem
 * @param {string} targetElem
 * @param {ReadonlyMap<string, string[]>} prefixes
 * @param {string[]} targetNamespaces
 * @returns {boolean}
 */
function isNamespaceAwareElem(elem, targetElem, prefixes, targetNamespaces) {
  if (elem === targetElem) {
    return true;
  }

  if (elem.includes(':')) {
    const [prefix, effectiveTag] = elem.split(':', 2);

    if (targetElem === effectiveTag) {
      const namespaces = /** @type {string[]} */ (prefixes.get(prefix));
      const namespace = namespaces[namespaces.length - 1];
      return targetNamespaces.includes(namespace);
    }
  }

  return false;
}

/**
 * Remove <script>.
 *
 * https://www.w3.org/TR/SVG11/script.html
 *
 * @author Patrick Klingemann
 *
 * @type {import('../lib/types').Plugin<void>}
 */
exports.fn = () => {
  /**
   * Map of XML namespace prefixes to the XML namespace. Each value is a stack
   * as XML namespaces can be pushed to in children elements and revert back
   * previous namespace when we exit that node.
   *
   * @type {Map<string, string[]>} */
  const prefixes = new Map();

  return {
    element: {
      enter: (node, parentNode) => {
        for (const [k, v] of Object.entries(node.attributes)) {
          if (!k.startsWith('xmlns:')) {
            continue;
          }

          const prefix = k.slice(6);

          if (!prefixes.has(prefix)) {
            prefixes.set(prefix, [v]);
          } else {
            /** @type {string[]} */ (prefixes.get(prefix)).push(v);
          }
        }

        if (
          isNamespaceAwareElem(node.name, 'script', prefixes, SCRIPT_NAMESPACES)
        ) {
          detachNodeFromParent(node, parentNode);
        }
      },
      exit: (node) => {
        for (const k of Object.keys(node.attributes)) {
          if (!k.startsWith('xmlns:')) {
            continue;
          }

          const prefix = k.slice(6);
          /** @type {string[]} */ (prefixes.get(prefix)).pop();
        }
      },
    },
  };
};
