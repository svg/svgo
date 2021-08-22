'use strict';

const { visit, detachNodeFromParent, querySelectorAll } = require('./xast.js');

const root = (children) => {
  return { type: 'root', children };
};

const x = (name, attributes, children = []) => {
  return { type: 'element', attributes: attributes || {}, name, children };
};

const getAst = () => {
  const ast = {
    type: 'root',
    children: [
      {
        type: 'element',
        name: 'g',
        attributes: {},
        children: [
          {
            type: 'element',
            name: 'rect',
            attributes: {},
            children: [],
          },
          {
            type: 'element',
            name: 'circle',
            attributes: {},
            children: [],
          },
        ],
      },
      {
        type: 'element',
        name: 'ellipse',
        attributes: {},
        children: [],
      },
    ],
  };
  ast.children[0].parentNode = ast;
  ast.children[0].children[0].parentNode = ast.children[0];
  ast.children[0].children[1].parentNode = ast.children[0];
  ast.children[1].parentNode = ast;
  return ast;
};

test('visit enters into nodes', () => {
  const root = getAst();
  const entered = [];
  visit(root, {
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
  expect(entered).toEqual([
    'root',
    'element:g',
    'element:rect',
    'element:circle',
    'element:ellipse',
  ]);
});

test('visit exits from nodes', () => {
  const root = getAst();
  const exited = [];
  visit(root, {
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
  expect(exited).toEqual([
    'element:rect',
    'element:circle',
    'element:g',
    'element:ellipse',
    'root',
  ]);
});

test('visit skips entering children if node is detached', () => {
  const root = getAst();
  const entered = [];
  visit(root, {
    element: {
      enter: (node, parentNode) => {
        entered.push(node.name);
        if (node.name === 'g') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  });
  expect(entered).toEqual(['g', 'ellipse']);
});

test('select elements by tag', () => {
  const ast = root([x('g', null, [x('rect')]), x('rect')]);
  expect(querySelectorAll(ast, 'rect')).toEqual([x('rect'), x('rect')]);
  expect(querySelectorAll(ast, 'g')).toEqual([x('g', null, [x('rect')])]);
});

test('select elements by id', () => {
  const ast = root([x('g', null, [x('rect'), x('rect', { id: 'my-id' })])]);
  expect(querySelectorAll(ast, '#my-id')).toEqual([x('rect', { id: 'my-id' })]);
});

test('select elements by class', () => {
  const ast = root([
    x('g', null, [
      x('rect', { class: 'some-my-class' }),
      x('rect', { class: 'another-class my-class' }),
    ]),
  ]);
  expect(querySelectorAll(ast, '.my-class')).toEqual([
    x('rect', { class: 'another-class my-class' }),
  ]);
});

test('select elements by matching attribute', () => {
  const ast = root([
    x('g', null, [
      x('rect', { attr: 'some-value-here' }),
      x('rect', { attr: 'value' }),
    ]),
  ]);
  expect(querySelectorAll(ast, '[attr=value]')).toEqual([
    x('rect', { attr: 'value' }),
  ]);
  expect(querySelectorAll(ast, '[attr="value"]')).toEqual([
    x('rect', { attr: 'value' }),
  ]);
  expect(querySelectorAll(ast, "[attr='value']")).toEqual([
    x('rect', { attr: 'value' }),
  ]);
});
