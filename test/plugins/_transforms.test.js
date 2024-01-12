import { matrixToTransform } from '../../plugins/_transforms.js';

/**
 * @typedef {import('../../plugins/_transforms').TransformParams} TransformParams
 */

/** @type {TransformParams} */
const params = {
  floatPrecision: 3,
  transformPrecision: 5,
  matrixToTransform: true,
  shortTranslate: true,
  shortScale: true,
  shortRotate: true,
  removeUseless: true,
  collapseIntoOne: true,
  leadingZero: true,
  negativeExtraSpace: false,
  convertToShorts: true,
};

/**
 * Some tests live here instead of in test SVGs because the output
 * is longer, so SVGO doesn't actually use it.
 */
describe('should correctly simplify transforms', () => {
  it('matrix(0, -1, 99, 0, 0, 0)', () => {
    const matrix = {
      name: 'matrix',
      data: [0, -1, 99, 0, 0, 0],
    };

    expect(matrixToTransform(matrix, params)).toStrictEqual([
      {
        name: 'rotate',
        data: [-90],
      },
      {
        name: 'scale',
        data: [1, 99],
      },
    ]);
  });

  it('matrix(0, 1, 1, 0, 0, 0)', () => {
    const matrix = {
      name: 'matrix',
      data: [0, 1, 1, 0, 0, 0],
    };

    expect(matrixToTransform(matrix, params)).toStrictEqual([
      {
        name: 'rotate',
        data: [90],
      },
      {
        name: 'scale',
        data: [1, -1],
      },
    ]);
  });
});
