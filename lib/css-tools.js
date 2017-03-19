'use strict';

var csstree     = require('css-tree'),
    stable      = require('stable'),
    specificity = require('csso/lib/restructure/prepare/specificity'),
    List        = require('css-tree/lib/utils/list');


function flattenToSelectors(cssAst) {
  var selectors   = [];

  csstree.walkRules(cssAst, function(node) {
    if (node.type !== 'Rule') {
        return;
    }

    var atrule = this.atrule;
    var rule   = node;

    node.selector.children.each(function(selectorNode, selectorItem) {
        var selector = {
            item:    selectorItem,
            atrule:  atrule,
            rule:    rule,
            pseudos: []
        };

        selectorNode.children.each(function(selectorChildNode, selectorChildItem, selectorChildList) {
            if(selectorChildNode.type == 'PseudoClassSelector' || 
               selectorChildNode.type == 'PseudoElementSelector') {
                selector.pseudos.push({ item: selectorChildItem, list: selectorChildList });
            }
        });

        selectors.push(selector);
    });
});

  return selectors;
}


function filterByMqs(selectors, useMqs) {
  return selectors.filter(function(selector) {
    if(selector.atrule === null) {
      return useMqs.indexOf('') > -1;
    }

    var mqName = selector.atrule.name;
    var mqExpr = csstree.translate(selector.atrule.expression);
    var mqStr  = [mqName, mqExpr].join(' ');

    return useMqs.indexOf(mqStr) > -1;
  });
}

function filterByPseudos(selectors, usePseudos) {
  return selectors.filter(function(selector) {
    var pseudoNodes = [];
    for(var pseudo of selector.pseudos) {
      pseudoNodes.push(pseudo.item.data);
    }
    var pseudoSelectorsStr = csstree.translate({
      type: 'Selector',
      children: new List().fromArray(pseudoNodes)
    });
    return usePseudos.indexOf(pseudoSelectorsStr) > -1;
  });
}

function cleanPseudos(selectors) {
  selectors.forEach(function(selector) {
    selector.pseudos.forEach(function(pseudo) {
        pseudo.list.remove(pseudo.item);
    });
  });
}


// extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
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

function compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode) {
  var aSpecificity = specificity(aSimpleSelectorNode),
      bSpecificity = specificity(bSimpleSelectorNode);
  return compareSpecificity(aSpecificity, bSpecificity);
}

function _bySelectorSpecificity(selectorA, selectorB) {
  return compareSimpleSelectorNode(selectorA.item.data, selectorB.item.data);
}

function sortSelectors(selectors) {
  return stable(selectors, _bySelectorSpecificity);
}


// csso declaration to style declaration
function cssoToStyleDeclaration(declaration) {
  var propertyName     = declaration.property,
      propertyValue    = csstree.translate(declaration.value),
      propertyPriority = (declaration.important ? 'important' : '');
  return { name: propertyName, value: propertyValue, priority: propertyPriority };
}


module.exports.flattenToSelectors        = flattenToSelectors;

module.exports.filterByMqs               = filterByMqs;
module.exports.filterByPseudos           = filterByPseudos;
module.exports.cleanPseudos              = cleanPseudos;

module.exports.compareSpecificity        = compareSpecificity;
module.exports.compareSimpleSelectorNode = compareSimpleSelectorNode;

module.exports.sortSelectors             = sortSelectors;

module.exports.cssoToStyleDeclaration               = cssoToStyleDeclaration;
