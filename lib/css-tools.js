'use strict';

const { List, walk, generate } = require('css-tree');
const stable = require('stable');
const specificity = require('csso/lib/restructure/prepare/specificity');

/**
 * Flatten a CSS AST to a selectors list.
 *
 * @param {import('css-tree').CssNode} cssAst css-tree AST to flatten
 * @return {Array} selectors
 */
function flattenToSelectors(cssAst) {
  const selectors = [];

  walk(cssAst, {
    visit: 'Rule',
    enter(node) {
      if (node.type !== 'Rule') {
        return;
      }

      const { atrule } = this;
      const rule = node;

      node.prelude.children.each((selectorNode, selectorItem) => {
        const selector = {
          item: selectorItem,
          atrule,
          rule,
          pseudos: /** @type {{item: any; list: any[]}[]} */ ([]),
        };

        selectorNode.children.each(
          (selectorChildNode, selectorChildItem, selectorChildList) => {
            if (
              selectorChildNode.type === 'PseudoClassSelector' ||
              selectorChildNode.type === 'PseudoElementSelector'
            ) {
              selector.pseudos.push({
                item: selectorChildItem,
                list: selectorChildList,
              });
            }
          }
        );

        selectors.push(selector);
      });
    },
  });

  return selectors;
}

/**
 * Filter selectors by Media Query.
 *
 * @param {Array} selectors to filter
 * @param {Array} useMqs Array with strings of media queries that should pass (<name> <expression>)
 * @return {Array} Filtered selectors that match the passed media queries
 */
function filterByMqs(selectors, useMqs) {
  return selectors.filter((selector) => {
    if (selector.atrule === null) {
      return useMqs.includes('');
    }

    const mqName = selector.atrule.name;
    let mqStr = mqName;
    if (
      selector.atrule.expression &&
      selector.atrule.expression.children.first().type === 'MediaQueryList'
    ) {
      const mqExpr = generate(selector.atrule.expression);
      mqStr = [mqName, mqExpr].join(' ');
    }

    return useMqs.includes(mqStr);
  });
}

/**
 * Filter selectors by the pseudo-elements and/or -classes they contain.
 *
 * @param {Array} selectors to filter
 * @param {Array} usePseudos Array with strings of single or sequence of pseudo-elements and/or -classes that should pass
 * @return {Array} Filtered selectors that match the passed pseudo-elements and/or -classes
 */
function filterByPseudos(selectors, usePseudos) {
  return selectors.filter((selector) => {
    const pseudoSelectorsStr = generate({
      type: 'Selector',
      children: new List().fromArray(
        selector.pseudos.map((pseudo) => pseudo.item.data)
      ),
    });
    return usePseudos.includes(pseudoSelectorsStr);
  });
}

/**
 * Remove pseudo-elements and/or -classes from the selectors for proper matching.
 *
 * @param {Array} selectors to clean
 * @return {void}
 */
function cleanPseudos(selectors) {
  for (const selector of selectors) {
    for (const pseudo of selector.pseudos) {
      pseudo.list.remove(pseudo.item);
    }
  }
}

/**
 * Compares two selector specificities.
 * extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
 *
 * @param {Array} aSpecificity Specificity of selector A
 * @param {Array} bSpecificity Specificity of selector B
 * @return {number} Score of selector specificity A compared to selector specificity B
 */
function compareSpecificity(aSpecificity, bSpecificity) {
  for (let i = 0; i < 4; i++) {
    if (aSpecificity[i] < bSpecificity[i]) {
      return -1;
    }

    if (aSpecificity[i] > bSpecificity[i]) {
      return 1;
    }
  }

  return 0;
}

/**
 * Compare two simple selectors.
 *
 * @param {Object} aSimpleSelectorNode Simple selector A
 * @param {Object} bSimpleSelectorNode Simple selector B
 * @return {number} Score of selector A compared to selector B
 */
function compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode) {
  const aSpecificity = specificity(aSimpleSelectorNode);
  const bSpecificity = specificity(bSimpleSelectorNode);
  return compareSpecificity(aSpecificity, bSpecificity);
}

function _bySelectorSpecificity(selectorA, selectorB) {
  return compareSimpleSelectorNode(selectorA.item.data, selectorB.item.data);
}

/**
 * Sort selectors stably by their specificity.
 *
 * @param {Array} selectors to be sorted
 * @return {Array} Stable sorted selectors
 */
function sortSelectors(selectors) {
  return stable(selectors, _bySelectorSpecificity);
}

/**
 * Convert a css-tree AST style declaration to CSSStyleDeclaration property.
 *
 * @param {import('css-tree').CssNode} declaration css-tree style declaration
 * @return {Object} CSSStyleDeclaration property
 */
function csstreeToStyleDeclaration(declaration) {
  const name = declaration.property;
  const value = generate(declaration.value);
  const priority = declaration.important ? 'important' : '';

  return {
    name,
    value,
    priority,
  };
}

/**
 * Gets the CSS string of a style element
 *
 * @param {Object} elem style element
 * @return {string} CSS string or empty array if no styles are set
 */
function getCssStr(elem) {
  if (
    elem.children.length > 0 &&
    (elem.children[0].type === 'text' || elem.children[0].type === 'cdata')
  ) {
    return elem.children[0].value;
  }

  return '';
}

/**
 * Sets the CSS string of a style element
 *
 * @param {Object} elem style element
 * @param {string} css string to be set
 * @return {string} reference to field with CSS
 */
function setCssStr(elem, css) {
  if (elem.children.length === 0) {
    elem.children.push({
      type: 'text',
      value: '',
    });
  }

  if (elem.children[0].type !== 'text' && elem.children[0].type !== 'cdata') {
    return css;
  }

  elem.children[0].value = css;

  return css;
}

module.exports = {
  flattenToSelectors,
  filterByMqs,
  filterByPseudos,
  cleanPseudos,
  compareSpecificity,
  compareSimpleSelectorNode,
  sortSelectors,
  csstreeToStyleDeclaration,
  getCssStr,
  setCssStr,
};
