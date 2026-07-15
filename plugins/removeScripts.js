import { attrsGroups } from './_collections.js';
import { detachNodeFromParent } from '../lib/xast.js';

export const name = 'removeScripts';
export const description = 'removes scripts';

/** Union of all event attributes. */
const eventAttrs = [
  ...attrsGroups.animationEvent,
  ...attrsGroups.documentEvent,
  ...attrsGroups.documentElementEvent,
  ...attrsGroups.globalEvent,
  ...attrsGroups.graphicalEvent,
];

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
 * Remove scripts.
 *
 * https://www.w3.org/TR/SVG11/script.html
 *
 * @author Patrick Klingemann
 * @type {import('../lib/types.js').Plugin}
 */
export const fn = () => {
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
          return;
        }

        for (const attr of eventAttrs) {
          if (node.attributes[attr] != null) {
            delete node.attributes[attr];
          }
        }
      },
      exit: (node, parentNode) => {
        for (const k of Object.keys(node.attributes)) {
          if (!k.startsWith('xmlns:')) {
            continue;
          }

          const prefix = k.slice(6);
          /** @type {string[]} */ (prefixes.get(prefix)).pop();
        }

        if (node.name !== 'a') {
          return;
        }

        for (const attr of Object.keys(node.attributes)) {
          if (attr === 'href' || attr.endsWith(':href')) {
            if (
              node.attributes[attr] == null ||
              !node.attributes[attr]
                .trimStart()
                .toLowerCase()
                .startsWith('javascript:')
            ) {
              continue;
            }

            const index = parentNode.children.indexOf(node);
            const usefulChildren = node.children.filter(
              (child) => child.type !== 'text',
            );
            parentNode.children.splice(index, 1, ...usefulChildren);
          }
        }
      },
    },
  };
};
