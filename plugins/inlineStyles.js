'use strict';

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 * @typedef {import('../lib/types').XastParent} XastParent
 */

const csstree = require('css-tree');
const {
  // @ts-ignore internal api
  syntax: { specificity },
} = require('csso');
const {
  visitSkip,
  querySelectorAll,
  detachNodeFromParent,
} = require('../lib/xast.js');
const { compareSpecificity, includesAttrSelector } = require('../lib/style');
const { attrsGroups } = require('./_collections');

exports.name = 'inlineStyles';
exports.description = 'inline styles (additional options)';

/**
 * Merges styles from style nodes into inline styles.
 *
 * @type {import('./plugins-types').Plugin<'inlineStyles'>}
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = (root, params) => {
  const {
    onlyMatchedOnce = true,
    removeMatchedSelectors = true,
    useMqs = ['', 'screen'],
    usePseudos = [''],
  } = params;

  /**
   * @type {Array<{ node: XastElement, parentNode: XastParent, cssAst: csstree.StyleSheet }>}
   */
  const styles = [];
  /**
   * @type {Array<{
   *   node: csstree.Selector,
   *   item: csstree.ListItem<csstree.CssNode>,
   *   rule: csstree.Rule,
   *   matchedElements?: Array<XastElement>
   * }>}
   */
  let selectors = [];

  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'foreignObject') {
          return visitSkip;
        }
        if (node.name !== 'style' || node.children.length === 0) {
          return;
        }
        if (
          node.attributes.type != null &&
          node.attributes.type !== '' &&
          node.attributes.type !== 'text/css'
        ) {
          return;
        }

        const cssText = node.children
          .filter((child) => child.type === 'text' || child.type === 'cdata')
          // @ts-ignore
          .map((child) => child.value)
          .join('');

        /** @type {?csstree.CssNode} */
        let cssAst = null;
        try {
          cssAst = csstree.parse(cssText, {
            parseValue: false,
            parseCustomProperty: false,
          });
        } catch {
          return;
        }
        if (cssAst.type === 'StyleSheet') {
          styles.push({ node, parentNode, cssAst });
        }

        // collect selectors
        csstree.walk(cssAst, {
          visit: 'Selector',
          enter(node, item) {
            const atrule = this.atrule;
            const rule = this.rule;
            if (rule == null) {
              return;
            }

            // skip media queries not included into useMqs param
            let mediaQuery = '';
            if (atrule != null) {
              mediaQuery = atrule.name;
              if (atrule.prelude != null) {
                mediaQuery += ` ${csstree.generate(atrule.prelude)}`;
              }
            }
            if (!useMqs.includes(mediaQuery)) {
              return;
            }

            /**
             * @type {Array<{
             *   item: csstree.ListItem<csstree.CssNode>,
             *   list: csstree.List<csstree.CssNode>
             * }>}
             */
            const pseudos = [];
            if (node.type === 'Selector') {
              node.children.forEach((childNode, childItem, childList) => {
                if (
                  childNode.type === 'PseudoClassSelector' ||
                  childNode.type === 'PseudoElementSelector'
                ) {
                  pseudos.push({ item: childItem, list: childList });
                }
              });
            }

            // skip pseudo classes and pseudo elements not includes into usePseudos param
            const pseudoSelectors = csstree.generate({
              type: 'Selector',
              children: new csstree.List().fromArray(
                pseudos.map((pseudo) => pseudo.item.data)
              ),
            });

            if (!usePseudos.includes(pseudoSelectors)) {
              return;
            }

            // remove pseudo classes and elements to allow querySelector match elements
            // TODO this is not very accurate since some pseudo classes like first-child
            // are used for selection
            for (const pseudo of pseudos) {
              pseudo.list.remove(pseudo.item);
            }

            selectors.push({ node, item, rule });
          },
        });
      },
    },

    root: {
      exit: () => {
        if (styles.length === 0) {
          return;
        }
        const sortedSelectors = selectors
          .slice()
          .sort((a, b) => {
            const aSpecificity = specificity(a.item.data);
            const bSpecificity = specificity(b.item.data);
            return compareSpecificity(aSpecificity, bSpecificity);
          })
          .reverse();

        for (const selector of sortedSelectors) {
          // match selectors
          const selectorText = csstree.generate(selector.item.data);
          /** @type {Array<XastElement>} */
          const matchedElements = [];
          try {
            for (const node of querySelectorAll(root, selectorText)) {
              if (node.type === 'element') {
                matchedElements.push(node);
              }
            }
          } catch (selectError) {
            continue;
          }
          // nothing selected
          if (matchedElements.length === 0) {
            continue;
          }

          // apply styles to matched elements
          // skip selectors that match more than once if option onlyMatchedOnce is enabled
          if (onlyMatchedOnce && matchedElements.length > 1) {
            continue;
          }

          // apply <style/> to matched elements
          for (const selectedEl of matchedElements) {
            const styleDeclarationList = csstree.parse(
              selectedEl.attributes.style ?? '',
              {
                context: 'declarationList',
                parseValue: false,
              }
            );
            if (styleDeclarationList.type !== 'DeclarationList') {
              continue;
            }
            const styleDeclarationItems = new Map();

            /** @type {csstree.ListItem<csstree.CssNode>} */
            let firstListItem;

            csstree.walk(styleDeclarationList, {
              visit: 'Declaration',
              enter(node, item) {
                if (firstListItem == null) {
                  firstListItem = item;
                }

                styleDeclarationItems.set(node.property.toLowerCase(), item);
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
                const property = ruleDeclaration.property;

                if (
                  attrsGroups.presentation.includes(property) &&
                  !selectors.some((selector) =>
                    includesAttrSelector(selector.item, property)
                  )
                ) {
                  delete selectedEl.attributes[property];
                }

                const matchedItem = styleDeclarationItems.get(property);
                const ruleDeclarationItem =
                  styleDeclarationList.children.createItem(ruleDeclaration);
                if (matchedItem == null) {
                  styleDeclarationList.children.insert(
                    ruleDeclarationItem,
                    firstListItem
                  );
                } else if (
                  matchedItem.data.important !== true &&
                  ruleDeclaration.important === true
                ) {
                  styleDeclarationList.children.replace(
                    matchedItem,
                    ruleDeclarationItem
                  );
                  styleDeclarationItems.set(property, ruleDeclarationItem);
                }
              },
            });

            const newStyles = csstree.generate(styleDeclarationList);
            if (newStyles.length !== 0) {
              selectedEl.attributes.style = newStyles;
            }
          }

          if (
            removeMatchedSelectors &&
            matchedElements.length !== 0 &&
            selector.rule.prelude.type === 'SelectorList'
          ) {
            // clean up matching simple selectors if option removeMatchedSelectors is enabled
            selector.rule.prelude.children.remove(selector.item);
          }
          selector.matchedElements = matchedElements;
        }

        // no further processing required
        if (!removeMatchedSelectors) {
          return;
        }

        // clean up matched class + ID attribute values
        for (const selector of sortedSelectors) {
          if (selector.matchedElements == null) {
            continue;
          }

          if (onlyMatchedOnce && selector.matchedElements.length > 1) {
            // skip selectors that match more than once if option onlyMatchedOnce is enabled
            continue;
          }

          for (const selectedEl of selector.matchedElements) {
            // class
            const classList = new Set(
              selectedEl.attributes.class == null
                ? null
                : selectedEl.attributes.class.split(' ')
            );

            for (const child of selector.node.children) {
              if (
                child.type === 'ClassSelector' &&
                !selectors.some((selector) =>
                  includesAttrSelector(selector.item, 'class', child.name, true)
                )
              ) {
                classList.delete(child.name);
              }
            }

            if (classList.size === 0) {
              delete selectedEl.attributes.class;
            } else {
              selectedEl.attributes.class = Array.from(classList).join(' ');
            }

            // ID
            const firstSubSelector = selector.node.children.first;
            if (
              firstSubSelector?.type === 'IdSelector' &&
              selectedEl.attributes.id === firstSubSelector.name &&
              !selectors.some((selector) =>
                includesAttrSelector(
                  selector.item,
                  'id',
                  firstSubSelector.name,
                  true
                )
              )
            ) {
              delete selectedEl.attributes.id;
            }
          }
        }

        for (const style of styles) {
          csstree.walk(style.cssAst, {
            visit: 'Rule',
            enter: function (node, item, list) {
              // clean up <style/> rulesets without any css selectors left
              if (
                node.type === 'Rule' &&
                node.prelude.type === 'SelectorList' &&
                node.prelude.children.isEmpty
              ) {
                list.remove(item);
              }
            },
          });

          // csstree v2 changed this type
          if (style.cssAst.children.isEmpty) {
            // remove emtpy style element
            detachNodeFromParent(style.node, style.parentNode);
          } else {
            // update style element if any styles left
            const firstChild = style.node.children[0];
            if (firstChild.type === 'text' || firstChild.type === 'cdata') {
              firstChild.value = csstree.generate(style.cssAst);
            }
          }
        }
      },
    },
  };
};
