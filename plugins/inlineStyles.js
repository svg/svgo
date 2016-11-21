'use strict';

exports.type   = 'full';

exports.active = true;

exports.params = {
  onlyMatchedOnce:        true,
  removeMatchedSelectors: true
};

exports.description = 'inline styles (optionally skip selectors that match more than once)';


var SPECIFICITY   = require('specificity'),
    stable        = require('stable'),
    csso          = require('csso'),

    domutilsSvgo  = require('../lib/ext/domutils-svgo'),
    addParentRefs = require('../lib/ext/add-parent-refs'),
    cssSelect     = require('css-select');

var cssSelectOpts = {xmlMode: true, adapter: domutilsSvgo};

/**
  * Moves + merges styles from style elements to element styles
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data, opts) {
  data = addParentRefs(data);

  // fetch <style/>s
  var styleEls      = cssSelect('style', data, cssSelectOpts);

  var styleItems    = [],
      selectorItems = [];

  var styleEl;
  for(var styleElId in styleEls) {
    styleEl = styleEls[styleElId];

    if( styleEl.isEmpty()       || !styleEl.content[0] || 
       !styleEl.content[0].text ||  styleEl.content[0].text.length == 0) {
      continue;
    }
    var cssStr = styleEl.content[0].text;

    // <style/>s and their css ast
    var cssAst = csso.parse(cssStr, {context: 'stylesheet'});
    styleItems.push({
      styleEl: styleEl,
      cssAst:  cssAst
    });

    // css selectors and their css ruleset
    csso.walk(cssAst, function(node, item) {
      if(node.type === 'SimpleSelector') {
		// csso 'SimpleSelector' to be interpreted with CSS2.1 specs, _not_ with CSS3 Selector module specs:
	    // Selector group ('Selector' in csso) separated by comma: <'SimpleSelector'>, <'SimpleSelector'>, ...
        var selectorStr  = csso.translate(node);
        var selectorItem = {
          selectorStr:        selectorStr,
          simpleSelectorItem: item,
          rulesetNode:        this.ruleset
        };
        selectorItems.push(selectorItem);
      }
    });
  }

  // stable-sort selectors by specificity
  var selectorItemsSorted = stable(selectorItems, function(item1, item2) {
    return SPECIFICITY.compare(item1.selectorStr, item2.selectorStr);
  });

  // apply css to matched elements
  var selectorItem,
      selectedEls;
  for(var selectorItemIndex in selectorItemsSorted) {
    selectorItem = selectorItemsSorted[selectorItemIndex];
    selectedEls  = cssSelect(selectorItem.selectorStr, data, cssSelectOpts);
    if(opts.onlyMatchedOnce && selectedEls.length > 1) {
      // skip selectors that match more than once if option onlyMatchedOnce is enabled
      continue;
    }

    var selectedEl;
    for(var selectedElId in selectedEls) {
      selectedEl = selectedEls[selectedElId];

      // merge element (inline) styles + selector <style/>
      var elInlineStyleAttr = selectedEl.attr('style'),
          elInlineStyles    = elInlineStyleAttr.value,
          inlineCssAst      = csso.parse(elInlineStyles, {context: 'block'});      

      var newInlineCssAst   = csso.parse('', {context: 'block'}); // for empty an css ast (Block context)
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

  // clean up <style/> rulesets without any selectors left
  var styleItemIndex = 0,
      styleItem      = {};
  for(styleItemIndex in styleItems) {
    styleItem = styleItems[styleItemIndex];
    csso.walk(styleItem.cssAst, function(node, item, list) {
      if(node.type === 'Ruleset' &&
         node.selector.selectors.head == null) {
          list.remove(item);
      }
    });
  }

  // update the css selectors / blocks in and <style/>s themselves
  var styleParent;
  for(styleItemIndex in styleItems) {
    styleItem = styleItems[styleItemIndex];
    if(styleItem.cssAst.rules.isEmpty()){
      // clean up now emtpy <style/>s
      styleParent = styleItem.styleEl.parent;
      styleParent.content.splice(styleParent.content.indexOf(styleItem.styleEl), 1);
      continue;
    }

    // update existing <style>s
    styleItem.styleEl.content[0].text = csso.translate(styleItem.cssAst);
  }

  return data;
};
