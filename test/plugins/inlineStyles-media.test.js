import { expect, it } from 'vitest';
import { optimize } from '../../lib/svgo.js';

it.each([
  'print',
  'screen',
  '(prefers-color-scheme: dark)',
  'print, screen',
  '\u00a0',
  '  ',
])('preserves rules conditional on the style media attribute: %s', (media) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style media="${media}">.shape{display:none}</style><rect class="shape" width="100" height="100"/></svg>`;
  expect(optimize(svg, { plugins: ['inlineStyles'] }).data).toBe(svg);
});

it.each(['', 'all', 'All', 'ALL', 'all '])(
  'inlines an unconditional style media attribute: %s',
  (media) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style media="${media}">.shape{fill:red}</style><rect class="shape" width="100" height="100"/></svg>`;
    expect(optimize(svg, { plugins: ['inlineStyles'] }).data).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" style="fill:red"/></svg>',
    );
  },
);

it('preserves attribute-scoped rules when useMqs selects their query', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.shape{fill:red}</style><rect class="shape" width="100" height="100"/></svg>';
  expect(
    optimize(svg, {
      plugins: [
        { name: 'inlineStyles', params: { useMqs: ['', 'media print'] } },
      ],
    }).data,
  ).toBe(svg);
});

it('preserves nested queries within an attribute-scoped style', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">@media screen{.shape{fill:red}}</style><rect class="shape" width="100" height="100"/></svg>';
  expect(
    optimize(svg, {
      plugins: [
        {
          name: 'inlineStyles',
          params: { useMqs: ['', 'media print', 'media screen'] },
        },
      ],
    }).data,
  ).toBe(svg);
});

it.each([
  ['print', false],
  ['print', true],
  ['screen', false],
  ['screen', true],
])(
  'preserves cascading across %s styles (conditional first: %s)',
  (media, conditionalFirst) => {
    const unconditional = '<style>.shape{fill:red}</style>';
    const conditional = `<style media="${media}">.shape{fill:blue}</style>`;
    const styles = conditionalFirst
      ? conditional + unconditional
      : unconditional + conditional;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">${styles}<rect class="shape" width="100" height="100"/></svg>`;
    expect(optimize(svg, { plugins: ['inlineStyles'] }).data).toBe(svg);
  },
);

it('preserves mixed text and CDATA in conditional styles', () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><style media="print">.a{fill:red}<![CDATA[.b{fill:blue}]]></style><rect class="a"/><rect class="b"/><circle class="b"/></svg>';
  expect(
    optimize(svg, {
      plugins: [
        { name: 'inlineStyles', params: { useMqs: ['', 'media print'] } },
      ],
    }).data,
  ).toBe(svg);
});

it.each(['print', 'speech', 'not all'])(
  'preserves unrelated styles when a conditional stylesheet is present: %s',
  (media) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><style>.gone{display:none}</style><style media="${media}">.other{fill:blue}</style><rect class="gone" width="100" height="100"/><rect class="other" width="100" height="100" fill="red"/></svg>`;
    expect(optimize(svg, { plugins: ['inlineStyles'] }).data).toBe(svg);
  },
);
