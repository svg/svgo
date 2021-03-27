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
  // collect <style/>s with valid type attribute (preserve order)
  const styleElements = querySelectorAll(document, 'style');

  // no <styles/>s, nothing to do
  if (styleElements.length <= 1) {
    return document;
  }

  let styles = [];
  for (let styleElement of styleElements) {
    if (
      styleElement.attributes.type &&
      styleElement.attributes.type !== 'text/css'
    ) {
      // skip <style> with invalid type attribute
      continue;
    }

    if (closestByName(styleElement, 'foreignObject')) {
      // skip <foreignObject> content
      continue;
    }

    const cssString = getCssStr(styleElement);

    styles.push({
      styleElement: styleElement,

      mq: styleElement.attributes.media,
      cssStr: cssString,
    });
  }

  let collectedStyles = [];
  for (let styleNo = 0; styleNo < styles.length; styleNo += 1) {
    const style = styles[styleNo];

    if (style.mq) {
      const wrappedStyles =
        `@media ${style.mq} {
${style.cssStr}
}`;
      collectedStyles.push(wrappedStyles);
    } else {
      collectedStyles.push(style.cssStr);
    }

    // remove all processed style elements – except the first one
    if (styleNo > 0) {
      removeFromParent(style.styleElement);
    }
  }
  const collectedStylesString = collectedStyles.join('');

  // re-assign the collected styles to the first style element
  let firstStyle = styles[0];
  delete firstStyle.styleElement.attributes.media; // remove media mq attribute as CSS media queries are used
  if (collectedStylesString.trim().length > 0) {
    setCssStr(firstStyle.styleElement, collectedStylesString);
  } else {
    removeFromParent(firstStyle.styleElement);
  }

  return document;
};

function removeFromParent(element) {
  const parentElement = element.parentNode;
  return parentElement.children.splice(
    parentElement.children.indexOf(element),
    1
  );
}
