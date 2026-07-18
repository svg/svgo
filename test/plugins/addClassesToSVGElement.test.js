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

test('should clear out existing classes when clearClasses parameter is set', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="first"/>`;

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
  ).toBe(
    `<svg xmlns="http://www.w3.org/2000/svg" class="first icon icon__uwu"/>`,
  );

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
            clearClasses: true,
          },
        },
      ],
    }).data,
  ).toBe(`<svg xmlns="http://www.w3.org/2000/svg" class="icon icon__uwu"/>`);
});
