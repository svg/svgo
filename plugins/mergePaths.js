'use strict';

/**
 * @typedef {import('../lib/types').XastChild} XastChild
 */

const { collectStylesheet, computeStyle } = require('../lib/style.js');
const { path2js, js2path, intersects } = require('./_path.js');

exports.name = 'mergePaths';
exports.description = 'merges multiple paths in one if possible';

/**
 * Merge multiple Paths into one.
 *
 * @author Kir Belevich, Lev Solntsev
 *
 * @type {import('./plugins-types').Plugin<'mergePaths'>}
 */
exports.fn = (root, params) => {
  const {
    force = false,
    floatPrecision,
    noSpaceAfterFlags = false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
  } = params;
  const stylesheet = collectStylesheet(root);

  return {
    element: {
      enter: (node) => {
        if (node.children.length <= 1) {
          return;
        }

        /** @type {XastChild[]} */
        const elementsToRemove = [];
        let prevChild = node.children[0];

        for (let i = 1; i < node.children.length; i++) {
          const child = node.children[i];

          if (
            prevChild.type !== 'element' ||
            prevChild.name !== 'path' ||
            prevChild.children.length !== 0 ||
            prevChild.attributes.d == null
          ) {
            prevChild = child;
            continue;
          }

          if (
            child.type !== 'element' ||
            child.name !== 'path' ||
            child.children.length !== 0 ||
            child.attributes.d == null
          ) {
            prevChild = child;
            continue;
          }

          const computedStyle = computeStyle(stylesheet, child);
          if (
            computedStyle['marker-start'] ||
            computedStyle['marker-mid'] ||
            computedStyle['marker-end']
          ) {
            prevChild = child;
            continue;
          }

          const childAttrs = Object.keys(child.attributes);
          if (childAttrs.length !== Object.keys(prevChild.attributes).length) {
            prevChild = child;
            continue;
          }

          const areAttrsEqual = childAttrs.some((attr) => {
            return (
              attr !== 'd' &&
              prevChild.type === 'element' &&
              prevChild.attributes[attr] !== child.attributes[attr]
            );
          });

          if (areAttrsEqual) {
            prevChild = child;
            continue;
          }

          const prevPathJS = path2js(prevChild);
          const curPathJS = path2js(child);

          if (force || !intersects(prevPathJS, curPathJS)) {
            prevPathJS.push(...curPathJS);
            js2path(prevChild, prevPathJS, {
              floatPrecision,
              noSpaceAfterFlags,
            });

            elementsToRemove.push(child);
            continue;
          }

          prevChild = child;
        }

        node.children = node.children.filter(
          (child) => !elementsToRemove.includes(child),
        );
      },
    },
  };
};
