const { stringifyPathData } = require('../lib/path.js');
const { computeStyle, collectStylesheet } = require('../lib/style.js');
const { hasScripts, cleanupOutData } = require('../lib/svgo/tools.js');
const { pathElems } = require('./_collections.js');
const { path2js, js2path } = require('./_path.js');

exports.name = 'optimizePathOrder';
exports.description = 'Moves around instructions in paths to be optimal.';

/**
 * @typedef {import('../lib/types').PathDataCommand} PathDataCommand
 * @typedef {import('../lib/types').PathDataItem} PathDataItem
 * @typedef {{command: PathDataCommand, base: [number, number], coords: [number, number]}} InternalPath
 * @typedef {InternalPath & {args: number[]}} RealPath
 */

/**
 * Moves around instructions in paths to be optimal.
 *
 * @author Kendell R
 *
 * @type {import('./plugins-types').Plugin<'optimizePathOrder'>}
 */
exports.fn = (root, params) => {
  const { floatPrecision: precision = 3, noSpaceAfterFlags } = params;
  const stylesheet = collectStylesheet(root);
  let deoptimized = false;
  return {
    element: {
      enter: (node) => {
        if (hasScripts(node)) {
          deoptimized = true;
        }
        if (!pathElems.includes(node.name) || !node.attributes.d || deoptimized)
          return;

        const computedStyle = computeStyle(stylesheet, node);
        if (
          computedStyle['marker-start'] ||
          computedStyle['marker-mid'] ||
          computedStyle['marker-end'] ||
          computedStyle['stroke-dasharray']
        )
          return;

        const maybeHasStroke =
          computedStyle.stroke &&
          (computedStyle.stroke.type === 'dynamic' ||
            computedStyle.stroke.value !== 'none');
        const unsafeToChangeStart = maybeHasStroke
          ? computedStyle['stroke-linecap']?.type !== 'static' ||
            computedStyle['stroke-linecap'].value !== 'round' ||
            computedStyle['stroke-linejoin']?.type !== 'static' ||
            computedStyle['stroke-linejoin'].value !== 'round'
          : false;
        const unsafeToChangeDirection = computedStyle.fill
          ? computedStyle['fill-rule']?.type !== 'static' ||
            computedStyle['fill-rule'].value == 'nonzero'
          : false;

        const path = /** @type {RealPath[]} */ (path2js(node));

        const parts = [];
        let part = { valid: true, data: /** @type {RealPath[]} */ ([]) };
        for (const instruction of path) {
          if (instruction.command == 'M' || instruction.command == 'm') {
            if (part.data.length > 0) {
              parts.push(part);
              part = { valid: true, data: [] };
            }
          }
          if (
            instruction.command != 'm' &&
            instruction.command != 'M' &&
            instruction.command != 'l' &&
            instruction.command != 'L' &&
            instruction.command != 'h' &&
            instruction.command != 'H' &&
            instruction.command != 'v' &&
            instruction.command != 'V' &&
            instruction.command != 'z' &&
            instruction.command != 'Z'
          ) {
            part.valid = false;
          }
          part.data.push(instruction);
        }
        if (part.data.length > 0) {
          parts.push(part);
        }

        /**
         * @type {PathDataItem[]}
         */
        const pathTransformed = [];
        for (const [i, part] of parts.entries()) {
          if (part.valid) {
            const internalData = part.data.filter(
              (item) => item.command != 'm' && item.command != 'M'
            );
            if (internalData.length > 0) {
              const start = internalData[0].base;
              const end = internalData[internalData.length - 1].coords;
              const next = parts[i + 1];

              const result = optimizePart({
                path: internalData.map((item) => {
                  return {
                    command: item.command,
                    base: item.base,
                    coords: item.coords,
                  };
                }),
                unsafeToChangeStart:
                  unsafeToChangeStart ||
                  start[0] != end[0] ||
                  start[1] != end[1],
                unsafeToChangeDirection,
                next: next?.data[0].command == 'm' ? next.data[0] : undefined,
                baseline: part.data,
                precision,
              });
              if (result.success) {
                pathTransformed.push(...result.data);
                continue;
              }
            }
          }

          pathTransformed.push(...part.data);
        }

        js2path(node, pathTransformed, {
          floatPrecision: precision,
          noSpaceAfterFlags,
        });
      },
    },
  };
};

/**
 * @param {{
 *   path: InternalPath[],
 *   unsafeToChangeStart: boolean,
 *   unsafeToChangeDirection: boolean,
 *   next: RealPath | undefined,
 *   baseline: RealPath[],
 *   precision: number
 * }} param0
 */
function optimizePart({
  path,
  unsafeToChangeStart,
  unsafeToChangeDirection,
  next,
  baseline,
  precision,
}) {
  const starts = unsafeToChangeStart
    ? [0]
    : Array.from({ length: path.length }, (_, i) => i);
  let best = {
    success: false,
    size:
      stringifyPathData({ pathData: baseline, precision }).length +
      (next ? estimateLength(next.args, precision) : 0),
    data: baseline,
  };
  for (const start of starts) {
    for (const reverse of unsafeToChangeDirection ? [false] : [false, true]) {
      const data = reverse
        ? path
            .slice(0, start)
            .reverse()
            .concat(path.slice(start).reverse())
            .map((item) => {
              return {
                command: item.command,
                base: item.coords,
                coords: item.base,
              };
            })
        : path.slice(start).concat(path.slice(0, start));

      /**
       * @type {InternalPath[]}
       */
      const output = [];
      output.push({
        command: 'M',
        base: [0, 0],
        coords: [data[0].base[0], data[0].base[1]],
      });
      for (const item of data) {
        output.push({
          command: 'L',
          base: [item.base[0], item.base[1]],
          coords: [item.coords[0], item.coords[1]],
        });
      }

      const outputPath = transformPath(output, precision, !unsafeToChangeStart);
      const size =
        stringifyPathData({
          pathData: outputPath,
          precision,
        }).length +
        (next
          ? estimateLength(
              transformMove(next, output[output.length - 1].coords),
              precision
            )
          : 0);
      if (size < best.size) {
        outputPath.forEach(
          (item) =>
            (item.args = item.args.map((a) => toPrecision(a, precision)))
        );
        if (next)
          next.args = transformMove(next, output[output.length - 1].coords);
        best = {
          success: true,
          size,
          data: outputPath,
        };
      }
    }
  }
  return best;
}

/**
 * @param {InternalPath[]} path
 * @param {number} precision
 * @param {boolean} canUseZ
 */
function transformPath(path, precision, canUseZ) {
  return path.reduce(
    (
      /** @type {RealPath[]} */ acc,
      /** @type {InternalPath} */ command,
      /** @type {number} */ i
    ) => {
      const lastCommand = acc[acc.length - 1]?.command;

      if (command.command == 'M')
        acc.push({
          command: 'M',
          args: command.coords,
          base: command.base,
          coords: command.coords,
        });
      else if (command.command == 'L') {
        const relativeX = command.coords[0] - command.base[0];
        const relativeY = command.coords[1] - command.base[1];
        if (i == path.length - 1 && canUseZ) {
          acc.push({
            command: 'z',
            args: [],
            base: command.base,
            coords: command.coords,
          });
        } else if (command.base[1] == command.coords[1]) {
          const absoluteLength = toPrecision(
            command.coords[0],
            precision
          ).toString().length;
          const relativeLength = toPrecision(relativeX, precision).toString()
            .length;
          acc.push(
            absoluteLength < relativeLength
              ? {
                  command: 'H',
                  args: [command.coords[0]],
                  base: command.base,
                  coords: command.coords,
                }
              : {
                  command: 'h',
                  args: [relativeX],
                  base: command.base,
                  coords: command.coords,
                }
          );
        } else if (command.base[0] == command.coords[0]) {
          const absoluteLength = toPrecision(
            command.coords[1],
            precision
          ).toString().length;
          const relativeLength = toPrecision(relativeY, precision).toString()
            .length;
          acc.push(
            absoluteLength < relativeLength
              ? {
                  command: 'V',
                  args: [command.coords[1]],
                  base: command.base,
                  coords: command.coords,
                }
              : {
                  command: 'v',
                  args: [relativeY],
                  base: command.base,
                  coords: command.coords,
                }
          );
        } else {
          const absoluteLength =
            estimateLength(command.coords, precision) + lastCommand == 'L'
              ? 0
              : 1;
          const relativeLength =
            estimateLength([relativeX, relativeY], precision) + lastCommand ==
            'l'
              ? 0
              : 1;
          acc.push(
            absoluteLength < relativeLength
              ? {
                  command: 'L',
                  args: command.coords,
                  base: command.base,
                  coords: command.coords,
                }
              : {
                  command: 'l',
                  args: [relativeX, relativeY],
                  base: command.base,
                  coords: command.coords,
                }
          );
        }
      }
      return acc;
    },
    []
  );
}

/**
 * @param {RealPath} command
 * @param {[number, number]} newBase
 */
function transformMove(command, newBase) {
  return [command.coords[0] - newBase[0], command.coords[1] - newBase[1]];
}

/**
 * @param {number} number
 * @param {number} precision
 */
function toPrecision(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

/**
 * @param {number[]} numbers
 * @param {number} precision
 */
function estimateLength(numbers, precision) {
  return cleanupOutData(
    numbers.map((n) => toPrecision(n, precision)),
    {}
  ).length;
}
