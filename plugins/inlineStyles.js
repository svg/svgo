'use strict';

const csstree = require('css-tree');
const { querySelectorAll, closestByName } = require('../lib/xast.js');
const cssTools = require('../lib/css-tools');

exports.name = 'inlineStyles';

exports.type = 'full';

exports.active = true;

exports.params = {
  onlyMatchedOnce: true,
  removeMatchedSelectors: true,
  useMqs: ['', 'screen'],
  usePseudos: [''],
};

exports.description = 'inline styles (additional options)';

/**
 * Moves + merges styles from style elements to element styles
 *
 * Options
 *   onlyMatchedOnce (default: true)
 *     inline only selectors that match once
 *
 *   removeMatchedSelectors (default: true)
 *     clean up matched selectors,
 *     leave selectors that hadn't matched
 *
 *   useMqs (default: ['', 'screen'])
 *     what media queries to be used
 *     empty string element for styles outside media queries
 *
 *   usePseudos (default: [''])
 *     what pseudo-classes/-elements to be used
 *     empty string element for all non-pseudo-classes and/or -elements
 *
 * @param {Object} root document element
 * @param {Object} opts plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function (root, opts) {
  // collect <style/>s
  var styleEls = querySelectorAll(root, 'style');

  //no <styles/>s, nothing to do
  if (styleEls.length === 0) {
    return root;
  }

  var styles = [],
    selectors = [];

  for (var styleEl of styleEls) {
    // values other than the empty string or text/css are not used
    if (
      styleEl.attributes.type != null &&
      styleEl.attributes.type !== '' &&
      styleEl.attributes.type !== 'text/css'
    ) {
      continue;
    }
    // skip empty <style/>s or <foreignObject> content.
    if (
      styleEl.children.length === 0 ||
      closestByName(styleEl, 'foreignObject')
    ) {
      continue;
    }

    var cssStr = cssTools.getCssStr(styleEl);

    // collect <style/>s and their css ast
    var cssAst = {};
    try {
      cssAst = csstree.parse(cssStr, {
        parseValue: false,
        parseCustomProperty: false,
      });
    } catch (parseError) {
      // console.warn('Warning: Parse error of styles of <style/> element, skipped. Error details: ' + parseError);
      continue;
    }

    styles.push({
      styleEl: styleEl,
      cssAst: cssAst,
    });

    selectors = selectors.concat(cssTools.flattenToSelectors(cssAst));
  }

  // filter for mediaqueries to be used or without any mediaquery
  var selectorsMq = cssTools.filterByMqs(selectors, opts.useMqs);

  // filter for pseudo elements to be used
  var selectorsPseudo = cssTools.filterByPseudos(selectorsMq, opts.usePseudos);

  // remove PseudoClass from its SimpleSelector for proper matching
  cssTools.cleanPseudos(selectorsPseudo);

  // stable sort selectors
  var sortedSelectors = cssTools.sortSelectors(selectorsPseudo).reverse();

  var selector, selectedEl;

  // match selectors
  for (selector of sortedSelectors) {
    var selectorStr = csstree.generate(selector.item.data),
      selectedEls = null;

    try {
      selectedEls = querySelectorAll(root, selectorStr);
    } catch (selectError) {
      // console.warn('Warning: Syntax error when trying to select \n\n' + selectorStr + '\n\n, skipped. Error details: ' + selectError);
      continue;
    }

    if (selectedEls.length === 0) {
      // nothing selected
      continue;
    }

    selector.selectedEls = selectedEls;
  }

  // apply <style/> styles to matched elements
  for (selector of sortedSelectors) {
    if (!selector.selectedEls) {
      continue;
    }

    if (
      opts.onlyMatchedOnce &&
      selector.selectedEls !== null &&
      selector.selectedEls.length > 1
    ) {
      // skip selectors that match more than once if option onlyMatchedOnce is enabled
      continue;
    }

    // apply <style/> to matched elements
    for (selectedEl of selector.selectedEls) {
      if (selector.rule === null) {
        continue;
      }
      const styleDeclarationList = csstree.parse(
        selectedEl.attributes.style == null ? '' : selectedEl.attributes.style,
        {
          context: 'declarationList',
          parseValue: false,
        }
      );
      const styleDeclarationItems = new Map();
      csstree.walk(styleDeclarationList, {
        visit: 'Declaration',
        enter(node, item) {
          styleDeclarationItems.set(node.property, item);
        },
      });
      // merge declarations
      csstree.walk(selector.rule, {
        visit: 'Declaration',
        enter(ruleDeclaration) {
          // existing inline styles have higher priority
          // no inline styles, external styles,                                    external styles used
          // inline styles,    external styles same   priority as inline styles,   inline   styles used
          // inline styles,    external styles higher priority than inline styles, external styles used
          const matchedItem = styleDeclarationItems.get(
            ruleDeclaration.property
          );
          const ruleDeclarationItem =
            styleDeclarationList.children.createItem(ruleDeclaration);
          if (matchedItem == null) {
            styleDeclarationList.children.append(ruleDeclarationItem);
          } else if (
            matchedItem.data.important !== true &&
            ruleDeclaration.important === true
          ) {
            styleDeclarationList.children.replace(
              matchedItem,
              ruleDeclarationItem
            );
            styleDeclarationItems.set(
              ruleDeclaration.property,
              ruleDeclarationItem
            );
          }
        },
      });
      selectedEl.attributes.style = csstree.generate(styleDeclarationList);
    }

    if (
      opts.removeMatchedSelectors &&
      selector.selectedEls !== null &&
      selector.selectedEls.length > 0
    ) {
      // clean up matching simple selectors if option removeMatchedSelectors is enabled
      selector.rule.prelude.children.remove(selector.item);
    }
  }

  if (!opts.removeMatchedSelectors) {
    return root; // no further processing required
  }

  // clean up matched class + ID attribute values
  for (selector of sortedSelectors) {
    if (!selector.selectedEls) {
      continue;
    }

    if (
      opts.onlyMatchedOnce &&
      selector.selectedEls !== null &&
      selector.selectedEls.length > 1
    ) {
      // skip selectors that match more than once if option onlyMatchedOnce is enabled
      continue;
    }

    for (selectedEl of selector.selectedEls) {
      // class
      const classList = new Set(
        selectedEl.attributes.class == null
          ? null
          : selectedEl.attributes.class.split(' ')
      );
      const firstSubSelector = selector.item.data.children.first();
      if (firstSubSelector.type === 'ClassSelector') {
        classList.delete(firstSubSelector.name);
      }
      if (classList.size === 0) {
        delete selectedEl.attributes.class;
      } else {
        selectedEl.attributes.class = Array.from(classList).join(' ');
      }

      // ID
      if (firstSubSelector.type === 'IdSelector') {
        if (selectedEl.attributes.id === firstSubSelector.name) {
          delete selectedEl.attributes.id;
        }
      }
    }
  }

  // clean up now empty elements
  for (var style of styles) {
    csstree.walk(style.cssAst, {
      visit: 'Rule',
      enter: function (node, item, list) {
        // clean up <style/> atrules without any rulesets left
        if (
          node.type === 'Atrule' &&
          // only Atrules containing rulesets
          node.block !== null &&
          node.block.children.isEmpty()
        ) {
          list.remove(item);
          return;
        }

        // clean up <style/> rulesets without any css selectors left
        if (node.type === 'Rule' && node.prelude.children.isEmpty()) {
          list.remove(item);
        }
      },
    });

    if (style.cssAst.children.isEmpty()) {
      // clean up now emtpy <style/>s
      var styleParentEl = style.styleEl.parentNode;
      styleParentEl.spliceContent(
        styleParentEl.children.indexOf(style.styleEl),
        1
      );

      if (
        styleParentEl.name === 'defs' &&
        styleParentEl.children.length === 0
      ) {
        // also clean up now empty <def/>s
        var defsParentEl = styleParentEl.parentNode;
        defsParentEl.spliceContent(
          defsParentEl.children.indexOf(styleParentEl),
          1
        );
      }

      continue;
    }

    // update existing, left over <style>s
    cssTools.setCssStr(style.styleEl, csstree.generate(style.cssAst));
  }

  return root;
};
