'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'copies styles from <style> to element styles';


var cssParser = require('css'),
    uniq      = require('uniq'),
    lookups   = [];


// property-value pairs from rule ast
var getCssDeclarations = function(cssRule) {
  var properties = [];
  cssRule.declarations.forEach(function(declaration) {
    properties.push({ property: declaration.property, value: declaration.value });
  });
  return properties;
};

var _trim = function(s) {
  return s.trim();
};
// parse class attribute value
var parseClasses = function(item) {
  return item.attr('class').value.split(' ').map(_trim);
};

// looks up styles for selector
var lookupsSelector = function(selector) {
  var declarations = [];
  lookups.forEach(function(lookup) {
    if(lookup.selector == selector) {
      declarations = declarations.concat(lookup.declarations);
    }
  });
  return declarations;
};

// parses css of a css rule (no selector)
var parseRulesCss = function(str) {
  return cssParser
         .parse('.dummy { ' + str + ' }')
         .stylesheet.rules[0];
};

// prepares a full css ast from rules array
var prepareRulesAst = function(rules) {
  var ast =
  { type      : 'stylesheet',
    stylesheet: {
      rules: rules
    }
  };
  return ast;
};

// generates an ast declaration per property-value pair
var prepareDeclarationsAst = function(declarations) {
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
var astToRulesCss = function(ast) {
  var cssDummy = cssParser.stringify(ast, { compress: true });
  return extractRuleCss(cssDummy);
};
// rules to rules css
var stringifyRules = function(rules) {
  var ast = prepareRulesAst(rules);
  return astToRulesCss(ast);
};
// declarations to rules css
var stringifyDeclarations = function(declarations) {

  var dummyRule =
    { type     : 'rule',
      selectors: [ '.dummy' ],
      declarations:
      []
    };
  dummyRule.declarations = prepareDeclarationsAst(declarations);

  return stringifyRules([dummyRule]);
};
// helper to extract rules css from full css
var extractRuleCss = function(str) {
  var strEx = str.match(/\.dummy{(.*)}/i)[1];
  return strEx;
};

// prepares css lookups table for selectors + styles
var generateLookup = function(item) {
  var styleCss            = item.content[0].text,
     styleCssParsed       = cssParser.parse(styleCss),
     styleCssRules        = styleCssParsed.stylesheet.rules,
     styleCssDeclarations = [],
     lookups              = [];

  styleCssRules.forEach(function(styleCssRule) {
    styleCssDeclarations = getCssDeclarations(styleCssRule);
    styleCssRule.selectors.forEach(function(styleSelector) {
      lookups.push({ selector: styleSelector, declarations: styleCssDeclarations });
    });
  });
  return lookups;
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

    if(item.elem && item.isElem('style')) {
      lookups = generateLookup(item);
      return item;
    }

    if(lookups.length > 0 && item.elem) {

      // primitive "selector engine"
      var itemDeclarations = [];

      // .class
      if(item.hasAttr('class')) {
        var classes = parseClasses(item);
        classes.forEach(function(className) {
          itemDeclarations = itemDeclarations.concat(lookupsSelector('.' + className));
        });
      }

      // #id
      if(item.hasAttr('id')) {
        var id = item.attr('id');
          itemDeclarations = itemDeclarations.concat(lookupsSelector('#' + id));
      }


      // existing inline styles
      var itemExistingDeclarations = [];
      if(item.hasAttr('style')) {
        var itemExistingCss       = item.attr('style').value;
        var itemExistingCssParsed = parseRulesCss(itemExistingCss);
        itemExistingDeclarations  = getCssDeclarations(itemExistingCssParsed);
      }


      var newDeclarations     = itemExistingDeclarations.concat(itemDeclarations);
      uniq(newDeclarations, uniqueProperty, true);

      // apply new styles only when necessary
      if(newDeclarations  && newDeclarations.length  > 0 &&
         itemDeclarations && itemDeclarations.length > 0    ) {
        var newCss = stringifyDeclarations(newDeclarations);
        item.attr('style').value = newCss;
      }

    }

    return item;
};

