import { editorNamespaces } from './_collections.js';
import { detachNodeFromParent } from '../lib/xast.js';

/**
 * @typedef {import('json-schema-typed').JSONSchema} JSONSchema
 */

export const name = 'removeEditorsNSData';
export const description =
  'removes editors namespaces, elements and attributes';

/** @type {JSONSchema} */
export const schema = {
  type: 'object',
  properties: {
    additionalNamespaces: {
      title: 'Additional Namespaces',
      description:
        'If you want to remove additional XML namespaces, you can provide them in a list.',
      type: 'array',
      items: {
        type: 'string',
      },
      default: [],
    },
  },
};

/**
 * Remove editors namespaces, elements and attributes.
 *
 * @example
 * <svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">
 * <sodipodi:namedview/>
 * <path sodipodi:nodetypes="cccc"/>
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types.js').Plugin<'removeEditorsNSData'>}
 */
export const fn = (_root, params) => {
  let namespaces = [...editorNamespaces];
  if (Array.isArray(params.additionalNamespaces)) {
    namespaces = [...editorNamespaces, ...params.additionalNamespaces];
  }
  /**
   * @type {string[]}
   */
  const prefixes = [];
  return {
    element: {
      enter: (node, parentNode) => {
        // collect namespace prefixes from svg element
        if (node.name === 'svg') {
          for (const [name, value] of Object.entries(node.attributes)) {
            if (name.startsWith('xmlns:') && namespaces.includes(value)) {
              prefixes.push(name.slice('xmlns:'.length));
              // <svg xmlns:sodipodi="">
              delete node.attributes[name];
            }
          }
        }
        // remove editor attributes, for example
        // <* sodipodi:*="">
        for (const name of Object.keys(node.attributes)) {
          if (name.includes(':')) {
            const [prefix] = name.split(':');
            if (prefixes.includes(prefix)) {
              delete node.attributes[name];
            }
          }
        }
        // remove editor elements, for example
        // <sodipodi:*>
        if (node.name.includes(':')) {
          const [prefix] = node.name.split(':');
          if (prefixes.includes(prefix)) {
            detachNodeFromParent(node, parentNode);
          }
        }
      },
    },
  };
};
