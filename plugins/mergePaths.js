import { collectStylesheet, computeStyle } from '../lib/style.js';
import { intersects, js2path, path2js } from './_path.js';
import { includesUrlReference } from '../lib/svgo/tools.js';

/**
 * @typedef MergePathsParams
 * @property {boolean=} force
 * @property {number=} floatPrecision
 * @property {boolean=} noSpaceAfterFlags
 */

export const name = 'mergePaths';
export const description = 'merges multiple paths in one if possible';

/**
 * @param {import('../lib/types.js').ComputedStyles} computedStyle
 * @param {string} attName
 * @returns {boolean}
 */
function elementHasUrl(computedStyle, attName) {
  const style = computedStyle[attName];

  if (style?.type === 'static') {
    return includesUrlReference(style.value);
  }

  return false;
}

/**
 * Merge multiple Paths into one.
 *
 * @author Kir Belevich, Lev Solntsev
 *
 * @type {import('../lib/types.js').Plugin<MergePathsParams>}
 */
export const fn = (root, params) => {
  const {
    force = false,
    floatPrecision = 3,
    noSpaceAfterFlags = false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
  } = params;
  const stylesheet = collectStylesheet(root);

  return {
    element: {
      enter: (node) => {
        if (node.children.length <= 1) {
          return;
        }

        /** @type {import('../lib/types.js').XastChild[]} */
        const elementsToRemove = [];
        let prevChild = node.children[0];
        let prevPathData = null;

        /**
         * @param {import('../lib/types.js').XastElement} child
         * @param {ReadonlyArray<import("../lib/types.js").PathDataItem>} pathData
         */
        const updatePreviousPath = (child, pathData) => {
          js2path(child, pathData, {
            floatPrecision,
            noSpaceAfterFlags,
          });
          prevPathData = null;
        };

        for (let i = 1; i < node.children.length; i++) {
          const child = node.children[i];

          if (
            prevChild.type !== 'element' ||
            prevChild.name !== 'path' ||
            prevChild.children.length !== 0 ||
            prevChild.attributes.d == null
          ) {
            if (prevPathData && prevChild.type === 'element') {
              updatePreviousPath(prevChild, prevPathData);
            }
            prevChild = child;
            continue;
          }

          if (
            child.type !== 'element' ||
            child.name !== 'path' ||
            child.children.length !== 0 ||
            child.attributes.d == null
          ) {
            if (prevPathData) {
              updatePreviousPath(prevChild, prevPathData);
            }
            prevChild = child;
            continue;
          }

          const computedStyle = computeStyle(stylesheet, child);
          if (
            computedStyle['marker-start'] ||
            computedStyle['marker-mid'] ||
            computedStyle['marker-end'] ||
            computedStyle['clip-path'] ||
            computedStyle['mask'] ||
            computedStyle['mask-image'] ||
            ['fill', 'filter', 'stroke'].some((attName) =>
              elementHasUrl(computedStyle, attName),
            )
          ) {
            if (prevPathData) {
              updatePreviousPath(prevChild, prevPathData);
            }
            prevChild = child;
            continue;
          }
          const childAttrs = Object.keys(child.attributes);
          if (childAttrs.length !== Object.keys(prevChild.attributes).length) {
            if (prevPathData) {
              updatePreviousPath(prevChild, prevPathData);
            }
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
            if (prevPathData) {
              updatePreviousPath(prevChild, prevPathData);
            }
            prevChild = child;
            continue;
          }

          const hasPrevPath = prevPathData != null;
          const currentPathData = path2js(child);
          prevPathData = prevPathData ?? path2js(prevChild);

          if (force || !intersects(prevPathData, currentPathData)) {
            prevPathData.push(...currentPathData);
            elementsToRemove.push(child);
            continue;
          }

          if (hasPrevPath) {
            updatePreviousPath(prevChild, prevPathData);
          }

          prevChild = child;
          prevPathData = null;
        }

        if (prevPathData && prevChild.type === 'element') {
          updatePreviousPath(prevChild, prevPathData);
        }

        node.children = node.children.filter(
          (child) => !elementsToRemove.includes(child),
        );
      },
    },
  };
};
