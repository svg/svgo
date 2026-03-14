import * as csso from 'csso';
import { detachNodeFromParent } from '../lib/xast.js';
import { hasScripts } from '../lib/svgo/tools.js';

/**
 * @typedef Usage
 * @property {boolean=} force
 * @property {boolean=} ids
 * @property {boolean=} classes
 * @property {boolean=} tags
 *
 * @typedef MinifyStylesParams
 * @property {boolean=} restructure Disable or enable a structure optimizations.
 * @property {boolean=} forceMediaMerge
 *   Enables merging of `@media` rules with the same media query split by other
 *   rules. Unsafe in general, but should work fine in most cases. Use it on
 *   your own risk.
 * @property {'exclamation' | 'first-exclamation' | boolean=} comments
 *   Specify what comments to leave:
 *   - `'exclamation'` or `true` — leave all exclamation comments
 *   - `'first-exclamation'` — remove every comment except first one
 *   - `false` — remove all comments
 * @property {boolean | Usage=} usage Advanced optimizations.
 */

export const name = 'minifyStyles';
export const description = 'minifies styles and removes unused styles';

/**
 * Minifies styles (<style> element + style attribute) using CSSO.
 *
 * @author strarsis <strarsis@gmail.com>
 * @type {import('../lib/types.js').Plugin<MinifyStylesParams>}
 */
export const fn = (_root, { usage, ...params }) => {
  /** @type {Map<import('../lib/types.js').XastElement, import('../lib/types.js').XastParent>} */
  const styleElements = new Map();

  /** @type {import('../lib/types.js').XastElement[]} */
  const elementsWithStyleAttributes = [];

  /** @type {Set<string>} */
  const tagsUsage = new Set();

  /** @type {Set<string>} */
  const idsUsage = new Set();

  /** @type {Set<string>} */
  const classesUsage = new Set();

  let enableTagsUsage = true;
  let enableIdsUsage = true;
  let enableClassesUsage = true;

  /**
   * Force to use usage data even if it unsafe. For example, the document
   * contains scripts or in attributes.
   */
  let forceUsageDeoptimized = false;

  if (typeof usage === 'boolean') {
    enableTagsUsage = usage;
    enableIdsUsage = usage;
    enableClassesUsage = usage;
  } else if (usage) {
    enableTagsUsage = usage.tags == null ? true : usage.tags;
    enableIdsUsage = usage.ids == null ? true : usage.ids;
    enableClassesUsage = usage.classes == null ? true : usage.classes;
    forceUsageDeoptimized = usage.force == null ? false : usage.force;
  }

  let deoptimized = false;

  return {
    element: {
      enter: (node, parentNode) => {
        // detect deoptimizations
        if (hasScripts(node)) {
          deoptimized = true;
        }

        // collect tags, ids and classes usage
        tagsUsage.add(node.name);
        if (node.attributes.id != null) {
          idsUsage.add(node.attributes.id);
        }
        if (node.attributes.class != null) {
          for (const className of node.attributes.class.split(/\s+/)) {
            classesUsage.add(className);
          }
        }
        // collect style elements or elements with style attribute
        if (node.name === 'style' && node.children.length !== 0) {
          styleElements.set(node, parentNode);
        } else if (node.attributes.style != null) {
          elementsWithStyleAttributes.push(node);
        }
      },
    },

    root: {
      exit: () => {
        /** @type {csso.Usage} */
        const cssoUsage = {};
        if (!deoptimized || forceUsageDeoptimized) {
          if (enableTagsUsage) {
            cssoUsage.tags = Array.from(tagsUsage);
          }
          if (enableIdsUsage) {
            cssoUsage.ids = Array.from(idsUsage);
          }
          if (enableClassesUsage) {
            cssoUsage.classes = Array.from(classesUsage);
          }
        }
        // minify style elements
        for (const [styleNode, styleNodeParent] of styleElements.entries()) {
          if (
            styleNode.children[0].type === 'text' ||
            styleNode.children[0].type === 'cdata'
          ) {
            const cssText = styleNode.children[0].value;
            const minified = csso.minify(cssText, {
              ...params,
              usage: cssoUsage,
            }).css;

            if (minified.length === 0) {
              detachNodeFromParent(styleNode, styleNodeParent);
              continue;
            }

            // preserve cdata if necessary
            // TODO split cdata -> text optimization into separate plugin
            if (cssText.indexOf('>') >= 0 || cssText.indexOf('<') >= 0) {
              styleNode.children[0].type = 'cdata';
              styleNode.children[0].value = minified;
            } else {
              styleNode.children[0].type = 'text';
              styleNode.children[0].value = minified;
            }
          }
        }
        // minify style attributes
        for (const node of elementsWithStyleAttributes) {
          // style attribute
          const elemStyle = node.attributes.style;
          node.attributes.style = csso.minifyBlock(elemStyle, {
            ...params,
          }).css;
        }
      },
    },
  };
};
