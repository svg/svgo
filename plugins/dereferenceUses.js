import * as csstree from 'css-tree';

import { visitSkip, querySelector } from '../lib/xast.js';

/**
 * @typedef {import('../lib/types.js').XastElement} XastElement
 * @typedef {import('../lib/types.js').XastParent} XastParent
 */

export const name = 'dereferenceUses';
export const description = 'dereferences <use/> elements';

export const params = {
  keepHref: false, // keep (xlink:)href attributes
  symbolContainer: 'svg', // browsers use <svg/> as container of <symbol/> content (e.g. <g> could also be used)
};

const OverridingUseAttributeNames = [
  'x',
  'y',
  'width',
  'height',
  'href',
  'xlink:href',
];

const HrefAttributeNames = [
  'href', // By spec, `href` has precedence over (deprecated) `xlink:href`
  'xlink:href',
];

/**
 * Dereferences <use> elements
 *
 * @author strarsis <strarsis@gmail.com>
 *
 * @type {import('./plugins-types.js').Plugin<'dereferenceUses'>}
 */
export const fn = (root, params) => {
  const { keepHref = false, symbolContainer = 'svg' } = params;

  /**
   * @type {Array<{ node: XastElement, parentNode: XastParent, targetNode?: XastElement }>}
   */
  let useElements = [];

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'use') {
          useElements.push({
            node,
            parentNode,
          });
          return visitSkip;
        }
      },
    },

    root: {
      exit: (root) => {
        // replace each <use/> with its referenced node
        for (const useElement of useElements) {
          // `href`/`xlink:href` value
          let href = '';
          for (let hrefAttributeName of HrefAttributeNames) {
            href = useElement.node.attributes[hrefAttributeName];
            if (href) {
              break; // The first occurence is to be used (spec).
            }
          }
          if (!href) {
            continue;
          }

          // look up referenced element
          const targetElement = querySelector(root, href);
          if (!targetElement || targetElement.type !== 'element') {
            continue;
          }

          // clone referenced element for insertion
          const insertElement = structuredClone(targetElement);

          // Attribute inheritance of the referenced element
          // @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
          //   "Only the attributes x, y, width, height and href on the use element will override those set on the referenced element.
          //    However, any other attributes not set on the referenced element will be applied to the use element."
          const insertElementAttributeNames = Object.keys(
            insertElement.attributes
          );
          for (const attributeName in useElement.node.attributes) {
            // don't remove attributes from the referenced element that, by spec, override the one of the <use> element
            if (
              insertElementAttributeNames.includes(attributeName) &&
              !OverridingUseAttributeNames.includes(attributeName)
            ) {
              continue;
            }

            // don't remove href attribute with keepHref option turned on
            if (!keepHref && HrefAttributeNames.includes(attributeName)) {
              continue;
            }

            // styles must be appended, not overriden
            if (attributeName === 'style') {
              continue;
            }

            // set overriding attributes from referenced node
            insertElement.attributes[attributeName] =
              useElement.node.attributes[attributeName];
          }

          // only the original node is allowed to have this ID (IDs must be unique)
          delete insertElement.attributes['id']; // remove ID attribute

          // <symbol/> elements are template elements (hence not visible),
          // browsers would place a <symbol/> element as a different element
          if (insertElement.name === 'symbol') {
            insertElement.name = symbolContainer;
          }

          // apply styles of <use/> element also on top of the referenced element
          const useElementStyles = useElement.node.attributes.style;
          const insertElementStyles = insertElement.attributes.style;
          const styleParseOpts = { context: 'declarationList' };
          if (useElementStyles) {
            const useElementStylesAst = csstree.parse(
              useElementStyles,
              styleParseOpts
            );
            if (useElementStylesAst.type !== 'DeclarationList') {
              continue;
            }

            const insertElementStylesAst = csstree.parse(
              insertElementStyles,
              styleParseOpts
            );
            if (insertElementStylesAst.type !== 'DeclarationList') {
              continue;
            }

            insertElementStylesAst.children.appendList(
              useElementStylesAst.children
            );

            const insertElementStylesAppended = csstree.generate(
              insertElementStylesAst
            );
            insertElement.attributes.style = insertElementStylesAppended; // append styles (styles from <use/> have higher priority)
          }

          // replace the <use/> element with the referenced, resolved element

          // position of <use/> in parent
          const useElementPosition = useElement.parentNode.children.indexOf(
            useElement.node
          );

          useElement.parentNode.children.splice(
            useElementPosition,
            1,
            insertElement
          );
        }
      },
    },
  };
};
