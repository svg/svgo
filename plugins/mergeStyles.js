'use strict';

exports.type = 'full';
exports.active = true;
exports.description = 'merge multiple style elements into one';

var cssTools = require('../lib/css-tools');

/**
 * Merge multiple style elements into one.
 *
 * @param {Object} document document element
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function (document) {
  // collect <style/>s (preserve order)
  var styleEls = document.querySelectorAll('style');

  // no <styles/>s, nothing to do
  if (styleEls === null || styleEls.length <= 1) {
    return document;
  }

  var styles = [];
  for (var styleEl of styleEls) {
    if (styleEl.isEmpty() || styleEl.closestElem('foreignObject')) {
      // skip empty <style/>s or <foreignObject> content.
      continue;
    }

    var cssStr = cssTools.getCssStr(styleEl);

    styles.push({
      styleEl: styleEl,

      mq: styleEl.attr('media'),
      cssStr: cssStr,
    });
  }

  var collectedStyles = [];
  var styleNo = 0;
  for (var style of styles) {
    if (style.mq) {
      let wrappedStyles =
        '@media ' + style.mq.value + ' {' + '\n' + style.cssStr + '\n' + '}';
      collectedStyles.push(wrappedStyles);
    } else {
      collectedStyles.push(style.cssStr);
    }

    if (styleNo > 0) {
      // remove all processed style elements – except the first one
      var styleParentEl = style.styleEl.parentNode;
      styleParentEl.spliceContent(
        styleParentEl.children.indexOf(style.styleEl),
        1
      );
    }
    styleNo++;
  }

  // assign the collected styles to the first style element
  styles[0].styleEl.removeAttr('media'); // remove media mq attribute as CSS media queries are used
  var collectedStylesStr = collectedStyles.join('\n\n');
  cssTools.setCssStr(styles[0].styleEl, collectedStylesStr);

  return document;
};
