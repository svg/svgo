'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'copies styles from <style> to element styles';


var cssParser         = require('css'),
    inlineStylesParse = require('inline-styles-parse'),
    uniq              = require('uniq'),
    removeValue       = require('remove-value'),

    styleElements     = [],
    elementsLookup    = [],
    matchedElements   = [];


/**
  * Copy styles from <style> to element styles.
  *
  * @author strarsis <strarsis@gmail.com>
  */
exports.fn = function(data) {


    // Tree traversal

    // is element content not empty?
    function elemHasContent(item) {
      return (item.content && item.content[0] && item.content[0].text && item.content[0].text.length > 0);
    }

    // is element styles attribute not empty?
    function elemHasStyles(item) {
      return (item.hasAttr('class') && item.attr('style').value.length > 0);
    }

    // is this element a style element?
    function isValidStyleElem(item) {
      if(item.hasAttr('scoped')) {
        console.log('Warning: Scoped styles aren\'t supported yet by this plugin and are skipped.');
        return false;
      }
      return (item.isElem('style') && elemHasContent(item));
    }


    // HTML helpers

    // Parses comma separated parse names into array
    var parseClassNames = function(classAttrValue) {
        return classAttrValue.split(' ').map(_trim);
    };
    // Helper used by parseClassNames
    var _trim = function(s) {
        return s.trim();
    };


    // Scan

    // Build a list of all style elements
    function scanStyleElem(item) {
      styleElements.push(item);
      return;
    }

    // Build a flattened look up list: element classes/ID -> element
    function scanElem(item) {
      // flatten item by class/id selectors
      if(item.hasAttr('class')) {

        // classes
        var classNames = parseClassNames(item.attr('class').value);
        classNames.forEach(function(className) {
          elementsLookup['.' + className] = item;
        });
      }

      // id
      if(item.hasAttr('id')) {
        elementsLookup['#' + item.attr('id').value] = item;
      }

      return;
    }


    // CSS AST/parsing low level helpers

    // parses full CSS to a stylesheet CSS AST
    function parseCss(css) {
      return cssParser.parse(css);
    }
    // parses inline CSS to a stylesheet CSS AST
    function parseInlineCss(inlineCss) {
      return parseCss(
        inlineStylesParse.declarationsToRule(inlineCss)
      );
    }

    // stringifies a declarations CSS AST to inline CSS AST
    function declarationsAstToInlineCss(astDeclarations) {
      var stylesheetAst = declarationsAstToStylesheetAst(astDeclarations);
      var inlineCss     = astToInlineCss(stylesheetAst);
      return inlineCss;
    }
    // stringifies a stylsheet CSS AST back to inline CSS
    function astToInlineCss(stylesheetAst) {
      return inlineStylesParse.ruleToDeclarations(
        stringifyAst(stylesheetAst)
      );
    }

    // helper that stringifies a full stylesheet CSS AST to full CSS
    function stringifyAst(ast) {
      return cssParser.stringify(
        ast,
        { compress: true }
      );
    }

    // dummy templates
    var dummyAstStylesheet = {
      type:       'stylesheet',
      stylesheet: {
        rules:    []
      }
    };
    var dummyAstRule = {
      type:         'rule',
      selectors:    [ '.dummy' ],
      declarations: []
    };
    // builds a stylesheet CSS AST from declarations CSS AST
    function declarationsAstToStylesheetAst(astDeclarations) {
      var astStylesheet      = dummyAstStylesheet;
      var astRule            = dummyAstRule;

      astRule.declarations   = astDeclarations;
      astStylesheet.stylesheet.rules[0] = astRule;

      return astStylesheet;
    }


    // CSS from elements

    // Gets the CSS AST of the CSS of a style element
    function getStyleCss(styleElement) {
      var styleCss = styleElement.content[0].text;
      var styleAst = parseCss(styleCss);
      return styleAst;
    }

    // Gets the CSS AST of the inline CSS of an element
    function getInlineCss(element) {
      var elementInlineCss = element.attr('style').value;
      var styleAst = parseInlineCss(elementInlineCss);
      return styleAst;
    }


    // Lookup/matching

    // is this AST rule a top rule or something nested (like a mediaquery?)
    function isTopRule(astRule) {
      return astRule.type == 'rule';
    }

    // look up all style elements previously scanned
    // Global variables used: styleElements
    function lookupStyleElements() {
      styleElements.forEach(lookupStyleElement);
    }

    // look up one style element (called by lookupStyleElements for each element)
    // Global variables used: elementsLookup
    function lookupStyleElement(styleElement) {
      var stylesAst = getStyleCss(styleElement);

      styleElement.stylesAst = stylesAst; // reference to element

      var astRules  = stylesAst.stylesheet.rules;
      astRules.forEach(function(astRule) {
        if(!isTopRule(astRule)) { // skip nested structures
          return false;
        }
        // Iterate over all selectors in this CSS AST rule
        astRule.selectors.forEach(function(selectorFind) {
          // Try to match a looked up element by this selector
          var matchedElement = elementsLookup[selectorFind];
          if(!matchedElement) {
            return false;
          }

          // Strip matching selector (a reference to original selector in styles Ast)
          removeValue(astRule.selectors, selectorFind);

          restyleMatchedElement(astRule, matchedElement);
          return;
        });
      });
      return;
    }

    // Handle an element matched by a CSS AST Rule
    // Global variables used: matchedElements
    function restyleMatchedElement(styleAstRule, matchedElement) {

      // Additionally parse inline CSS from the element (if there is any inline CSS)
      var inlineAstRule = { declarations: [] };
      if(elemHasStyles(matchedElement)) {
        inlineAstRule = getInlineCss(matchedElement).stylesheet.rules[0];
      }

      // Merge inline CSS and looked up CSS
      var newAstDeclarations =
                 styleAstRule.declarations   // inline styles last for precedence
        .concat(inlineAstRule.declarations);

      // Store the new (inlined + existing inline) CSS
      // We don't stringify at match because this would be unnecessarily costly,
      // when there are more selectors that match.
      if(!matchedElement.newAstDeclarations)  matchedElement.newAstDeclarations = [];
          matchedElement.newAstDeclarations = matchedElement.newAstDeclarations.concat(newAstDeclarations);

      matchedElements.push(matchedElement);

      return;
    }

    // Apply the new styles to their matched elements
    // Global variables used: matchedElements
    function reapplyElementStyles() {
      var matchedElementsUniq  = uniq(matchedElements);
      matchedElementsUniq.forEach(function(matchedElement) {
        var newAstDeclarations = matchedElement.newAstDeclarations;
        delete matchedElement.newAstDeclarations; // clean up XML AST

        var newInlineCss = declarationsAstToInlineCss(newAstDeclarations);
        // Note: We don't minifiy or deduplicate anything here,
        // this is not the scope of this plugin.
        // Use minifyStyles plugin after this one.
        matchedElement.attr('style').value = newInlineCss;

        return;
      });

      return;
    }

    // Is this CSS AST rule without any selectors (empty selectors)?
    function isRuleWithoutSelectors(astRule) {
      return !(astRule.selectors && astRule.selectors.length > 0);
    }

    // Apply the stripped down styles on the styles elements
    // Global variables used: styleElements
    function reapplyStyleStyles() {
      styleElements.forEach(function(styleElement) {

        var styleElementAst = styleElement.stylesAst;
        delete styleElement.stylesAst; // clean up XML AST (2)

        cleanupStyleRules(styleElementAst);

        var newStyleCss = stringifyAst(styleElementAst);
        styleElement.content[0].text = newStyleCss;
      });
      return;
    }

    // Clean up style rules
    function cleanupStyleRules(styleElementAst) {
      // clean up rules that were stripped down to no selectors at all
      styleElementAst.stylesheet.rules.forEach(function(styleAstRule) {
        if(!isTopRule(styleAstRule)) {
          return; // skip
        }

        if(isRuleWithoutSelectors(styleAstRule)) {
          removeValue(styleElementAst.stylesheet.rules, styleAstRule);
        }
        return;
      });
    }


    // Recursion

    // Default: Always select an item
    function selectAll() {
      return true;
    }
    // Default: Always further recurse an item
    function alwaysRecurse() {
      return true;
    }

    /**
     * Recursively traverses the HTML AST
     *
     * @param {Array}    items input items
     * @param {Function} fn for processing an item
     * @param {Function} fn for selecting an item
     * @param {Function} fn for recursion check
     *
     * @return {Array} output items
     */
    function monkeys(items, callFn, selectFn, recurseFn) {
      if(selectFn  === undefined) { selectFn  = selectAll;     }
      if(recurseFn === undefined) { recurseFn = alwaysRecurse; }

        var      i = 0,
            length = items.content.length;

        while(i < length) {

            var item = items.content[i];

            if ( selectFn(item) ) {
              callFn(item);
            }

            // recurse
            if(item.content && item.content.length > 0 &&
               recurseFn(item)              ) {
              monkeys(item, callFn, selectFn, recurseFn);
            }
            i++;
        }

        return items;

    }


    // Main

    // Scan all svg elements
    monkeys(data, scanStyleElem, isValidStyleElem);
    // Create look up map of elements and their classes/ids
    monkeys(data, scanElem);

    // Parse styles from scanned style elements and try to look up from map
    lookupStyleElements();

    // Finally apply the newly prepared styles on the matched elements
    reapplyElementStyles();

    // Apply stripped down styles
    reapplyStyleStyles();


    return data;
};
