const { stringifyPathData } = require('../lib/path.js');
const { computeStyle, collectStylesheet } = require('../lib/style.js');
const { hasScripts } = require('../lib/svgo/tools.js');
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
        for (const part of parts) {
          if (part.valid) {
            const internalData = part.data.filter(
              (item) => item.command != 'm' && item.command != 'M'
            );
            if (internalData.length > 0) {
              const start = internalData[0].base;
              const end = internalData[internalData.length - 1].coords;
              pathTransformed.push(
                ...optimizePart(
                  internalData.map((item) => {
                    return {
                      command: item.command,
                      base: item.base,
                      coords: item.coords,
                    };
                  }),
                  part.data,
                  unsafeToChangeStart ||
                    start[0] != end[0] ||
                    start[1] != end[1]
                )
              );
              continue;
            }
          }
          pathTransformed.push(...part.data);
        }

        js2path(node, pathTransformed, {});
      },
    },
  };
};

/**
 * @param {InternalPath[]} path
 * @param {PathDataItem[]} baseline
 * @param {boolean} unsafeToChangeStart
 */
function optimizePart(path, baseline, unsafeToChangeStart) {
  const starts = unsafeToChangeStart
    ? [0]
    : Array.from({ length: path.length }, (_, i) => i);
  let best = {
    size: stringifyPathData({ pathData: baseline }).length,
    data: baseline,
  };
  for (const start of starts) {
    for (const reverse of [false, true]) {
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

      const outputPath = transformPath(output, !unsafeToChangeStart);
      const size = stringifyPathData({ pathData: outputPath }).length;
      if (size < best.size) {
        best = { size, data: outputPath };
      }
    }
  }
  return best.data;
}

/**
 * @param {InternalPath[]} path
 * @param {boolean} canUseZ
 */
function transformPath(path, canUseZ) {
  return path.reduce(
    (
      /** @type {PathDataItem[]} */ acc,
      /** @type {InternalPath} */ command,
      /** @type {number} */ i
    ) => {
      const lastCommand = acc[acc.length - 1]?.command;

      if (command.command == 'M')
        acc.push({ command: 'M', args: command.coords });
      else if (command.command == 'L') {
        const relativeX = command.coords[0] - command.base[0];
        const relativeY = command.coords[1] - command.base[1];
        if (i == path.length - 1 && canUseZ) {
          acc.push({ command: 'z', args: [] });
        } else if (command.base[1] == command.coords[1]) {
          const isAbsoluteBetter =
            command.coords[0].toString().length < relativeX.toString().length;
          acc.push(
            isAbsoluteBetter
              ? { command: 'H', args: [command.coords[0]] }
              : { command: 'h', args: [relativeX] }
          );
        } else if (command.base[0] == command.coords[0]) {
          const isAbsoluteBetter =
            command.coords[1].toString().length < relativeY.toString().length;
          acc.push(
            isAbsoluteBetter
              ? { command: 'V', args: [command.coords[1]] }
              : { command: 'v', args: [relativeY] }
          );
        } else {
          const absoluteLength =
            command.coords[0].toString().length +
              command.coords[1].toString().length +
              (command.coords[1] < 0 ? 0 : 1) +
              lastCommand ==
            'L'
              ? 0
              : 1;
          const relativeLength =
            relativeX.toString().length +
              relativeY.toString().length +
              (relativeY < 0 ? 0 : 1) +
              lastCommand ==
            'l'
              ? 0
              : 1;
          acc.push(
            absoluteLength < relativeLength
              ? { command: 'L', args: command.coords }
              : { command: 'l', args: [relativeX, relativeY] }
          );
        }
      }
      return acc;
    },
    []
  );
}
