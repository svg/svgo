'use strict';

const { querySelectorAll, querySelector } = require('../lib/xast.js');

exports.type = 'full';

exports.active = true;

exports.description = 'dereferences <use/> elements';

exports.params = {
  keepHref: false, // keep (xlink:)href attributes
  symbolContainer: 'svg', // browsers use <svg/> as container of <symbol/> content (`g` could also be used)
};

const OverridingUseAttributeNames = [
  'x',
  'y',
  'width',
  'height',
  'href',
  'xlink:href',
];
const HrefAttributeNames = ['href', 'xlink:href'];

/**
 * Dereferences <use> elements
 *
 * @author strarsis <strarsis@gmail.com>
 *
 * @type {import('./plugins-types').Plugin<'dereferenceUses'>}
 */
exports.fn = (document, params) => {
  const {
    keepHref = false,
    symbolContainer = 'svg',
  } = params;

  // collect <use/>s
  const useElements = querySelectorAll(document, 'use');

  // no <use/>s, nothing to do
  if (useElements === null) {
    return document;
  }

  // replace each <use/> with its referenced node
  for (const useElement of useElements) {
    // `href`/`xlink:href` value
    let href = '';
    for (let hrefAttributeName of HrefAttributeNames) {
      if ((href = useElement.attributes[hrefAttributeName])) {
        // use only the first matching href-attribute
        break;
      }
    }
    if (!href) continue;

    // look up referenced element
    const targetElement = querySelector(document, href);
    if (!targetElement) continue;

    // clone referenced element for insertion
    const insertElement = targetElement.clone();

    // Attribute inheritance of the referenced element
    // @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
    //   "Only the attributes x, y, width, height and href on the use element will override those set on the referenced element.
    //    However, any other attributes not set on the referenced element will be applied to the use element."
    const insertElementAttributeNames = Object.keys(insertElement.attributes);
    for (const attributeName in useElement.attributes) {
      // don't remove attributes from the referenced element that, by specs, override the one of the <use> element
      if (
        insertElementAttributeNames.includes(attributeName) &&
        !OverridingUseAttributeNames.includes(attributeName)
      )
        continue;

      // don't remove href attribute with keepHref option turned on
      if (!keepHref && HrefAttributeNames.includes(attributeName)) continue;

      // set overriding attributes from referenced node
      insertElement.attributes[attributeName] =
        useElement.attributes[attributeName];
    }

    // only the original node is allowed to have this ID (IDs must be unique)
    delete insertElement.attributes['id'];

    // <symbol/> elements are template elements (hence not visible),
    // browsers would place a <symbol/> element as a different element
    if (insertElement.isElem('symbol')) {
      insertElement.name = symbolContainer;
    }

    // apply styles of <use/> element on top of the referenced Element
    const useElementProperties = useElement.style.getProperties();
    for (const propertyName in useElementProperties) {
      const property = useElementProperties[propertyName];

      insertElement.style.setProperty(
        propertyName,
        property.value,
        property.priority
      );
    }

    // replace the <use/> element with the referenced element
    const useParentElement = useElement.parentNode;

    // position of <use/> in parent
    const useElementPosition = useParentElement.children.indexOf(useElement);

    useParentElement.children.splice(useElementPosition, 1, insertElement);
  }

  return document;
};
