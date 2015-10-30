'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'copies styles from <style> to element styles';


var cssParser   = require('css'),
    uniq        = require('uniq'),
    removeValue = require('remove-value'),
    lookupRules = [],
    svgElem     = {},
    styleCssAst = {};


// declarations (property-value paris) from rule
var getCssDeclarationsFromRule  = function(cssRule) {
  var declarations = [];
  cssRule.declarations.forEach(function(declaration) {
    declarations.push({ property: declaration.property, value: declaration.value });
  });
  return declarations;
};
// declarations from multiple rules
var getCssDeclarationsFromRules = function(cssRules) {
  var declarations = [];
  cssRules.forEach(function(cssRule) {
    declarations = declarations.concat(getCssDeclarationsFromRule(cssRule));
  });
  return declarations;
};

var _trim = function(s) {
  return s.trim();
};
// parse class attribute value
var parseClasses = function(item) {
  return item.attr('class').value.split(' ').map(_trim);
};

// looks up style rules for passed selector
var lookupCssSelector = function(selector) {
  var matchedRules = [];
  lookupRules.forEach(function(lookupRule) {
    if(lookupRule.selector == selector) {
      matchedRules = matchedRules.concat(lookupRule);
    }
  });
  return matchedRules;
};

var processCssSelector = function(selectorFind) {
  var matchedRules = lookupCssSelector(selectorFind);
  cleanupSelectorAst(selectorFind, matchedRules);
  return getCssDeclarationsFromRules(matchedRules);
};

var cleanupSelectorAst = function(selectorFind, matchedRules) {
  matchedRules.map(function(matchedRule) {
    removeValue(matchedRule.astRule.selectors, selectorFind); // (global variable)
    return matchedRule;
  });
  return;
};

var cleanupRulesAst = function(rulesAst) {
  return rulesAst.filter(function(matchedRule) { // (global variable)
    return(matchedRule.type != 'rule' || matchedRule.selectors.length > 0);
  });
};


// parses css of a css rule (no selector)
var parseRulesCss = function(str) {
  return cssParser
         .parse('.dummy { ' + str + ' }')
         .stylesheet.rules[0];
};

// prepares a full css ast from rules array
var prepareCssRulesAst = function(rules) {
  var ast =
  { type      : 'stylesheet',
    stylesheet: {
      rules: rules
    }
  };
  return ast;
};

// generates an ast declaration per property-value pair
var prepareCssDeclarationsAst = function(declarations) {
  var declarationsAst = [],
      declarationAst  = {};

  declarations.forEach(function(declaration) {
    declarationAst = { type    : 'declaration',
                       property: declaration.property,
                       value   : declaration.value
                     };
    declarationsAst.push(declarationAst);
  });

  return declarationsAst;
};

// ast to rules css
var cssAstToRulesCss = function(ast) {
  var cssDummy = cssParser.stringify(ast, { compress: true });
  return extractRuleCss(cssDummy);
};
// rules to rules css
var stringifyCssRules = function(rules) {
  var ast = prepareCssRulesAst(rules);
  return cssAstToRulesCss(ast);
};
// declarations to rules css
var stringifyCssDeclarations = function(declarations) {

  var dummyRule =
    { type     : 'rule',
      selectors: [ '.dummy' ],
      declarations:
      []
    };
  dummyRule.declarations = prepareCssDeclarationsAst(declarations);

  return stringifyCssRules([dummyRule]);
};
// helper to extract rules css from full css
var extractRuleCss = function(str) {
  var strEx = str.match(/\.dummy{(.*)}/i)[1];
  return strEx;
};


// returns true when two compared declarations got the same property (name)
var uniqueProperty = function(a,b) {
  return (a.property == b.property) ? 0 : 1;
};


/**
 * Copy styles from <style> to element styles.
 *
 * (1) run this plugin before the removeStyleElement plugin
 * (2) this plugin won't remove the <style> element,
 *     use removeStyleElement after this plugin
 * (3) run convertStyleToAttrs after this plugin
 * (4) minify styles in <style> if necessary
 *     before this plugin (minified = "computed" styles)
 * (5) this plugin currently works only with class and id selectors,
 *     advanced css selectors (e.g. :nth-child) aren't currently supported
 * (6) inline styles will be written after the styles from <style>
 * (7) classes are inlined by the order of their names in class element attribute
 *
 * http://www.w3.org/TR/SVG/styling.html#StyleElement
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(item) {

    // TODO: although quite rarely used, add support for multiple <style> elements
    if(item.elem && item.isElem('style')) {
      // fetch global styles from style element
          svgElem              = item;
      var styleCss             = item.content[0].text;
          styleCssAst          = cssParser.parse(styleCss);

      var styleCssRules        = styleCssAst.stylesheet.rules,
          styleCssDeclarations = [];

      styleCssRules.forEach(function(styleCssRule) {
        if(styleCssRule.type != 'rule') { return; } // skip anything nested like mediaqueries

        styleCssDeclarations = getCssDeclarationsFromRule(styleCssRule);
        styleCssRule.selectors.forEach(function(styleSelector) {
          lookupRules.push({
            selector:     styleSelector,
            declarations: styleCssDeclarations,
            astRule:      styleCssRule
          });
        });
      });
      return item;
    }


    if(lookupRules.length > 0 && item.elem) {

      // primitive "selector engine"
      var itemDeclarations = [];

      // #id
      if(item.hasAttr('id')) {
        var idName       = item.attr('id').value;
        var selectorFind = '#' + idName;
        itemDeclarations = itemDeclarations.concat(processCssSelector(selectorFind));
      }

      // .class
      if(item.hasAttr('class')) {
        var classNames     = parseClasses(item);
        classNames.forEach(function(className) {
          var selectorFind = '.' + className;
          itemDeclarations = itemDeclarations.concat(processCssSelector(selectorFind));
        });
      }

      styleCssAst.stylesheet.rules = cleanupRulesAst(styleCssAst.stylesheet.rules);


      // existing inline styles
      // TODO: Opportunity for cleaning up global styles that converge with style attribute stlyes?
      var itemExistingDeclarations = [];
      if(item.hasAttr('style')) {
        var itemExistingCss      = item.attr('style').value;
        var itemExistingCssAst   = parseRulesCss(itemExistingCss);
        itemExistingDeclarations = getCssDeclarationsFromRule(itemExistingCssAst);
      }


      var newDeclarations = itemExistingDeclarations.concat(itemDeclarations);
      uniq(newDeclarations, uniqueProperty, true);

      // apply new styles only when necessary
      if(newDeclarations  && newDeclarations.length  > 0 &&
         itemDeclarations && itemDeclarations.length > 0    ) {
        var newCss = stringifyCssDeclarations(newDeclarations);
        item.attr('style').value = newCss;
      }

      var newStyleCss = cssParser.stringify(styleCssAst, { compress: true });
      svgElem.content[0].text = newStyleCss;
    }

    return item;
};
