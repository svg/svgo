'use strict';

const { optimize } = require('../../lib/svgo.js');

test('should extract prefix from path basename', () => {
  const svg = `<svg id="my-id"></svg>`;
  expect(
    optimize(svg, {
      plugins: ['prefixIds']
    }).data
  ).toEqual(`<svg id="prefix__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'input.svg'
    }).data
  ).toEqual(`<svg id="input_svg__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'path/to/input.svg'
    }).data
  ).toEqual(`<svg id="input_svg__my-id"/>`);
});
