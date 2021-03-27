'use strict';

const { querySelectorAll, querySelector } = require('../lib/xast.js');

exports.type = 'full';

exports.active = true;

exports.description = 'dereferences <use/> elements';

exports.params = {
  keepHref: false, // keep (xlink:)href attributes

  symbolContainer: 'svg', // browsers use <svg/> as container of <symbol/> content (`g` could also be used)
};

const overridingUseAttrs = ['x', 'y', 'width', 'height', 'href', 'xlink:href'];
const hrefAttrs = ['href', 'xlink:href'];

/**
 * Dereferences <use> elements
 *
 *
 * @param {Object} document document element
 * @param {Object} options plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function (document, options) {
  options = options || {};

  // collect <use/>s
  const useEls = querySelectorAll(document, 'use');

  // no <use/>s, nothing to do
  if (useEls === null) {
    return document;
  }

  // replace <use/> with referenced node
  for (const useEl of useEls) {
    // `href`/`xlink:href` value
    const hrefAttr = useEl.attr('href')
      ? useEl.attr('href')
      : useEl.attr('xlink:href');
    if (!hrefAttr || hrefAttr.value.length === 0) continue;
    const href = hrefAttr.value;

    // look up referenced element
    const targetEl = querySelector(document, href);
    if (!targetEl) continue;

    // clone referenced element for insertion
    const insertEl = targetEl.clone();

    // Attribute inheritance of the dereferenced element
    // @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
    //   "Only the attributes x, y, width, height and href on the use element will override those set on the referenced element.
    //    However, any other attributes not set on the referenced element will be applied to the use element."
    useEl.eachAttr(function (attr) {
      if (
        insertEl.hasAttr(attr.name) &&
        !overridingUseAttrs.includes(attr.name)
      )
        return;
      if (!options.keepHref && hrefAttrs.includes(attr.name)) return;

      insertEl.addAttr(attr);
    });
    insertEl.removeAttr('id'); // only the original node is allowed to have this ID (IDs must be unique)

    const useParentEl = useEl.parentNode;
    // position of <use/> in parent
    const useElPosition = useParentEl.children.indexOf(useEl);

    // <symbol/> elements are template elements (hence not visible),
    // browsers would place a <symbol/> element as a different element
    if (insertEl.isElem('symbol')) insertEl.renameElem(options.symbolContainer);

    // apply styles of <use/> element on top of the referenced Element
    const useElProperties = useEl.style.getProperties();
    useElProperties.forEach(function (property, propertyName) {
      insertEl.style.setProperty(
        propertyName,
        property.value,
        property.priority
      );
    });

    // replace the <use/> element with the referenced element
    useParentEl.children.splice(useElPosition, 1, insertEl);
  }

  return document;
};
