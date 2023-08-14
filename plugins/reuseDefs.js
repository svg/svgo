'use strict';

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 * @typedef {import('../lib/types').XastChild} XastChild
 * @typedef {import('../lib/types').XastParent} XastParent
 * @typedef {import('../lib/types').XastNode} XastNode
 */

const { referencesProps } = require('./_collections');
exports.name = 'reuseDefs';
exports.description =
  'Finds <defs> elements with the same def, keep only one ref,' +
  'and replace id references with the new one.';

const regReferencesUrl = /\burl\((["'])?#(.+?)\1\)/;
const regReferencesHref = /^#(.+?)$/;
const regReferencesBegin = /(\D+)\./;

/**
 * Finds <defs> elements with the same def, keep only one ref, and replace id
 * references with the new one.
 *
 * @author Sahel LUCAS--SAOUDI
 *
 * @type {import('./plugins-types').Plugin<'reuseDefs'>}
 */
exports.fn = () => {
  /**
   * @type {Array<XastElement>}
   */
  const defsChildren = [];
  /**
   * @type {Map<string, string>}
   */
  const defsReused = new Map();
  /**
   * @type {Map<string, Array<{element: XastElement, name: string, value: string }>>}
   */
  const referencesById = new Map();
  /**
   * @type {XastElement | null}
   */
  let defsTag = null;

  return {
    element: {
      enter: (node) => {
        if (node.name === 'defs') {
          node.children.forEach((child) => {
            if (child.type === 'element' && child.attributes.id) {
              const sameDef = defsChildren.find((def) => {
                if (def.type !== 'element' || def.name !== child.name) {
                  return false;
                }
                if (
                  JSON.stringify({ ...def.attributes, id: undefined }) ===
                  JSON.stringify({ ...child.attributes, id: undefined })
                ) {
                  return (
                    JSON.stringify(def.children) ===
                    JSON.stringify(child.children)
                  );
                }
                return false;
              });

              if (!sameDef) {
                defsChildren.push(child);
              } else {
                defsReused.set(child.attributes.id, sameDef.attributes.id);
                // delete child
                node.children = node.children.filter((c) => c !== child);
              }
            }
          });
        }

        for (const [name, value] of Object.entries(node.attributes)) {
          // collect all references
          /**
           * @type {null | string}
           */
          let id = null;
          if (referencesProps.includes(name)) {
            const match = value.match(regReferencesUrl);
            if (match != null) {
              id = match[2]; // url() reference
            }
          }
          if (name === 'href' || name.endsWith(':href')) {
            const match = value.match(regReferencesHref);
            if (match != null) {
              id = match[1]; // href reference
            }
          }
          if (name === 'begin') {
            const match = value.match(regReferencesBegin);
            if (match != null) {
              id = match[1]; // href reference
            }
          }
          if (id != null) {
            let refs = referencesById.get(id);
            if (refs == null) {
              refs = [];
              referencesById.set(id, refs);
            }
            refs.push({ element: node, name, value });
          }
        }
      },

      exit: (node, parentNode) => {
        // remove empty defs node
        if (node.name === 'defs' && node !== defsTag && node.children.length === 0) {
          parentNode.children = parentNode.children.filter((c) => c !== node);
        }
      },
    },
    root: {
      exit: () => {
        // Replace references to reused defs
        for (const [id, refs] of referencesById.entries()) {
          const reusedId = defsReused.get(id);
          if (reusedId) {
            for (const ref of refs) {
              if (ref.value.includes('#')) {
                // replace id in href and url()
                ref.element.attributes[ref.name] = ref.value.replace(
                  `#${id}`,
                  `#${reusedId}`
                );
              } else {
                // replace id in begin attribute
                ref.element.attributes[ref.name] = ref.value.replace(
                  `${id}.`,
                  `${reusedId}.`
                );
              }
            }
          }
        }
      },
    },
  };
};
