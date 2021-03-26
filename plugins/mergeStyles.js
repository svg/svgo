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
    if (closestByName(styleEl, 'foreignObject')) {
      // skip <foreignObject> content
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
      removeFromParent(style.styleEl);
    }
  }

  // re-assign the collected styles to the first style element
  let firstStyle = styles[0];
  delete firstStyle.styleEl.attributes.media; // remove media mq attribute as CSS media queries are used
  const collectedStylesStr = collectedStyles.join('');
  if(collectedStylesStr.trim().length > 0) {
    setCssStr(firstStyle.styleEl, collectedStylesStr);
  } else {
    removeFromParent(firstStyle.styleEl);
  }

  return document;
};


function removeFromParent(el) {
  const parentEl = el.parentNode;
  return parentEl.children.splice(
	parentEl.children.indexOf(el),
	1
  );
}
