'use strict';

const { optimize } = require('../../lib/svgo.js');

test('should rotate paths properly', () => {
  const svg = `<svg><path d="m 10 0 v 10 l -10 -10 z"/></svg>`;
  expect(
    optimize(svg, {
      plugins: ['convertPathData', 'optimizePathOrder'],
    }).data,
  ).toEqual(`<svg><path d="M0 0h10v10z"/></svg>`);
});
test('should reverse paths properly', () => {
  const svg = `<svg><path d="m 16 14 v -2 h -8 v 2 z"/></svg>`;
  expect(
    optimize(svg, {
      plugins: ['convertPathData', 'optimizePathOrder'],
    }).data,
  ).toEqual(`<svg><path d="M8 12h8v2H8z"/></svg>`);
});
