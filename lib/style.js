import * as csstree from 'css-tree';
import * as csswhat from 'css-what';
import { syntax } from 'csso';
import { matches } from './xast.js';
import { visit } from './util/visit.js';
import {
  attrsGroups,
  inheritableAttrs,
  presentationNonInheritableGroupAttrs,
} from '../plugins/_collections.js';

const csstreeWalkSkip = csstree.walk.skip;

/**
 * @param {import('css-tree').Rule} ruleNode
 * @param {boolean} dynamic
 * @returns {import('./types.js').StylesheetRule[]}
 */
const parseRule = (ruleNode, dynamic) => {
  /** @type {import('./types.js').StylesheetDeclaration[]} */
  const declarations = [];
  // collect declarations
  ruleNode.block.children.forEach((cssNode) => {
    if (cssNode.type === 'Declaration') {
      declarations.push({
        name: cssNode.property,
        value: csstree.generate(cssNode.value),
        important: cssNode.important === true,
      });
    }
  });

  /** @type {import('./types.js').StylesheetRule[]} */
  const rules = [];
  csstree.walk(ruleNode.prelude, (node) => {
    if (node.type === 'Selector') {
      const newNode = csstree.clone(node);
      let hasPseudoClasses = false;
      csstree.walk(newNode, (pseudoClassNode, item, list) => {
        if (pseudoClassNode.type === 'PseudoClassSelector') {
          hasPseudoClasses = true;
          list.remove(item);
        }
      });
      rules.push({
        specificity: syntax.specificity(node),
        dynamic: hasPseudoClasses || dynamic,
        // compute specificity from original node to consider pseudo classes
        selector: csstree.generate(newNode),
        declarations,
      });
    }
  });

  return rules;
};

/**
 * @param {string} css
 * @param {boolean} dynamic
 * @returns {import('./types.js').StylesheetRule[]}
 */
const parseStylesheet = (css, dynamic) => {
  /** @type {import('./types.js').StylesheetRule[]} */
  const rules = [];
  const ast = csstree.parse(css, {
    parseValue: false,
    parseAtrulePrelude: false,
  });
  csstree.walk(ast, (cssNode) => {
    if (cssNode.type === 'Rule') {
      rules.push(...parseRule(cssNode, dynamic || false));
      return csstreeWalkSkip;
    }
    if (cssNode.type === 'Atrule') {
      if (
        [
          'keyframes',
          '-webkit-keyframes',
          '-o-keyframes',
          '-moz-keyframes',
        ].includes(cssNode.name)
      ) {
        return csstreeWalkSkip;
      }
      csstree.walk(cssNode, (ruleNode) => {
        if (ruleNode.type === 'Rule') {
          rules.push(...parseRule(ruleNode, dynamic || true));
          return csstreeWalkSkip;
        }
      });
      return csstreeWalkSkip;
    }
  });
  return rules;
};

/**
 * @param {string} css
 * @returns {import('./types.js').StylesheetDeclaration[]}
 */
const parseStyleDeclarations = (css) => {
  /** @type {import('./types.js').StylesheetDeclaration[]} */
  const declarations = [];
  const ast = csstree.parse(css, {
    context: 'declarationList',
    parseValue: false,
  });
  csstree.walk(ast, (cssNode) => {
    if (cssNode.type === 'Declaration') {
      declarations.push({
        name: cssNode.property,
        value: csstree.generate(cssNode.value),
        important: cssNode.important === true,
      });
    }
  });
  return declarations;
};

/**
 * @param {import('./types.js').Stylesheet} stylesheet
 * @param {import('./types.js').XastElement} node
 * @param {Map<import('./types.js').XastNode, import('./types.js').XastParent>=} parents
 * @returns {import('./types.js').ComputedStyles}
 */
const computeOwnStyle = (stylesheet, node, parents) => {
  /** @type {import('./types.js').ComputedStyles} */
  const computedStyle = {};
  const importantStyles = new Map();

  // collect attributes
  for (const [name, value] of Object.entries(node.attributes)) {
    if (attrsGroups.presentation.has(name)) {
      computedStyle[name] = { type: 'static', inherited: false, value };
      importantStyles.set(name, false);
    }
  }

  // collect matching rules
  for (const { selector, declarations, dynamic } of stylesheet.rules) {
    if (matches(node, selector, parents)) {
      for (const { name, value, important } of declarations) {
        const computed = computedStyle[name];
        if (computed && computed.type === 'dynamic') {
          continue;
        }
        if (dynamic) {
          computedStyle[name] = { type: 'dynamic', inherited: false };
          continue;
        }
        if (
          computed == null ||
          important === true ||
          importantStyles.get(name) === false
        ) {
          computedStyle[name] = { type: 'static', inherited: false, value };
          importantStyles.set(name, important);
        }
      }
    }
  }

  // collect inline styles
  const styleDeclarations =
    node.attributes.style == null
      ? []
      : parseStyleDeclarations(node.attributes.style);
  for (const { name, value, important } of styleDeclarations) {
    const computed = computedStyle[name];
    if (computed && computed.type === 'dynamic') {
      continue;
    }
    if (
      computed == null ||
      important === true ||
      importantStyles.get(name) === false
    ) {
      computedStyle[name] = { type: 'static', inherited: false, value };
      importantStyles.set(name, important);
    }
  }

  return computedStyle;
};

/**
 * Compares selector specificities.
 * Derived from https://github.com/keeganstreet/specificity/blob/8757133ddd2ed0163f120900047ff0f92760b536/specificity.js#L207
 *
 * @param {import('./types.js').Specificity} a
 * @param {import('./types.js').Specificity} b
 * @returns {number}
 */
export const compareSpecificity = (a, b) => {
  for (let i = 0; i < 4; i += 1) {
    if (a[i] < b[i]) {
      return -1;
    } else if (a[i] > b[i]) {
      return 1;
    }
  }

  return 0;
};

/**
 * @param {import('./types.js').XastRoot} root
 * @returns {import('./types.js').Stylesheet}
 */
export const collectStylesheet = (root) => {
  /** @type {import('./types.js').StylesheetRule[]} */
  const rules = [];
  /** @type {Map<import('./types.js').XastElement, import('./types.js').XastParent>} */
  const parents = new Map();

  visit(root, {
    element: {
      enter: (node, parentNode) => {
        parents.set(node, parentNode);

        if (node.name !== 'style') {
          return;
        }

        if (
          node.attributes.type == null ||
          node.attributes.type === '' ||
          node.attributes.type === 'text/css'
        ) {
          const dynamic =
            node.attributes.media != null && node.attributes.media !== 'all';

          for (const child of node.children) {
            if (child.type === 'text' || child.type === 'cdata') {
              rules.push(...parseStylesheet(child.value, dynamic));
            }
          }
        }
      },
    },
  });
  // sort by selectors specificity
  rules.sort((a, b) => compareSpecificity(a.specificity, b.specificity));
  return { rules, parents };
};

/**
 * @param {import('./types.js').Stylesheet} stylesheet
 * @param {import('./types.js').XastElement} node
 * @returns {import('./types.js').ComputedStyles}
 */
export const computeStyle = (stylesheet, node) => {
  const { parents } = stylesheet;
  const computedStyles = computeOwnStyle(stylesheet, node, parents);
  let parent = parents.get(node);
  while (parent != null && parent.type !== 'root') {
    const inheritedStyles = computeOwnStyle(stylesheet, parent, parents);
    for (const [name, computed] of Object.entries(inheritedStyles)) {
      if (
        computedStyles[name] == null &&
        inheritableAttrs.has(name) &&
        !presentationNonInheritableGroupAttrs.has(name)
      ) {
        computedStyles[name] = { ...computed, inherited: true };
      }
    }
    parent = parents.get(parent);
  }
  return computedStyles;
};

/**
 * Determines if the CSS selector includes or traverses the given attribute.
 *
 * Classes and IDs are generated as attribute selectors, so you can check for if
 * a `.class` or `#id` is included by passing `name=class` or `name=id`
 * respectively.
 *
 * @param {csstree.ListItem<csstree.CssNode> | string} selector
 * @param {string} name
 * @param {?string} value
 * @param {boolean} traversed
 * @returns {boolean}
 */
export const includesAttrSelector = (
  selector,
  name,
  value = null,
  traversed = false,
) => {
  const selectors =
    typeof selector === 'string'
      ? csswhat.parse(selector)
      : csswhat.parse(csstree.generate(selector.data));

  for (const subselector of selectors) {
    const hasAttrSelector = subselector.some((segment, index) => {
      if (traversed) {
        if (index === subselector.length - 1) {
          return false;
        }

        const isNextTraversal = csswhat.isTraversal(subselector[index + 1]);

        if (!isNextTraversal) {
          return false;
        }
      }

      if (segment.type !== 'attribute' || segment.name !== name) {
        return false;
      }

      return value == null ? true : segment.value === value;
    });

    if (hasAttrSelector) {
      return true;
    }
  }

  return false;
};
