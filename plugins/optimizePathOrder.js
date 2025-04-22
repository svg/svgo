import { collectStylesheet, computeStyle } from '../lib/style.js';
import { hasScripts, toFixed } from '../lib/svgo/tools.js';
import { pathElems } from './_collections.js';
import { js2path, path2js } from './_path.js';

export const name = 'optimizePathOrder';
export const description = 'Moves around instructions in paths to be optimal.';

/**
 * @typedef {import('../lib/types.js').PathDataCommand} PathDataCommand
 * @typedef {import('../lib/types.js').PathDataItem} PathDataItem
 * @typedef {{command: PathDataCommand, arc?: {rx: number, ry: number, r: number, large: boolean, sweep: boolean}, c?: {x1: number, y1: number, x2: number, y2: number}, q?: {x: number, y: number}, base: [number, number], coords: [number, number]}} InternalPath
 * @typedef {PathDataItem & {base: [number, number], coords: [number, number]}} RealPath
 */

/**
 * Moves around instructions in paths to be optimal.
 *
 * @author Kendell R
 *
 * @type {import('./plugins-types.js').Plugin<'optimizePathOrder'>}
 */
export const fn = (root, params) => {
  const {
    floatPrecision: precision = 3,
    noSpaceAfterFlags = false,
    polylineOnly = false,
  } = params;
  const stylesheet = collectStylesheet(root);
  let deoptimized = false;
  return {
    element: {
      enter: (node) => {
        if (hasScripts(node)) {
          deoptimized = true;
        }
        if (!pathElems.has(node.name) || !node.attributes.d || deoptimized)
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
          !computedStyle.fill ||
          computedStyle.fill.type == 'dynamic' ||
          computedStyle.fill.value != 'none';
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
        if (path[0] && !path[0].coords) {
          console.warn(
            'optimizePathOrder is enabled, but data from convertPathData is not present. ' +
              'If you want to use optimizePathOrder, enable convertPathData and put optimizePathOrder after it. ' +
              'If you do not want to use optimizePathOrder, disable it.',
          );
          return;
        }

        const parts = [];
        let part = { valid: true, data: /** @type {RealPath[]} */ ([]) };
        let someValid = false;
        for (const instruction of path) {
          if (instruction.command == 'M' || instruction.command == 'm') {
            if (part.data.length > 0) {
              someValid = someValid || part.valid;
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
            instruction.command != 'Z' &&
            (polylineOnly
              ? true
              : instruction.command != 'a' &&
                instruction.command != 'A' &&
                instruction.command != 'C' &&
                instruction.command != 'c' &&
                instruction.command != 'Q' &&
                instruction.command != 'q')
          ) {
            part.valid = false;
          }
          part.data.push(instruction);
        }
        if (part.data.length > 0) {
          someValid = someValid || part.valid;
          parts.push(part);
        }
        if (!someValid) return;

        /**
         * @type {PathDataItem[]}
         */
        const pathTransformed = [];
        let someTransformed = false;
        for (const [i, part] of parts.entries()) {
          if (part.valid) {
            const internalData = part.data.filter(
              (item) => item.command != 'm' && item.command != 'M',
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
                  c:
                    item.command == 'c'
                      ? {
                          x1: item.args[0] + item.base[0],
                          y1: item.args[1] + item.base[1],
                          x2: item.args[2] + item.base[0],
                          y2: item.args[3] + item.base[1],
                        }
                      : item.command == 'C'
                        ? {
                            x1: item.args[0],
                            y1: item.args[1],
                            x2: item.args[2],
                            y2: item.args[3],
                          }
                        : undefined,
                  q:
                    item.command == 'q'
                      ? {
                          x: item.args[0] + item.base[0],
                          y: item.args[1] + item.base[1],
                        }
                      : item.command == 'Q'
                        ? {
                            x: item.args[0],
                            y: item.args[1],
                          }
                        : undefined,
                  base: item.base,
                  coords: item.coords,
                })),
                unsafeToChangeStart:
                  unsafeToChangeStart ||
                  start[0] != end[0] ||
                  start[1] != end[1],
                unsafeToChangeDirection:
                  parts.length < 2 ? false : unsafeToChangeDirection,
                first: i == 0,
                next: next?.data[0].command == 'm' ? next.data[0] : undefined,
                baseline: part.data,
                precision,
              });
              if (result.success) {
                pathTransformed.push(...result.data);
                someTransformed = true;
                continue;
              }
            }
          }

          pathTransformed.push(...part.data);
        }

        if (!someTransformed) return;
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
  if (unsafeToChangeDirection && unsafeToChangeStart) {
    return /** @type {const} */ ({ success: false });
  }

  let best = {
    success: false,
    size:
      estimatePathLength(baseline, precision, first) +
      (next ? estimateLength(next.args, precision) : 0),
    data: baseline,
  };
  for (const reverse of unsafeToChangeDirection ? [false] : [false, true]) {
    const input = reverse
      ? path
          .map((item) => {
            return {
              command: item.command,
              arc: item.arc && {
                ...item.arc,
                sweep: !item.arc.sweep,
              },
              c: item.c && {
                x1: item.c.x2,
                y1: item.c.y2,
                x2: item.c.x1,
                y2: item.c.y1,
              },
              q: item.q,
              base: item.coords,
              coords: item.base,
            };
          })
          .reverse()
      : path;
    /**
     * @type {RealPath[]}
     */
    const output = [];
    let i = 0;
    while (unsafeToChangeStart ? i == 0 : i < path.length) {
      if (i == 0) {
        output.push({
          command: 'M',
          args: input[0].base,
          base: [0, 0],
          coords: input[0].base,
        });
        for (const item of input) {
          output.push(
            transformCommand(
              { ...item, command: getCommand(item) },
              precision,
              output[output.length - 1].command,
              output.length == input.length && !unsafeToChangeStart,
            ),
          );
        }
      } else {
        const previousItem = i == 1 ? input[input.length - 1] : input[i - 2];
        const newItem = input[i - 1];
        // Cycle start out and into end
        output.splice(1, 1);
        output[0] = {
          command: 'M',
          args: output[1].base,
          base: [0, 0],
          coords: output[1].base,
        };

        output.pop();
        output.push(
          transformCommand(
            { ...previousItem, command: getCommand(previousItem) },
            precision,
            output[output.length - 1].command,
            false,
          ),
        );
        output.push(
          transformCommand(
            { ...newItem, command: getCommand(newItem) },
            precision,
            output[output.length - 1].command,
            !unsafeToChangeStart,
          ),
        );
      }
      i++;

      const size =
        estimatePathLength(output, precision, first) +
        (next
          ? estimateLength(
              transformMove(next, output[output.length - 1].coords),
              precision,
            )
          : 0);
      if (size < best.size) {
        if (next)
          next.args = transformMove(next, output[output.length - 1].coords);
        best = {
          success: true,
          size,
          data: [...output],
        };
      }
    }
  }
  return best;
}

/**
 * @param {InternalPath} item
 */
function getCommand(item) {
  return item.command == 'a' || item.command == 'A'
    ? 'A'
    : item.command == 'c' || item.command == 'C'
      ? 'C'
      : item.command == 'q' || item.command == 'Q'
        ? 'Q'
        : 'L';
}

/**
 * @param {InternalPath & {command: "A" | "C" | "Q" | "L"}} command
 * @param {number} precision
 * @param {string} lastCommand
 * @param {boolean} useZ
 * @returns {RealPath}
 */
function transformCommand(command, precision, lastCommand, useZ) {
  if (command.command == 'A') {
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
    return {
      command: absoluteLength < relativeLength ? 'A' : 'a',
      args:
        absoluteLength < relativeLength
          ? [...args, ...command.coords]
          : [...args, relativeX, relativeY],
      base: command.base,
      coords: command.coords,
    };
  } else if (command.command == 'C') {
    const data =
      /** @type {{x1: number, y1: number, x2: number, y2: number}} */ (
        command.c
      );
    const args = [data.x1, data.y1, data.x2, data.y2, ...command.coords];
    const argsRelative = args.map((a, i) =>
      i % 2 == 0 ? a - command.base[0] : a - command.base[1],
    );
    const absoluteLength =
      estimateLength(args, precision) + (lastCommand == 'C' ? 0 : 1);
    const relativeLength =
      estimateLength(argsRelative, precision) + (lastCommand == 'c' ? 0 : 1);
    return {
      command: absoluteLength < relativeLength ? 'C' : 'c',
      args: absoluteLength < relativeLength ? args : argsRelative,
      base: command.base,
      coords: command.coords,
    };
  } else if (command.command == 'Q') {
    const data = /** @type {{x: number, y: number}} */ (command.q);
    const args = [data.x, data.y, ...command.coords];
    const argsRelative = args.map((a, i) =>
      i % 2 == 0 ? a - command.base[0] : a - command.base[1],
    );
    const absoluteLength =
      estimateLength(args, precision) + (lastCommand == 'Q' ? 0 : 1);
    const relativeLength =
      estimateLength(argsRelative, precision) + (lastCommand == 'q' ? 0 : 1);
    return {
      command: absoluteLength < relativeLength ? 'Q' : 'q',
      args: absoluteLength < relativeLength ? args : argsRelative,
      base: command.base,
      coords: command.coords,
    };
  } else {
    const relativeX = command.coords[0] - command.base[0];
    const relativeY = command.coords[1] - command.base[1];
    if (useZ) {
      return {
        command: 'z',
        args: [],
        base: command.base,
        coords: command.coords,
      };
    } else if (command.base[1] == command.coords[1]) {
      const absoluteLength = toFixed(command.coords[0], precision).toString()
        .length;
      const relativeLength = toFixed(relativeX, precision).toString().length;
      return {
        command: absoluteLength < relativeLength ? 'H' : 'h',
        args:
          absoluteLength < relativeLength ? [command.coords[0]] : [relativeX],
        base: command.base,
        coords: command.coords,
      };
    } else if (command.base[0] == command.coords[0]) {
      const absoluteLength = toFixed(command.coords[1], precision).toString()
        .length;
      const relativeLength = toFixed(relativeY, precision).toString().length;
      return {
        command: absoluteLength < relativeLength ? 'V' : 'v',
        args:
          absoluteLength < relativeLength ? [command.coords[1]] : [relativeY],
        base: command.base,
        coords: command.coords,
      };
    } else {
      const absoluteLength =
        estimateLength(command.coords, precision) +
        (lastCommand == 'L' ? 0 : 1);
      const relativeLength =
        estimateLength([relativeX, relativeY], precision) +
        (lastCommand == 'l' ? 0 : 1);
      return {
        command: absoluteLength < relativeLength ? 'L' : 'l',
        args:
          absoluteLength < relativeLength
            ? command.coords
            : [relativeX, relativeY],
        base: command.base,
        coords: command.coords,
      };
    }
  }
}

/**
 * @param {RealPath} command
 * @param {[number, number]} newBase
 */
function transformMove(command, newBase) {
  return [command.coords[0] - newBase[0], command.coords[1] - newBase[1]];
}

/**
 * @param {number[]} numbers
 * @param {number} precision
 */
function estimateLength(numbers, precision) {
  let length = 0;
  let last = undefined;
  for (const number of numbers) {
    const rounded = toFixed(number, precision);
    const string = rounded.toString();
    length +=
      string.length - (rounded != 0 && rounded > -1 && rounded < 1 ? 1 : 0);
    if (last !== undefined) {
      if (!(rounded < 0) && !(last % 1 && rounded > 0 && rounded < 1)) {
        length += 1;
      }
    }
    last = rounded;
  }
  return length;
}

/**
 * @param {PathDataItem[]} data
 * @param {number} precision
 * @param {boolean} first
 */
function estimatePathLength(data, precision, first) {
  let i = 0;
  let length = 0;
  while (i < data.length) {
    let { command, args } = data[i];
    const isVeryFirst = i == 0 && first;

    let joined = false;
    do {
      const next = data[i + 1];
      if (!next) break;

      joined = false;
      if (command == 'M') {
        if (next.command == 'L') joined = true;
      } else if (command == 'm') {
        if (next.command == 'l') joined = true;
      } else {
        if (next.command == command) joined = true;
      }
      if (
        isVeryFirst &&
        (command == 'M' || command == 'm') &&
        (next.command == 'L' || next.command == 'l')
      ) {
        joined = true;
      }

      if (joined) {
        args = [...args, ...next.args];
        i++;
      }
    } while (joined);

    length += 1 + estimateLength(args, precision);
    i++;
  }
  return length;
}
