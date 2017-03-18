'use strict';

var csstree     = require('css-tree'),
    stable      = require('stable'),
    specificity = require('csso/lib/restructure/prepare/specificity');


function flattenToSelectors(cssAst) {
  var selectors   = [],
      curSelector = null;

  // TODO: walkup to avoid look-behind
  csstree.walk(cssAst, function(node, item, list) {

    // selector with pseudos
    // look-behind: The pseudo selectors come after the affected simple selector
    if(node.type == 'PseudoClassSelector' || 
       node.type == 'PseudoElementSelector') {
      curSelector.pseudos.push({ item: item, list: list });
    }

    // (simple) selector
    if(node.type !== 'Selector') {
      return;
    }

    curSelector = {
      item:    item,
      atrule:  this.atrule,
      rule:    this.rule,
      pseudos: []
    };
    selectors.push(curSelector);

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
  var emptySelectorObj = {
    type: 'Selector',
    children: []
  };
  return selectors.filter(function(selector) {
    var pseudoSelectorsAst = csstree.fromPlainObject(emptySelectorObj);
    for(var pseudo of selector.pseudos) {
      pseudoSelectorsAst.children.appendData(pseudo.item.data);
    }

    var pseudoSelectorsStr = csstree.translate(pseudoSelectorsAst);

    return usePseudos.indexOf(pseudoSelectorsStr) > -1;
  });
}

function cleanPseudos(selectors) {
  selectors.map(function(selector) {
    for(var pseudo of selector.pseudos) {
      pseudo.list.remove(pseudo.item);
    }
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
  return { name: propertyName, property: { value: propertyValue, priority: propertyPriority } };
}


module.exports.flattenToSelectors        = flattenToSelectors;

module.exports.filterByMqs               = filterByMqs;
module.exports.filterByPseudos           = filterByPseudos;
module.exports.cleanPseudos              = cleanPseudos;

module.exports.compareSpecificity        = compareSpecificity;
module.exports.compareSimpleSelectorNode = compareSimpleSelectorNode;

module.exports.sortSelectors             = sortSelectors;

module.exports.cssoToStyleDeclaration               = cssoToStyleDeclaration;
