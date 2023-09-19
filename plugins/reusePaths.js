'use strict';

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 * @typedef {import('../lib/types').XastParent} XastParent
 * @typedef {import('../lib/types').XastNode} XastNode
 */

exports.name = 'reusePaths';
exports.description =
  'Finds <path> elements with the same d, fill, and ' +
  'stroke, and converts them to <use> elements ' +
  'referencing a single <path> def.';

/**
 * Finds <path> elements with the same d, fill, and stroke, and converts them to
 * <use> elements referencing a single <path> def.
 *
 * @author Jacob Howcroft
 *
 * @type {import('./plugins-types').Plugin<'reusePaths'>}
 */
exports.fn = () => {
  /**
   * @type {Map<string, Array<XastElement>>}
   */
  const paths = new Map();

  /**
   * Reference to the first defs element that is a direct child of the svg
   * element if one exists.
   *
   * @type {XastElement}
   * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs
   */
  let svgDefs;

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'path' && node.attributes.d != null) {
          const d = node.attributes.d;
          const fill = node.attributes.fill || '';
          const stroke = node.attributes.stroke || '';
          const key = d + ';s:' + stroke + ';f:' + fill;
          let list = paths.get(key);
          if (list == null) {
            list = [];
            paths.set(key, list);
          }
          list.push(node);
        }

        if (
          svgDefs == null &&
          node.name === 'defs' &&
          parentNode.type === 'element' &&
          parentNode.name === 'svg'
        ) {
          svgDefs = node;
        }
      },

      exit: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          /**
           * @type {XastElement}
           */
          let defsTag = svgDefs;

          if (defsTag == null) {
            defsTag = {
              type: 'element',
              name: 'defs',
              attributes: {},
              children: [],
            };
            // TODO remove legacy parentNode in v4
            Object.defineProperty(defsTag, 'parentNode', {
              writable: true,
              value: node,
            });
          }

          let index = 0;
          for (const list of paths.values()) {
            if (list.length > 1) {
              // add reusable path to defs
              /**
               * @type {XastElement}
               */
              const reusablePath = {
                type: 'element',
                name: 'path',
                attributes: { ...list[0].attributes },
                children: [],
              };
              delete reusablePath.attributes.transform;
              let id;
              if (reusablePath.attributes.id == null) {
                id = 'reuse-' + index;
                index += 1;
                reusablePath.attributes.id = id;
              } else {
                id = reusablePath.attributes.id;
                delete list[0].attributes.id;
              }
              // TODO remove legacy parentNode in v4
              Object.defineProperty(reusablePath, 'parentNode', {
                writable: true,
                value: defsTag,
              });
              defsTag.children.push(reusablePath);
              // convert paths to <use>
              for (const pathNode of list) {
                pathNode.name = 'use';
                pathNode.attributes['xlink:href'] = '#' + id;
                delete pathNode.attributes.d;
                delete pathNode.attributes.stroke;
                delete pathNode.attributes.fill;
              }
            }
          }
          if (defsTag.children.length !== 0) {
            if (node.attributes['xmlns:xlink'] == null) {
              node.attributes['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
            }

            if (svgDefs == null) {
              node.children.unshift(defsTag);
            }
          }
        }
      },
    },
  };
};
