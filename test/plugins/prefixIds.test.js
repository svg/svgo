import { optimize } from '../../lib/svgo.js';

test('should extract prefix from path basename', () => {
  const svg = `<svg id="my-id"></svg>`;
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
    }).data,
  ).toBe(`<svg id="prefix__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'input.svg',
    }).data,
  ).toBe(`<svg id="input_svg__my-id"/>`);
  expect(
    optimize(svg, {
      plugins: ['prefixIds'],
      path: 'path/to/input.svg',
    }).data,
  ).toBe(`<svg id="input_svg__my-id"/>`);
});
