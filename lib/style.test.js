'use strict';

/**
 * @typedef {import('./types').XastParent} XastParent
 * @typedef {import('./types').XastElement} XastElement
 */

const { collectStylesheet, computeStyle } = require('./style.js');
const { visit } = require('./xast.js');
const { parseSvg } = require('./parser.js');

/**
 * @type {(node: XastParent, id: string) => XastElement}
 */
const getElementById = (node, id) => {
  /**
   * @type {null | XastElement}
   */
  let matched = null;
  visit(node, {
    element: {
      enter: (node) => {
        if (node.attributes.id === id) {
          matched = node;
        }
      },
    },
  });
  if (matched == null) {
    throw Error('Assert node');
  }
  return matched;
};

it('collects styles', () => {
  const root = parseSvg(`
      <svg>
        <rect id="class" class="a" />
        <rect id="two-classes" class="b a" />
        <rect id="attribute" fill="purple" />
        <rect id="inline-style" style="fill: grey;" />
        <g fill="yellow">
          <rect id="inheritance" />
          <g style="fill: blue;">
            <g>
              <rect id="nested-inheritance" />
            </g>
          </g>
        </g>
        <style>
          .a { fill: red; }
        </style>
        <style>
          <![CDATA[
            .b { fill: green; stroke: black; }
          ]]>
        </style>
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(computeStyle(stylesheet, getElementById(root, 'class'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'red' },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'two-classes'))).toEqual(
    {
      fill: { type: 'static', inherited: false, value: 'green' },
      stroke: { type: 'static', inherited: false, value: 'black' },
    }
  );
  expect(computeStyle(stylesheet, getElementById(root, 'attribute'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'purple' },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'inline-style'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'grey' },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'inheritance'))).toEqual(
    {
      fill: { type: 'static', inherited: true, value: 'yellow' },
    }
  );
  expect(
    computeStyle(stylesheet, getElementById(root, 'nested-inheritance'))
  ).toEqual({
    fill: { type: 'static', inherited: true, value: 'blue' },
  });
});

it('prioritizes different kinds of styles', () => {
  const root = parseSvg(`
      <svg>
        <style>
          g > .a, .c { fill: red; }
          .a { fill: green; }
          .b { fill: blue; }
        </style>
        <g fill="yellow">
          <rect id="complex-selector" class="a" />
          <rect id="override-selector" class="c b" />
          <rect id="attribute-over-inheritance" fill="orange" />
          <rect id="style-rule-over-attribute" class="b" fill="grey" />
          <rect id="inline-style-over-style-rule" style="fill: purple;" class="b" />
        </g>
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(
    computeStyle(stylesheet, getElementById(root, 'complex-selector'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'red' },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'override-selector'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'blue' },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'attribute-over-inheritance'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'orange' },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'style-rule-over-attribute'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'blue' },
  });
  expect(
    computeStyle(
      stylesheet,
      getElementById(root, 'inline-style-over-style-rule')
    )
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'purple' },
  });
});

it('prioritizes important styles', () => {
  const root = parseSvg(`
      <svg>
        <style>
          g > .a { fill: red; }
          .b { fill: green !important; }
        </style>
        <rect id="complex-selector" class="a b" />
        <rect id="style-rule-over-inline-style" style="fill: orange;" class="b" />
        <rect id="inline-style-over-style-rule" style="fill: purple !important;" class="b" />
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(
    computeStyle(stylesheet, getElementById(root, 'complex-selector'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'green' },
  });
  expect(
    computeStyle(
      stylesheet,
      getElementById(root, 'style-rule-over-inline-style')
    )
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'green' },
  });
  expect(
    computeStyle(
      stylesheet,
      getElementById(root, 'inline-style-over-style-rule')
    )
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'purple' },
  });
});

it('treats at-rules and pseudo-classes as dynamic styles', () => {
  const root = parseSvg(`
      <svg>
        <style>
          @media screen {
            .a { fill: red; }
          }
          .b:hover { fill: green; }
          .c { fill: blue; }
          .d { fill: purple; }
        </style>
        <rect id="media-query" class="a d" style="fill: orange;" />
        <rect id="hover" class="b" style="fill: yellow;" />
        <g class="a">
          <rect id="inherited" />
          <rect id="inherited-overriden" class="c" />
        </g>
        <rect id="static" class="c" style="fill: black" />
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(computeStyle(stylesheet, getElementById(root, 'media-query'))).toEqual(
    {
      fill: { type: 'dynamic', inherited: false },
    }
  );
  expect(computeStyle(stylesheet, getElementById(root, 'hover'))).toEqual({
    fill: { type: 'dynamic', inherited: false },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'inherited'))).toEqual({
    fill: { type: 'dynamic', inherited: true },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'inherited-overriden'))
  ).toEqual({
    fill: { type: 'static', inherited: false, value: 'blue' },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'static'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'black' },
  });
});

it('considers <style> media attribute', () => {
  const root = parseSvg(`
      <svg>
        <style media="print">
          @media screen {
            .a { fill: red; }
          }
          .b { fill: green; }
        </style>
        <style media="all">
          .c { fill: blue; }
        </style>
        <rect id="media-query" class="a" />
        <rect id="kinda-static" class="b" />
        <rect id="static" class="c" />
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(computeStyle(stylesheet, getElementById(root, 'media-query'))).toEqual(
    {
      fill: { type: 'dynamic', inherited: false },
    }
  );
  expect(
    computeStyle(stylesheet, getElementById(root, 'kinda-static'))
  ).toEqual({
    fill: { type: 'dynamic', inherited: false },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'static'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'blue' },
  });
});

it('ignores <style> with invalid type', () => {
  const root = parseSvg(`
      <svg>
        <style type="text/css">
          .a { fill: red; }
        </style>
        <style type="">
          .b { fill: green; }
        </style>
        <style type="text/invalid">
          .c { fill: blue; }
        </style>
        <rect id="valid-type" class="a" />
        <rect id="empty-type" class="b" />
        <rect id="invalid-type" class="c" />
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(computeStyle(stylesheet, getElementById(root, 'valid-type'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'red' },
  });
  expect(computeStyle(stylesheet, getElementById(root, 'empty-type'))).toEqual({
    fill: { type: 'static', inherited: false, value: 'green' },
  });
  expect(
    computeStyle(stylesheet, getElementById(root, 'invalid-type'))
  ).toEqual({});
});

it('ignores keyframes atrule', () => {
  const root = parseSvg(`
      <svg>
        <style>
          .a {
            animation: loading 4s linear infinite;
          }
          @keyframes loading {
            0% {
              stroke-dashoffset: 440;
            }
            50% {
              stroke-dashoffset: 0;
            }
            50.1% {
              stroke-dashoffset: 880;
            }
          }
        </style>
        <rect id="element" class="a" />
      </svg>
    `);
  const stylesheet = collectStylesheet(root);
  expect(computeStyle(stylesheet, getElementById(root, 'element'))).toEqual({
    animation: {
      type: 'static',
      inherited: false,
      value: 'loading 4s linear infinite',
    },
  });
});
