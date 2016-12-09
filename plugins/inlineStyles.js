'use strict';

exports.type   = 'full';

exports.active = true;

exports.params = {
  onlyMatchedOnce:        true,
  removeMatchedSelectors: true,
  useMqs:                 ['screen']
};

exports.description = 'inline styles (optionally skip selectors that match more than once)';


var SPECIFICITY = require('specificity'),
    stable      = require('stable'),
    csso        = require('csso'),
    selectCss   = require('../lib/ext/select-css'),
    findParent  = require('../lib/ext/find-parent');

/**
  * Moves + merges styles from style elements to element styles
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data, opts) {

  // collect <style/>s
  var styleEls      = selectCss('style', data);

  var styleItems    = [],
      selectorItems = [];
  for(var styleElIndex in styleEls) {
    var styleEl = styleEls[styleElIndex];

    if(styleEl.isEmpty()) {
      // skip empty <style/>s
      continue;
    }
    var cssStr = styleEl.content[0].text;

    // collect <style/>s and their css ast
    var cssAst = csso.parse(cssStr, {context: 'stylesheet'});
    styleItems.push({
      styleEl: styleEl,
      cssAst:  cssAst
    });

    // collect css selectors and their containing ruleset
    var curAtRuleExpNode = null;
    csso.walk(cssAst, function(node, item) {
      if(node.type === 'AtruleExpression') {
        // media query expression
        curAtRuleExpNode = node;
      }

      if(node.type === 'SimpleSelector') {
		    // csso 'SimpleSelector' to be interpreted with CSS2.1 specs, _not_ with CSS3 Selector module specs:
	      // Selector group ('Selector' in csso) consisting of simple selectors ('SimpleSelector' in csso), separated by comma.
        // <Selector>: <'SimpleSelector'>, <'SimpleSelector'>, ...
        var selectorStr = csso.translate(node);

        // mediaquery if SimpleSelector belongs to one
        var mqStr = '';
        if(curAtRuleExpNode !== null) {
          mqStr = csso.translate(curAtRuleExpNode);
        }

        var selectorItem = {
          selectorStr:        selectorStr,
          simpleSelectorItem: item,
          rulesetNode:        this.ruleset,
          atRuleExpNode:      curAtRuleExpNode,
          mqStr:              mqStr
        };
        selectorItems.push(selectorItem);
      }
    });
  }

  // filter for mediaqueries to be used or without any mediaquery
  var selectorItemsMqs = selectorItems.filter(function(selectorItem) {
    return (selectorItem.mqStr.length == 0 || 
            opts.useMqs.indexOf(selectorItem.mqStr) > -1);
  });

  // stable-sort css selectors by their specificity
  var selectorItemsSorted = stable(selectorItemsMqs, function(item1, item2) {
    return SPECIFICITY.compare(item1.selectorStr, item2.selectorStr);
  });

  // apply <style/> styles to matched elements
  for(var selectorItemIndex in selectorItemsSorted) {
    var selectorItem = selectorItemsSorted[selectorItemIndex],
        selectedEls  = selectCss(selectorItem.selectorStr, data);
    if(opts.onlyMatchedOnce && selectedEls.length > 1) {
      // skip selectors that match more than once if option onlyMatchedOnce is enabled
      continue;
    }

    for(var selectedElIndex in selectedEls) {
      var selectedEl = selectedEls[selectedElIndex];

      // empty defaults in case there is no style attribute
      var elInlineStyleAttr = { name: 'style', value: '', prefix: '', local: 'style' },
          elInlineStyles    = '';

      if(selectedEl.hasAttr('style')) {
        elInlineStyleAttr = selectedEl.attr('style');
        elInlineStyles    = elInlineStyleAttr.value;
      }
      var inlineCssAst    = csso.parse(elInlineStyles, {context: 'block'});

      // merge element(inline) styles + matching <style/> styles
      var newInlineCssAst = csso.parse('', {context: 'block'}); // for an empty css ast (in block context)
      csso.walk(selectorItem.rulesetNode, function(node, item) {
        if(node.type === 'Declaration') {
          newInlineCssAst.declarations.insert(item);
        }
      });
      csso.walk(inlineCssAst, function(node, item) {
        if(node.type === 'Declaration') {
          newInlineCssAst.declarations.insert(item);
        }
      });
      var newCss = csso.translate(newInlineCssAst);

      elInlineStyleAttr.value = newCss;
      selectedEl.addAttr(elInlineStyleAttr);
    }

    if(opts.removeMatchedSelectors && selectedEls.length > 0) {
      // clean up matching simple selectors if option removeMatchedSelectors is enabled
      selectorItem.rulesetNode.selector.selectors.remove(selectorItem.simpleSelectorItem);
    }
  }

  var styleItemIndex = 0,
      styleItem      = {};
  for(styleItemIndex in styleItems) {
    styleItem = styleItems[styleItemIndex];
    csso.walk(styleItem.cssAst, function(node, item, list) {
      // clean up <style/> atrules without any rulesets left
      if(node.type === 'Atrule' &&
         node.block.rules.head === null) {
        list.remove(item);
      }
      // clean up <style/> rulesets without any css selectors left
      if(node.type === 'Ruleset' &&
         node.selector.selectors.head == null) {
          list.remove(item);
      }
    });
  }

  // update / clean up <style/>s with their changed ast
  for(styleItemIndex in styleItems) {
    styleItem = styleItems[styleItemIndex];
    if(styleItem.cssAst.rules.isEmpty()){
      // clean up now emtpy <style/>s
      var styleParent = findParent(data, styleItem.styleEl);
      styleParent.content.splice(styleParent.content.indexOf(styleItem.styleEl), 1);
      continue;
    }

    // update existing, left over <style>s
    styleItem.styleEl.content[0].text = csso.translate(styleItem.cssAst);
  }

  return data;
};
