'use strict';


exports.type = 'full';

exports.active = true;

exports.description = 'dereferences <use/> elements';

exports.params = {
    keepHref: false, // keep (xlink:)href attributes
};


const overridingUseAttributes = [ 'x', 'y', 'width', 'height', 'href', 'xlink:href' ];


/**
 * Dereferences <use> elements
 *
 *
 * @param {Object} document document element
 * @param {Object} options plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(document, options) {
    options = options || {};

    // collect <use/>s
    var useEls = document.querySelectorAll('use');

    // no <use/>s, nothing to do
    if (useEls === null) {
        return document;
    }

    // replace <use/> with referenced node
    for (var useEl of useEls) {
        var hrefAttr = useEl.attr('href') ? useEl.attr('href') : useEl.attr('xlink:href');
        if(!hrefAttr || hrefAttr.value.length === 0) continue;
        var href = hrefAttr.value;


        var targetEl = document.querySelector(href);
        if(!targetEl) continue;


        var insertEl = targetEl.clone();


        // Attribute inheritance
        // @see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use
        //   "Only the attributes x, y, width, height and href on the use element will override those set on the referenced element.
        //    However, any other attributes not set on the referenced element will be applied to the use element."
        useEl.eachAttr(function(attr) {
            if(insertEl.hasAttr(attr.name) && !overridingUseAttributes.includes(attr.name)) return;
            if(!options.keepHref && attr.name === ('href' || 'xlink:href')) return;

            insertEl.addAttr(attr);
        });
        insertEl.removeAttr('id'); // only the original node is allowed to have this ID


        var useParentEl = useEl.parentNode;
        var useElPosition = useParentEl.content.indexOf(useEl); // position of <use/> in parent
        useParentEl.spliceContent(useElPosition, 1, insertEl); // replace <use/> with node
    }

    return document;
};
