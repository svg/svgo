'use strict';

exports.type   = 'full';

exports.active = true;

exports.params = {
  onlyMatchedOnce: true
};

exports.description = 'inline styles (optionally skip selectors that match more than once)';


var cheerioSupport = require('../lib/svgo/cheerio-support'),
    SPECIFICITY    = require('specificity'),
    stable         = require('stable'),
    csso           = require('csso');


/**
  * Moves styles from <style> to element styles
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data, opts) {

  // svgo ast to cheerio ast
  var $ = cheerioSupport.svgoAst2CheerioAst(data);

  var $styles       = $('style');
  var styleItems    = [];
  var selectorItems = [];
  $styles.each(function(si, $style) {
    if($style.children.length == 0) {
      return;
    }

    var cssStr = $style.children[0].data;
    if(cssStr.length == 0) {
      return;
    }

    var cssAst = csso.parse(cssStr, {
                   context: 'stylesheet'
                 });
    styleItems.push({
      $style: $style,
      cssAst: cssAst
    });

    csso.walk(cssAst, function(node, item) {
      // single selector
      if(node.type === 'SimpleSelector') {
        var selectorStr  = csso.translate(node);
        var selectorItem = {
          selectorStr:        selectorStr,
          simpleSelectorItem: item,
          rulesetNode:        this.ruleset
        };
        selectorItems.push(selectorItem);
      }
    });
  });

  // stable sort selectors by specificity
  var selectorItemsSorted = stable(selectorItems, function(item1, item2) {
    return SPECIFICITY.compare(item1.selectorStr, item2.selectorStr);
  });

  for(var selectorItem of selectorItemsSorted) {
    var $selectedEls = $(selectorItem.selectorStr);
    if(opts.onlyMatchedOnce && $selectedEls.length > 1) {
      // skip selectors that match more than once if option onlyMatchedOnce is turned on
      continue;
    }
    $selectedEls.each(function() {
      var $el = $(this);
      var elInlineCss = $el.css();
      csso.walk(selectorItem.rulesetNode, function(node) {
        if(node.type !== 'Declaration') {
          return;
        }
        var propertyName  = node.property.name,
            propertyValue = csso.translate(node.value);
        $el.css(propertyName, propertyValue);
      });
      // re-apply the inline css (to preserve specificity):
      $el.css(elInlineCss);
    });

    if($selectedEls.length > 0) {
      // clean up matching simple selectors
      selectorItem.rulesetNode.selector.selectors.remove(selectorItem.simpleSelectorItem);
    }
  }


  var styleItem = {};

  // clean up rulesets without any selectors left
  for(styleItem of styleItems) {
    csso.walk(styleItem.cssAst, function(node, item, list) {
      if(node.type === 'Ruleset' &&
         node.selector.selectors.head == null) {
          list.remove(item);
      }
    });
  }

  // update the css selectors / blocks
  for(styleItem of styleItems) {
    // clean up now emtpy style elements
    if(styleItem.cssAst.rules.isEmpty()){
      $styles.remove(styleItem.$style);
      continue;
    }
    styleItem.$style.children[0].data = csso.translate(styleItem.cssAst);
  }


  // cheerio ast back to svgo ast
  var dataNew = cheerioSupport.cheerioAst2SvgoAst($);
  return dataNew;
};
