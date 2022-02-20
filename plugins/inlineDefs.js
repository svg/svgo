'use strict';

/**
 * @typedef {import('../lib/types').XastParent} XastParent
 * @typedef {import('../lib/types').XastElement} XastElement
 */

const { visit, detachNodeFromParent } = require('../lib/xast.js');

exports.type = 'visitor';
exports.active = false;
exports.description = 'inlines svg definitions';

/**
 * @type {(root: null | XastElement, id: null | string) => null | [XastElement, XastParent]}
 */
const findElementById = (root, id) => {
  /**
   * @type {null | [XastElement, XastParent]}
   */
  let matched = null;
  if (root != null) {
    visit(root, {
      element: {
        enter: (node, parentNode) => {
          if (node.attributes.id === id && matched != null) {
            matched = [node, parentNode];
          }
        },
      },
    });
  }
  return matched;
};

/**
 * Replaces use tag with the corresponding definitions
 * if onlyUnique is enabled, replaces only use tags with definitions referred to only once
 *
 * @type {import('../lib/types').Plugin<{
 *   onlyUnique?: boolean
 * }>}
 */
exports.fn = (root, params) => {
  const { onlyUnique = true } = params;

  /**
   * @type {null | XastElement}
   */
  let defs = null;
  /**
   * @type {[XastElement, XastParent][]}
   */
  const uses = [];

  visit(root, {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'defs' && defs == null) {
          defs = node;
        }
        if (node.name === 'use') {
          uses.push([node, parentNode]);
        }
      },
    },
  });

  if (uses.length === 0) {
    return null;
  }

  const useCounts = new Map();
  for (const [node] of uses) {
    const href = node.attributes['xlink:href'] || node.attributes.href;
    const count = useCounts.get(href) || 0;
    useCounts.set(href, count + 1);
  }

  for (const [use, useParent] of uses) {
    const href = use.attributes['xlink:href'] || use.attributes.href;
    const count = useCounts.get(href) || 0;
    if (onlyUnique === true && count > 1) {
      continue;
    }

    const x = use.attributes.x;
    const y = use.attributes.y;

    let attrValue = null;
    if (x != null && y != null) {
      attrValue = `translate(${x}, ${y})`;
    } else if (x != null) {
      attrValue = `translate(${x})`;
    }
    const idMatch = href.match(idRegex);
    const id = idMatch == null ? null : idMatch[1];

    const matchedDef = findElementById(defs, id);
    if (matchedDef == null) {
      continue;
    }
    const [matchedDefNode, matchedDefParent] = matchedDef;
    if (onlyUnique === true && count === 1) {
      detachNodeFromParent(matchedDefNode, matchedDefParent);
    }
    for (const [name, value] of Object.entries(use.attributes)) {
      if (
        name !== 'x' &&
        name !== 'y' &&
        name !== 'xlink:href' &&
        name !== 'href'
      ) {
        matchedDefNode.attributes[name] = value;
      }
    }
    if (attrValue != null) {
      /**
       * @type {XastElement}
       */
      const g = {
        type: 'element',
        name: 'g',
        attributes: {
          transform: attrValue,
        },
        children: [matchedDefNode],
      };

      useParent.children = useParent.children.map((node) => {
        if (node === use) {
          return g;
        }
        return node;
      });
    } else {
      useParent.children = useParent.children.map((node) => {
        if (node === use) {
          return matchedDefNode;
        }
        return node;
      });
    }
  }

  if (onlyUnique === false) {
    for (var element in useCount) {
      if (useCount.hasOwnProperty(element) && useCount[element] > 1) {
        var tags = document.querySelectorAll(element);
        for (var j = 0; j < tags.length; j++) {
          tags[j].removeAttr('id');
        }
      }
    }
  }

  if (
    onlyUnique === false ||
    document.querySelector('defs').content.length === 0
  ) {
    _replaceElement(document.querySelector('defs'));
  }

  return null;
};

/**
 * replace element with another
 * if newElement is omitted, oldElement will be removed without replacement
 * @param {Object} oldElement
 * @param {Object} [newElement]
 * @returns {Object}
 * @private
 */
function _replaceElement(oldElement, newElement) {
  var elementIndex = _getElementIndex(oldElement);

  if (newElement) {
    oldElement.parentNode.spliceContent(elementIndex, 1, newElement);
  } else {
    oldElement.parentNode.spliceContent(elementIndex, 1);
  }

  return oldElement;
}

/**
 * returns index of the element in the list of siblings
 * returns -1 if element could not be found
 * @param {Object} element
 * @returns {number}
 * @private
 */
function _getElementIndex(element) {
  element.addAttr({
    name: 'data-defs-index',
    value: 'true',
    prefix: '',
    local: 'data-defs-index',
  });

  var index = element.parentNode.content.findIndex(function (contentElement) {
    return contentElement.hasAttr('data-defs-index', 'true');
  });

  element.removeAttr('data-defs-index');

  return index;
}

var idRegex = /^#?(\S+)/;
