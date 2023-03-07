'use strict';

const path = require('path');

exports.name = 'addClassesToSVGElement';
exports.description = 'adds classnames to an outer <svg> element';

var ENOCLS = `Error in plugin "addClassesToSVGElement": absent parameters.
It should have a list of classes in "classNames" or one "className".
Config example:
plugins: [
  {
    name: "addClassesToSVGElement",
    params: {
      className: "mySvg"
    }
  }
]
plugins: [
  {
    name: "addClassesToSVGElement",
    params: {
      classNames: ["mySvg", "size-big"]
    }
  }
]
`;

/**
 * Add classnames to an outer <svg> element. Example config:
 *
 * plugins: [
 *   {
 *     name: "addClassesToSVGElement",
 *     params: {
 *       className: "mySvg"
 *     }
 *   }
 * ]
 *
 * plugins: [
 *   {
 *     name: "addClassesToSVGElement",
 *     params: {
 *       classNames: ["mySvg", "size-big"]
 *     }
 *   }
 * ]
 *
 * @author April Arcus
 *
 * @type {import('./plugins-types').Plugin<'addClassesToSVGElement'>}
 */
exports.fn = (root, params, info) => {
  if (
    !(Array.isArray(params.classNames) && params.classNames.some(String)) &&
    !params.className
  ) {
    console.error(ENOCLS);
    return null;
  }
  const classNames = params.classNames || [params.className];

  /**
   * If we have a suffix pattern,
   * duplicate the existing class names and add a copy with the suffix.
   * If the suffix pattern contains the magic keyword '$FILENAME',
   * it is replaced with the actual filename. For example,
   * if the className param is 'mySvg' and the suffixPattern
   * param is '__$FILENAME`, then for 'cat.svg`, the final classes
   * will be 'mySvg mySvg__cat'. For 'dog.svg', the final classes
   * will be 'mySvg mSvg__dog'.
   */
  if (typeof params.suffixPattern !== 'undefined') {
    let suffixPattern = params.suffixPattern;
    const filename = path.basename(info.path, '.svg');
    suffixPattern = suffixPattern.replace('$FILENAME', filename);
    for (var i = 0, len = classNames.length; i < len; i++) {
      classNames.push(classNames[i] + suffixPattern);
    }
  }

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          const classList = new Set(
            node.attributes.class == null
              ? null
              : node.attributes.class.split(' ')
          );
          for (const className of classNames) {
            if (className != null) {
              classList.add(className);
            }
          }
          node.attributes.class = Array.from(classList).join(' ');
        }
      },
    },
  };
};
