'use strict';

const { visit, detachNodeFromParent, selectAll } = require('./xast.js');

const root = (children) => {
  return { type: 'root', children };
};

const x = (name, attributes, children = []) => {
  return { type: 'element', attributes: attributes || {}, name, children };
};

test('visit enters into nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
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
  expect(entered).toEqual([
    'root',
    'element:g',
    'element:rect',
    'element:circle',
    'element:ellipse',
  ]);
});

test('visit exits from nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
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
  expect(exited).toEqual([
    'element:rect',
    'element:circle',
    'element:g',
    'element:ellipse',
    'root',
  ]);
});

test('visit skips entering children if node is detached', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]);
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
  expect(entered).toEqual(['g', 'ellipse']);
});

test('select elements by tag', () => {
  const ast = root([x('g', null, [x('rect')]), x('rect')]);
  expect(selectAll('rect', ast)).toEqual([x('rect'), x('rect')]);
  expect(selectAll('g', ast)).toEqual([x('g', null, [x('rect')])]);
});

test('select elements by id', () => {
  const ast = root([x('g', null, [x('rect'), x('rect', { id: 'my-id' })])]);
  expect(selectAll('#my-id', ast)).toEqual([x('rect', { id: 'my-id' })]);
});

test('select elements by class', () => {
  const ast = root([
    x('g', null, [
      x('rect', { class: 'some-my-class' }),
      x('rect', { class: 'another-class my-class' }),
    ]),
  ]);
  expect(selectAll('.my-class', ast)).toEqual([
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
  expect(selectAll('[attr=value]', ast)).toEqual([
    x('rect', { attr: 'value' }),
  ]);
  expect(selectAll('[attr="value"]', ast)).toEqual([
    x('rect', { attr: 'value' }),
  ]);
  expect(selectAll("[attr='value']", ast)).toEqual([
    x('rect', { attr: 'value' }),
  ]);
});

test('select elements selector list', () => {
  const ast = root([x('g', null, [x('circle'), x('rect')]), x('rect')]);
  expect(selectAll('rect, circle', ast)).toEqual([
    x('rect'),
    x('rect'),
    x('circle'),
  ]);
});

test('select sibling and child elements', () => {
  const ast = root([
    x('g', null, [
      x('rect', { class: 'inside-g' }),
      x('another-group', null, [x('rect', { class: 'deep-inside-g' })]),
    ]),
    x('rect', { class: 'inside-root' }),
  ]);
  expect(selectAll('g rect', ast)).toEqual([
    x('rect', { class: 'inside-g' }),
    x('rect', { class: 'deep-inside-g' }),
  ]);
});

test('select sibling and child elements', () => {
  const ast = root([
    x('g', null, [
      x('rect', { class: 'inside-g' }),
      x('circle', { class: 'inside-g' }),
      x('ellipse', { class: 'inside-g' }),
      x('another-group', null, [x('rect', { class: 'deep-inside-g' })]),
    ]),
    x('rect', { class: 'inside-root' }),
    x('circle', { class: 'inside-root' }),
    x('ellipse', { class: 'inside-root' }),
  ]);
  expect(selectAll('rect + circle', ast)).toEqual([
    x('circle', { class: 'inside-g' }),
    x('circle', { class: 'inside-root' }),
  ]);
  expect(selectAll('rect + ellipse', ast)).toEqual([]);
  expect(selectAll('rect ~ ellipse', ast)).toEqual([
    x('ellipse', { class: 'inside-g' }),
    x('ellipse', { class: 'inside-root' }),
  ]);
  expect(selectAll('g > rect', ast)).toEqual([
    x('rect', { class: 'inside-g' }),
  ]);
});
