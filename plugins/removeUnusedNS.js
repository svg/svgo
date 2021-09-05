'use strict';

exports.type = 'visitor';
exports.name = 'removeUnusedNS';
exports.active = true;
exports.description = 'removes unused namespaces declaration';

/**
 * Remove unused namespaces declaration.
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types').Plugin<void>}
 */
exports.fn = () => {
  /**
   * @type {Set<string>}
   */
  const definedNamespaces = new Set();
  return {
    element: {
      enter: (node, parentNode) => {
        // collect namespaces from svg element
        if (node.name === 'svg' && parentNode.type === 'root') {
          for (const name of Object.keys(node.attributes)) {
            if (name.startsWith('xmlns:')) {
              const local = name.slice('xmlns:'.length);
              definedNamespaces.add(local);
            }
          }
        }
        if (definedNamespaces.size !== 0) {
          // remove element namespace from collected list
          if (node.name.includes(':')) {
            const [ns] = node.name.split(':');
            if (definedNamespaces.has(ns)) {
              definedNamespaces.delete(ns);
            }
          }
          // check each attr for the ns-attrs
          for (const name of Object.keys(node.attributes)) {
            if (name.includes(':')) {
              const [ns] = name.split(':');
              definedNamespaces.delete(ns);
            }
          }
        }
      },
      exit: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          // remove svg element ns-attributes if they are not used even once
          for (const name of definedNamespaces) {
            delete node.attributes[`xmlns:${name}`];
          }
        }
      },
    },
  };
};
