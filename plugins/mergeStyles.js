'use strict';

const { querySelectorAll, closestByName } = require('../lib/xast.js');
const { getCssStr, setCssStr } = require('../lib/css-tools');

exports.type = 'full';
exports.active = true;
exports.description = 'merge multiple style elements into one';

/**
 * Merge multiple style elements into one.
 *
 * @param {Object} document document element
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function (document) {
  // collect <style/>s (preserve order)
  const styleEls = querySelectorAll(document, 'style');

  // no <styles/>s, nothing to do
  if (styleEls.length <= 1) {
    return document;
  }

  let styles = [];
  for (let styleEl of styleEls) {
    if (styleEl.length === 0 || closestByName(styleEl, 'foreignObject')) {
      // skip empty <style/>s or <foreignObject> content.
      continue;
    }

    const cssStr = getCssStr(styleEl);

    styles.push({
      styleEl: styleEl,

      mq: styleEl.attributes.media,
      cssStr: cssStr,
    });
  }

  let collectedStyles = [];
  for (let styleNo = 0; styleNo < styles.length; styleNo += 1) {
    const style = styles[styleNo];

    if (style.mq) {
      const wrappedStyles =
        '@media ' + style.mq + ' {' + '\n' + style.cssStr + '\n' + '}';
      collectedStyles.push(wrappedStyles);
    } else {
      collectedStyles.push(style.cssStr);
    }

    // remove all processed style elements – except the first one
    if (styleNo > 0) {
      const styleParentEl = style.styleEl.parentNode;
      styleParentEl.children.splice(
        styleParentEl.children.indexOf(style.styleEl),
        1
      );
    }
  }

  // assign the collected styles to the first style element
  styles[0].styleEl.removeAttr('media'); // remove media mq attribute as CSS media queries are used
  const collectedStylesStr = collectedStyles.join('');
  setCssStr(styles[0].styleEl, collectedStylesStr);

  return document;
};
