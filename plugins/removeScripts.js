import { attrsGroups } from './_collections.js';
import { isExecutableUrl } from '../lib/svgo/tools.js';
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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Namespaces that support SVG <foreignObject> elements. */
const FOREIGN_OBJECT_NAMESPACES = [SVG_NAMESPACE];

/** Namespaces that support SVG <a> elements. */
const ANCHOR_NAMESPACES = [SVG_NAMESPACE];

/** Namespaces that support executable <script> elements. */
const SCRIPT_NAMESPACES = [SVG_NAMESPACE, 'http://www.w3.org/1999/xhtml'];

/** Attributes that can load or navigate to executable documents in HTML. */
const HTML_URL_ATTRS = new Set(['action', 'data', 'formaction', 'href', 'src']);

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
 * @since 1.0.0
 */
export const fn = () => {
  /**
   * Map of XML namespace prefixes to the XML namespace. Each value is a stack
   * as XML namespaces can be pushed to in children elements and revert back
   * previous namespace when we exit that node.
   *
   * @type {Map<string, string[]>} */
  const prefixes = new Map();
  let foreignObjectDepth = 0;

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
          isNamespaceAwareElem(
            node.name,
            'foreignObject',
            prefixes,
            FOREIGN_OBJECT_NAMESPACES,
          )
        ) {
          foreignObjectDepth += 1;
        }

        if (
          isNamespaceAwareElem(node.name, 'script', prefixes, SCRIPT_NAMESPACES)
        ) {
          detachNodeFromParent(node, parentNode);
          return;
        }

        for (const [attr, value] of Object.entries(node.attributes)) {
          const localAttr = attr.slice(attr.lastIndexOf(':') + 1).toLowerCase();
          const isEventAttr =
            eventAttrs.includes(attr) ||
            (foreignObjectDepth > 0 && localAttr.startsWith('on'));
          const isEmbeddedDocumentAttr =
            foreignObjectDepth > 0 && localAttr === 'srcdoc';
          const isExecutableHtmlUrl =
            foreignObjectDepth > 0 &&
            HTML_URL_ATTRS.has(localAttr) &&
            isExecutableUrl(value);

          if (isEventAttr || isEmbeddedDocumentAttr || isExecutableHtmlUrl) {
            delete node.attributes[attr];
          }
        }
      },
      exit: (node, parentNode) => {
        const isForeignObject = isNamespaceAwareElem(
          node.name,
          'foreignObject',
          prefixes,
          FOREIGN_OBJECT_NAMESPACES,
        );
        const isAnchor = isNamespaceAwareElem(
          node.name,
          'a',
          prefixes,
          ANCHOR_NAMESPACES,
        );

        for (const k of Object.keys(node.attributes)) {
          if (!k.startsWith('xmlns:')) {
            continue;
          }

          const prefix = k.slice(6);
          /** @type {string[]} */ (prefixes.get(prefix)).pop();
        }

        if (isAnchor) {
          for (const attr of Object.keys(node.attributes)) {
            if (attr === 'href' || attr.endsWith(':href')) {
              if (
                node.attributes[attr] == null ||
                !isExecutableUrl(node.attributes[attr])
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
        }

        if (isForeignObject) {
          foreignObjectDepth -= 1;
        }
      },
    },
  };
};
