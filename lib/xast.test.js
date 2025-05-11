import { detachNodeFromParent } from './xast.js';
import { visit, visitSkip } from './util/visit.js';

/**
 * @param {import('./types.js').XastElement[]} children
 * @returns {import('./types.js').XastRoot}
 */
const root = (children) => {
  return { type: 'root', children };
};

/**
 * @param {string} name
 * @param {?Record<string, string>} attrs
 * @param {import('./types.js').XastElement[]} children
 * @returns {import('./types.js').XastElement}
 */
const x = (name, attrs = null, children = []) => {
  return { type: 'element', name, attributes: attrs || {}, children };
};

test('visit enters into nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
  /** @type {string[]} */
  const entered = [];
  visit(ast, {
    root: {
      enter: (node) => {
        entered.push(node.type);
      },
    },
    element: {
      enter: (node) => {
        entered.push(`${node.type}:${node.name}`);
      },
    },
  });
  expect(entered).toStrictEqual([
    'root',
    'element:g',
    'element:rect',
    'element:circle',
    'element:ellipse',
  ]);
});

test('visit exits from nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
  /** @type {string[]} */
  const exited = [];
  visit(ast, {
    root: {
      exit: (node) => {
        exited.push(node.type);
      },
    },
    element: {
      exit: (node) => {
        exited.push(`${node.type}:${node.name}`);
      },
    },
  });
  expect(exited).toStrictEqual([
    'element:rect',
    'element:circle',
    'element:g',
    'element:ellipse',
    'root',
  ]);
});

test('visit skips entering children if node is detached', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
  /** @type {string[]} */
  const entered = [];
  visit(ast, {
    element: {
      enter: (node, parentNode) => {
        entered.push(node.name);
        if (node.name === 'g') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  });
  expect(entered).toStrictEqual(['g', 'ellipse']);
  expect(ast).toStrictEqual(root([x('ellipse')]));
});

test('visit skips entering children when symbol is passed', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
  /** @type {string[]} */
  const entered = [];
  visit(ast, {
    element: {
      enter: (node) => {
        entered.push(node.name);
        if (node.name === 'g') {
          return visitSkip;
        }
      },
    },
  });
  expect(entered).toStrictEqual(['g', 'ellipse']);
  expect(ast).toStrictEqual(
    root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]),
  );
});
