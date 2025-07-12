import * as csswhat from 'css-what';
import { attrsGroupsDeprecated, elems } from './_collections.js';
import { collectStylesheet } from '../lib/style.js';

/**
 * @typedef RemoveDeprecatedAttrsParams
 * @property {boolean=} removeUnsafe
 */

export const name = 'removeDeprecatedAttrs';
export const description = 'removes deprecated attributes';

/**
 * @param {import('../lib/types.js').Stylesheet} stylesheet
 * @returns {Set<string>}
 */
function extractAttributesInStylesheet(stylesheet) {
  const attributesInStylesheet = new Set();

  stylesheet.rules.forEach((rule) => {
    const selectors = csswhat.parse(rule.selector);
    selectors.forEach((subselector) => {
      subselector.forEach((segment) => {
        if (segment.type !== 'attribute') {
          return;
        }

        attributesInStylesheet.add(segment.name);
      });
    });
  });

  return attributesInStylesheet;
}

/**
 * @param {import('../lib/types.js').XastElement} node
 * @param {{ safe?: Set<string>; unsafe?: Set<string> }|undefined} deprecatedAttrs
 * @param {import('../lib/types.js').DefaultPlugins['removeDeprecatedAttrs']} params
 * @param {Set<string>} attributesInStylesheet
 */
function processAttributes(
  node,
  deprecatedAttrs,
  params,
  attributesInStylesheet,
) {
  if (!deprecatedAttrs) {
    return;
  }

  if (deprecatedAttrs.safe) {
    deprecatedAttrs.safe.forEach((name) => {
      if (attributesInStylesheet.has(name)) {
        return;
      }
      delete node.attributes[name];
    });
  }

  if (params.removeUnsafe && deprecatedAttrs.unsafe) {
    deprecatedAttrs.unsafe.forEach((name) => {
      if (attributesInStylesheet.has(name)) {
        return;
      }
      delete node.attributes[name];
    });
  }
}

/**
 * Remove deprecated attributes.
 *
 * @type {import('../lib/types.js').Plugin<RemoveDeprecatedAttrsParams>}
 */
export function fn(root, params) {
  const stylesheet = collectStylesheet(root);
  const attributesInStylesheet = extractAttributesInStylesheet(stylesheet);

  return {
    element: {
      enter: (node) => {
        const elemConfig = elems[node.name];
        if (!elemConfig) {
          return;
        }

        // Special cases

        // Removing deprecated xml:lang is safe when the lang attribute exists.
        if (
          elemConfig.attrsGroups.has('core') &&
          node.attributes['xml:lang'] &&
          !attributesInStylesheet.has('xml:lang') &&
          node.attributes['lang']
        ) {
          delete node.attributes['xml:lang'];
        }

        // General cases

        elemConfig.attrsGroups.forEach((attrsGroup) => {
          processAttributes(
            node,
            attrsGroupsDeprecated[attrsGroup],
            params,
            attributesInStylesheet,
          );
        });

        processAttributes(
          node,
          elemConfig.deprecated,
          params,
          attributesInStylesheet,
        );
      },
    },
  };
}
