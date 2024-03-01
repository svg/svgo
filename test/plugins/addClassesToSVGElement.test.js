import { optimize } from '../../lib/svgo.js';

test('should accept function as className parameter', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"/>`;

  expect(
    optimize(svg, {
      path: 'uwu.svg',
      plugins: [
        {
          name: 'addClassesToSVGElement',
          params: {
            classNames: [
              'icon',
              (_, info) => `icon__${info?.path?.split('.')[0]}`,
            ],
          },
        },
      ],
    }).data,
  ).toBe(`<svg xmlns="http://www.w3.org/2000/svg" class="icon icon__uwu"/>`);

  expect(
    optimize(svg, {
      path: 'uwu.svg',
      plugins: [
        {
          name: 'addClassesToSVGElement',
          params: {
            className: (_, info) => `icon__${info?.path?.split('.')[0]}`,
          },
        },
      ],
    }).data,
  ).toBe(`<svg xmlns="http://www.w3.org/2000/svg" class="icon__uwu"/>`);
});
