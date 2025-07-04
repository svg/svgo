import {
  attrsGroups,
  attrsGroupsDefaults,
  elems,
  elemsGroups,
  presentationNonInheritableGroupAttrs,
} from './_collections.js';
import { detachNodeFromParent } from '../lib/xast.js';
import { visitSkip } from '../lib/util/visit.js';
import {
  collectStylesheet,
  computeStyle,
  includesAttrSelector,
} from '../lib/style.js';

/**
 * @typedef RemoveUnknownsAndDefaultsParams
 * @property {boolean=} unknownContent
 * @property {boolean=} unknownAttrs
 * @property {boolean=} defaultAttrs
 * @property {boolean=} defaultMarkupDeclarations
 *   If to remove XML declarations that are assigned their default value. XML
 *   declarations are the properties in the `<?xml … ?>` block at the top of the
 *   document.
 * @property {boolean=} uselessOverrides
 * @property {boolean=} keepDataAttrs
 * @property {boolean=} keepAriaAttrs
 * @property {boolean=} keepRoleAttr
 */

export const name = 'removeUnknownsAndDefaults';
export const description =
  'removes unknown elements content and attributes, removes attrs with default values';

// resolve all groups references

/** @type {Map<string, Set<string>>} */
const allowedChildrenPerElement = new Map();
/** @type {Map<string, Set<string>>} */
const allowedAttributesPerElement = new Map();
/** @type {Map<string, Map<string, string>>} */
const attributesDefaultsPerElement = new Map();

for (const [name, config] of Object.entries(elems)) {
  /** @type {Set<string>} */
  const allowedChildren = new Set();
  if (config.content) {
    for (const elementName of config.content) {
      allowedChildren.add(elementName);
    }
  }
  if (config.contentGroups) {
    for (const contentGroupName of config.contentGroups) {
      const elemsGroup = elemsGroups[contentGroupName];
      if (elemsGroup) {
        for (const elementName of elemsGroup) {
          allowedChildren.add(elementName);
        }
      }
    }
  }
  /** @type {Set<string>} */
  const allowedAttributes = new Set();
  if (config.attrs) {
    for (const attrName of config.attrs) {
      allowedAttributes.add(attrName);
    }
  }
  /** @type {Map<string, string>} */
  const attributesDefaults = new Map();
  if (config.defaults) {
    for (const [attrName, defaultValue] of Object.entries(config.defaults)) {
      attributesDefaults.set(attrName, defaultValue);
    }
  }
  for (const attrsGroupName of config.attrsGroups) {
    const attrsGroup = attrsGroups[attrsGroupName];
    if (attrsGroup) {
      for (const attrName of attrsGroup) {
        allowedAttributes.add(attrName);
      }
    }
    const groupDefaults = attrsGroupsDefaults[attrsGroupName];
    if (groupDefaults) {
      for (const [attrName, defaultValue] of Object.entries(groupDefaults)) {
        attributesDefaults.set(attrName, defaultValue);
      }
    }
  }
  allowedChildrenPerElement.set(name, allowedChildren);
  allowedAttributesPerElement.set(name, allowedAttributes);
  attributesDefaultsPerElement.set(name, attributesDefaults);
}

/**
 * Remove unknown elements content and attributes,
 * remove attributes with default values.
 *
 * @author Kir Belevich
 *
 * @type {import('../lib/types.js').Plugin<RemoveUnknownsAndDefaultsParams>}
 */
export const fn = (root, params) => {
  const {
    unknownContent = true,
    unknownAttrs = true,
    defaultAttrs = true,
    defaultMarkupDeclarations = true,
    uselessOverrides = true,
    keepDataAttrs = true,
    keepAriaAttrs = true,
    keepRoleAttr = false,
  } = params;
  const stylesheet = collectStylesheet(root);

  return {
    instruction: {
      enter: (node) => {
        if (defaultMarkupDeclarations) {
          node.value = node.value.replace(/\s*standalone\s*=\s*(["'])no\1/, '');
        }
      },
    },
    element: {
      enter: (node, parentNode) => {
        // skip namespaced elements
        if (node.name.includes(':')) {
          return;
        }
        // skip visiting foreignObject subtree
        if (node.name === 'foreignObject') {
          return visitSkip;
        }

        // remove unknown element's content
        if (unknownContent && parentNode.type === 'element') {
          const allowedChildren = allowedChildrenPerElement.get(
            parentNode.name,
          );
          if (allowedChildren == null || allowedChildren.size === 0) {
            // remove unknown elements
            if (allowedChildrenPerElement.get(node.name) == null) {
              detachNodeFromParent(node, parentNode);
              return;
            }
          } else {
            // remove not allowed children
            if (allowedChildren.has(node.name) === false) {
              detachNodeFromParent(node, parentNode);
              return;
            }
          }
        }

        const allowedAttributes = allowedAttributesPerElement.get(node.name);
        const attributesDefaults = attributesDefaultsPerElement.get(node.name);
        const computedParentStyle =
          parentNode.type === 'element'
            ? computeStyle(stylesheet, parentNode)
            : null;

        // remove element's unknown attrs and attrs with default values
        for (const [name, value] of Object.entries(node.attributes)) {
          if (keepDataAttrs && name.startsWith('data-')) {
            continue;
          }
          if (keepAriaAttrs && name.startsWith('aria-')) {
            continue;
          }
          if (keepRoleAttr && name === 'role') {
            continue;
          }
          // skip xmlns attribute
          if (name === 'xmlns') {
            continue;
          }
          // skip namespaced attributes except xml:* and xlink:*
          if (name.includes(':')) {
            const [prefix] = name.split(':');
            if (prefix !== 'xml' && prefix !== 'xlink') {
              continue;
            }
          }

          if (
            unknownAttrs &&
            allowedAttributes &&
            allowedAttributes.has(name) === false
          ) {
            delete node.attributes[name];
          }
          if (
            defaultAttrs &&
            node.attributes.id == null &&
            attributesDefaults &&
            attributesDefaults.get(name) === value
          ) {
            // keep defaults if parent has own or inherited style
            if (
              computedParentStyle?.[name] == null &&
              !stylesheet.rules.some((rule) =>
                includesAttrSelector(rule.selector, name),
              )
            ) {
              delete node.attributes[name];
            }
          }
          if (uselessOverrides && node.attributes.id == null) {
            const style = computedParentStyle?.[name];
            if (
              presentationNonInheritableGroupAttrs.has(name) === false &&
              style != null &&
              style.type === 'static' &&
              style.value === value
            ) {
              delete node.attributes[name];
            }
          }
        }
      },
    },
  };
};
