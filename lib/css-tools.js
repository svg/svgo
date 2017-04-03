'use strict';

var csstree = require('css-tree'),
    stable = require('stable'),
    specificity = require('csso/lib/restructure/prepare/specificity'),
    List = require('css-tree/lib/utils/list');


/**
 * Flatten a CSS AST to a selectors list.
 *
 * @param {Object} cssAst CSSO AST to flatten
 * @return {Array} selectors
 */
function flattenToSelectors(cssAst) {
    var selectors = [];

    csstree.walkRules(cssAst, function(node) {
        if (node.type !== 'Rule') {
            return;
        }

        var atrule = this.atrule;
        var rule = node;

        node.selector.children.each(function(selectorNode, selectorItem) {
            var selector = {
                item: selectorItem,
                atrule: atrule,
                rule: rule,
                pseudos: []
            };

            selectorNode.children.each(function(selectorChildNode, selectorChildItem, selectorChildList) {
                if (selectorChildNode.type === 'PseudoClassSelector' ||
                    selectorChildNode.type === 'PseudoElementSelector') {
                    selector.pseudos.push({
                        item: selectorChildItem,
                        list: selectorChildList
                    });
                }
            });

            selectors.push(selector);
        });
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
    return selectors.filter(function(selector) {
        if (selector.atrule === null) {
            return useMqs.indexOf('') > -1;
        }

        var mqName = selector.atrule.name;
        var mqStr = mqName;
        if (selector.atrule.expression.type === 'MediaQueryList') {
            var mqExpr = csstree.translate(selector.atrule.expression);
            mqStr = [mqName, mqExpr].join(' ');
        }

        return useMqs.indexOf(mqStr) > -1;
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
    return selectors.filter(function(selector) {
        var pseudoSelectorsStr = csstree.translate({
            type: 'Selector',
            children: new List().fromArray(selector.pseudos.map(function(pseudo) {
                return pseudo.item.data;
            }))
        });
        return usePseudos.indexOf(pseudoSelectorsStr) > -1;
    });
}

/**
 * Remove pseudo-elements and/or -classes from the selectors for proper matching.
 *
 * @param {Array} selectors to clean
 * @return {Array} Selectors without pseudo-elements and/or -classes
 */
function cleanPseudos(selectors) {
    selectors.forEach(function(selector) {
        selector.pseudos.forEach(function(pseudo) {
            pseudo.list.remove(pseudo.item);
        });
    });
}


/**
 * Compares two selector specificities.
 * extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
 *
 * @param {Array} aSpecificity Specificity of selector A
 * @param {Array} bSpecificity Specificity of selector B
 * @return {Number} Score of selector specificity A compared to selector specificity B
 */
function compareSpecificity(aSpecificity, bSpecificity) {
    for (var i = 0; i < 4; i += 1) {
        if (aSpecificity[i] < bSpecificity[i]) {
            return -1;
        } else if (aSpecificity[i] > bSpecificity[i]) {
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
 * @return {Number} Score of selector A compared to selector B
 */
function compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode) {
    var aSpecificity = specificity(aSimpleSelectorNode),
        bSpecificity = specificity(bSimpleSelectorNode);
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
 * Convert a CSSO AST style declaration to CSSStyleDeclaration property.
 *
 * @param {Object} cssoDeclaration CSSO style declaration
 * @return {Object} CSSStyleDeclaration property
 */
function cssoToStyleDeclaration(cssoDeclaration) {
    var propertyName = cssoDeclaration.property,
        propertyValue = csstree.translate(cssoDeclaration.value),
        propertyPriority = (cssoDeclaration.important ? 'important' : '');
    return {
        name: propertyName,
        value: propertyValue,
        priority: propertyPriority
    };
}


module.exports.flattenToSelectors = flattenToSelectors;

module.exports.filterByMqs = filterByMqs;
module.exports.filterByPseudos = filterByPseudos;
module.exports.cleanPseudos = cleanPseudos;

module.exports.compareSpecificity = compareSpecificity;
module.exports.compareSimpleSelectorNode = compareSimpleSelectorNode;

module.exports.sortSelectors = sortSelectors;

module.exports.cssoToStyleDeclaration = cssoToStyleDeclaration;
