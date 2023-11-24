const { computeStyle, collectStylesheet } = require('../lib/style.js');
const { hasScripts } = require('../lib/svgo/tools.js');
const { pathElems } = require('./_collections.js');
const { path2js, js2path } = require('./_path.js');

exports.name = 'optimizePathOrder';
exports.description = 'Moves around instructions in paths to be optimal.';

/**
 * @typedef {import('../lib/types').PathDataCommand} PathDataCommand
 * @typedef {import('../lib/types').PathDataItem} PathDataItem
 * @typedef {{command: PathDataCommand, arc?: {rx: number, ry: number, r: number, large: boolean, sweep: boolean}, base: [number, number], coords: [number, number]}} InternalPath
 * @typedef {PathDataItem & {base: [number, number], coords: [number, number]}} RealPath
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
          (computedStyle.stroke.type == 'dynamic' ||
            computedStyle.stroke.value != 'none');
        const maybeHasFill =
          computedStyle.fill &&
          (computedStyle.fill.type == 'dynamic' ||
            computedStyle.fill.value != 'none');
        const unsafeToChangeStart = maybeHasStroke
          ? computedStyle['stroke-linecap']?.type != 'static' ||
            computedStyle['stroke-linecap'].value != 'round' ||
            computedStyle['stroke-linejoin']?.type != 'static' ||
            computedStyle['stroke-linejoin'].value != 'round'
          : false;
        const unsafeToChangeDirection = maybeHasFill
          ? computedStyle['fill-rule']?.type != 'static' ||
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
            instruction.command != 'a' &&
            instruction.command != 'A' &&
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
                path: internalData.map((item) => ({
                  command: item.command,
                  arc:
                    item.command == 'a' || item.command == 'A'
                      ? {
                          rx: item.args[0],
                          ry: item.args[1],
                          r: item.args[2],
                          large: Boolean(item.args[3]),
                          sweep: Boolean(item.args[4]),
                        }
                      : undefined,
                  base: item.base,
                  coords: item.coords,
                })),
                unsafeToChangeStart:
                  unsafeToChangeStart ||
                  start[0] != end[0] ||
                  start[1] != end[1],
                unsafeToChangeDirection,
                first: i == 0,
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
 *   first: boolean,
 *   next: RealPath | undefined,
 *   baseline: RealPath[],
 *   precision: number
 * }} param0
 */
function optimizePart({
  path,
  unsafeToChangeStart,
  unsafeToChangeDirection,
  first,
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
      estimatePathLength(baseline, precision, first) +
      (next ? estimateLength(next.args, precision) : 0),
    data: baseline,
  };
  for (const start of starts) {
    for (const reverse of unsafeToChangeDirection ? [false] : [false, true]) {
      if (start == 0 && !reverse) continue;
      const data = reverse
        ? path
            .slice(0, start)
            .reverse()
            .concat(path.slice(start).reverse())
            .map((item) => {
              return {
                command: item.command,
                arc: item.arc && {
                  ...item.arc,
                  sweep: !item.arc.sweep,
                },
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
        if (item.command == 'a' || item.command == 'A') {
          output.push({
            command: 'A',
            arc: item.arc,
            base: item.base,
            coords: item.coords,
          });
        } else {
          output.push({
            command: 'L',
            base: item.base,
            coords: item.coords,
          });
        }
      }

      const outputPath = transformPath(output, precision, !unsafeToChangeStart);
      const size =
        estimatePathLength(outputPath, precision, first) +
        (next
          ? estimateLength(
              transformMove(next, output[output.length - 1].coords),
              precision
            )
          : 0);
      if (size < best.size) {
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
  /**
   * @type {RealPath[]}
   */
  const acc = [];
  for (const command of path) {
    const lastCommand = acc[acc.length - 1]?.command;

    if (command.command == 'M')
      acc.push({
        command: 'M',
        args: command.coords,
        base: command.base,
        coords: command.coords,
      });
    else if (command.command == 'A') {
      const data =
        /** @type {{rx: number, ry: number, r: number, large: boolean, sweep: boolean}} */ (
          command.arc
        );
      const args = [
        data.rx,
        data.ry,
        data.r,
        data.large ? 1 : 0,
        data.sweep ? 1 : 0,
      ];
      const relativeX = command.coords[0] - command.base[0];
      const relativeY = command.coords[1] - command.base[1];
      const absoluteLength =
        estimateLength([...args, ...command.coords], precision) +
        (lastCommand == 'A' ? 0 : 1);
      const relativeLength =
        estimateLength([...args, relativeX, relativeY], precision) +
        (lastCommand == 'a' ? 0 : 1);
      acc.push({
        command: absoluteLength < relativeLength ? 'A' : 'a',
        args:
          absoluteLength < relativeLength
            ? [...args, ...command.coords]
            : [...args, relativeX, relativeY],
        base: command.base,
        coords: command.coords,
      });
    } else if (command.command == 'L') {
      const relativeX = command.coords[0] - command.base[0];
      const relativeY = command.coords[1] - command.base[1];
      if (acc.length == path.length - 1 && canUseZ) {
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
        acc.push({
          command: absoluteLength < relativeLength ? 'H' : 'h',
          args:
            absoluteLength < relativeLength ? [command.coords[0]] : [relativeX],
          base: command.base,
          coords: command.coords,
        });
      } else if (command.base[0] == command.coords[0]) {
        const absoluteLength = toPrecision(
          command.coords[1],
          precision
        ).toString().length;
        const relativeLength = toPrecision(relativeY, precision).toString()
          .length;
        acc.push({
          command: absoluteLength < relativeLength ? 'V' : 'v',
          args:
            absoluteLength < relativeLength ? [command.coords[1]] : [relativeY],
          base: command.base,
          coords: command.coords,
        });
      } else {
        const absoluteLength =
          estimateLength(command.coords, precision) +
          (lastCommand == 'L' ? 0 : 1);
        const relativeLength =
          estimateLength([relativeX, relativeY], precision) +
          (lastCommand == 'l' ? 0 : 1);
        acc.push({
          command: absoluteLength < relativeLength ? 'L' : 'l',
          args:
            absoluteLength < relativeLength
              ? command.coords
              : [relativeX, relativeY],
          base: command.base,
          coords: command.coords,
        });
      }
    }
  }
  return acc;
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
  let length = 0;
  let last = undefined;
  for (const number of numbers) {
    const rounded = toPrecision(number, precision);
    const string = rounded.toString();
    length +=
      string.length - (rounded != 0 && rounded > -1 && rounded < 1 ? 1 : 0);
    if (last) {
      if (
        !(rounded < 0) &&
        !(last.includes('.') && rounded > 0 && rounded < 1)
      ) {
        length += 1;
      }
    }
    last = string;
  }
  return length;
}

/**
 * @param {PathDataItem[]} data
 * @param {number} precision
 * @param {boolean} first
 */
function estimatePathLength(data, precision, first) {
  /**
   * @type {{command: string, args: number[]}[]}
   */
  let combined = [];
  data.forEach((command, i) => {
    const last = combined[combined.length - 1];
    if (last) {
      let commandless =
        (last.command == command.command &&
          last.command != 'M' &&
          last.command != 'm') ||
        (last.command == 'M' && command.command == 'L') ||
        (last.command == 'm' && command.command == 'l');
      if (
        first &&
        i == 1 &&
        (last.command == 'M' || last.command == 'm') &&
        (command.command == 'L' || command.command == 'l')
      ) {
        commandless = true;
        last.command = command.command == 'L' ? 'M' : 'm';
      }
      if (commandless) {
        last.args = [...last.args, ...command.args];
        return;
      }
    }
    combined.push({ command: command.command, args: command.args });
  });

  let length = 0;
  for (const command of combined) {
    length += 1 + estimateLength(command.args, precision);
  }

  return length;
}
