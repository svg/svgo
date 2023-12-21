'use strict';

const { visit } = require('../lib/xast.js');
const { inheritableAttrs, pathElems } = require('./_collections.js');

exports.name = 'moveElemsAttrsToGroup';
exports.description = 'Move common attributes of group children to the group';

/**
 * Move common attributes of group children to the group
 *
 * @example
 * <g attr1="val1">
 *     <g attr2="val2">
 *         text
 *     </g>
 *     <circle attr2="val2" attr3="val3"/>
 * </g>
 *              ⬇
 * <g attr1="val1" attr2="val2">
 *     <g>
 *         text
 *     </g>
 *    <circle attr3="val3"/>
 * </g>
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'moveElemsAttrsToGroup'>}
 */
exports.fn = (root) => {
  // find if any style element is present
  let deoptimizedWithStyles = false;
  visit(root, {
    element: {
      enter: (node) => {
        if (node.name === 'style') {
          deoptimizedWithStyles = true;
        }
      },
    },
  });

  return {
    element: {
      exit: (node) => {
        // deoptimize the plugin when style elements are present
        // selectors may rely on id, classes or tag names
        if (deoptimizedWithStyles) {
          return;
        }

        const children = node.children.filter(
          /**
           * @type {(c: import('../lib/types.js').XastChild) => c is import('../lib/types.js').XastElement}
           */ (c) => c.type === 'element',
        );

        // process only groups with more than 1 children
        if (node.name !== 'g' || children.length <= 1) {
          if (
            children.length > 0 &&
            (node.name === 'g' || node.name === 'svg')
          ) {
            // remove attributes that all children override
            for (const a of Object.keys(node.attributes)) {
              if (!inheritableAttrs.includes(a)) continue;
              if (a === 'transform') continue;
              const isOverriden = children.every(
                (child) =>
                  child.attributes[a] && child.attributes[a] !== 'inherit',
              );
              if (isOverriden) {
                delete node.attributes[a];
              }
            }
          }
          return;
        }

        /**
         * attributes in group children
         * @type {Map<string, string[]>}
         */
        const attributes = new Map();
        let everyChildIsPath = true;
        for (const child of children) {
          if (pathElems.includes(child.name) === false) {
            everyChildIsPath = false;
          }
          // collect all inheritable attributes from first child element
          for (const [name, value] of Object.entries(child.attributes)) {
            // consider only inheritable attributes
            if (!inheritableAttrs.includes(name)) continue;

            let list = attributes.get(name);
            if (!list) {
              list = [];
              attributes.set(name, list);
            }
            list.push(value);
          }
        }

        // preserve transform on children when group has clip-path or mask
        if (
          node.attributes['clip-path'] != null ||
          node.attributes.mask != null
        ) {
          attributes.delete('transform');
        }

        // preserve transform when all children are paths
        // so the transform could be applied to path data by other plugins
        if (everyChildIsPath) {
          attributes.delete('transform');
        }

        // add common children attributes to group
        for (const [name, values] of attributes) {
          if (values.includes('inherit')) continue;

          if (name === 'transform') {
            const value = values[0];
            if (values.length != children.length) continue;
            if (values.some((v) => v !== value)) continue;
            if (node.attributes.transform != null) {
              node.attributes.transform = `${node.attributes.transform} ${value}`;
            } else {
              node.attributes.transform = value;
            }
            for (const child of children) {
              delete child.attributes.transform;
            }
            continue;
          }
          if (
            (name === 'fill' || name === 'stroke') &&
            values.some((v) => v.includes('url'))
          )
            continue;

          const unsetValues = children.length - values.length;
          const defaultV = node.attributes[name];
          const assignmentCost = name.length + 4;
          if (unsetValues && !defaultV) continue;

          /**
           * @type {Map<string, {chars: number, count: number}>}
           */
          const counts = new Map();
          values.forEach((v) => {
            let count = counts.get(v);
            if (!count) {
              count = {
                chars: 0,
                count: 0,
              };
              counts.set(v, count);
            }
            count.chars += v.length + assignmentCost;
            count.count++;
          });
          if (unsetValues) {
            let count = counts.get(defaultV);
            if (!count) {
              count = {
                chars: 0,
                count: 0,
              };
              counts.set(defaultV, count);
            }
            count.chars += unsetValues * (defaultV.length + assignmentCost);
            count.count += unsetValues;
          }

          const [preferred, preferredInfo] = Array.from(
            counts.entries(),
          ).reduce((a, b) => (a[1].chars > b[1].chars ? a : b));
          if (preferredInfo.count === 1) {
            children.forEach(
              (c) =>
                (c.attributes[name] =
                  c.attributes[name] || defaultV || preferred),
            );
            delete node.attributes[name];
            continue;
          }
          if (preferred === defaultV) continue;

          children.forEach((c) => {
            if (!c.attributes[name]) {
              c.attributes[name] = defaultV;
            }
            if (c.attributes[name] === preferred) {
              delete c.attributes[name];
            }
          });
          node.attributes[name] = preferred;
        }
      },
    },
  };
};
