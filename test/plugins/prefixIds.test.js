'use strict';

const { optimize } = require('../../lib/svgo.js');

test('should extract prefix from path basename', () => {
  const svg = `<svg id="my-id"></svg>`;
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
    }).data
  ).toEqual(`<svg id="prefix__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'input.svg',
    }).data
  ).toEqual(`<svg id="input_svg__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'path/to/input.svg',
    }).data
  ).toEqual(`<svg id="input_svg__my-id"/>`);
});

test('should replace references in attributes', () => {
  expect(
    optimize(
      `<g fill="url(#my-id)"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<g fill="url(#prefix__my-id)"/>`);

  expect(
    optimize(
      `<g fill="URL(#my-id)"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<g fill="url(#prefix__my-id)"/>`);

  expect(
    optimize(
      `<use href="#my-id"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<use href="#prefix__my-id"/>`);

  expect(
    optimize(
      `<g style="fill:url(#brush-id);stroke:url(#pen-id)"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<g style="fill:url(#prefix__brush-id);stroke:url(#prefix__pen-id)"/>`);
});

test('should not tamper non-link attributes', () => {
  expect(
    optimize(
      `<g title="url(#my-id)"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<g title="url(#my-id)"/>`);
});

test('should not tamper non-id links', () => {
  expect(
    optimize(
      `<g style="background:url(http://example.com/)"/>`,
      { plugins: ['prefixIds'] }
    ).data
  ).toEqual(`<g style="background:url(http://example.com/)"/>`);
});
