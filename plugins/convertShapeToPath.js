'use strict';

const { stringifyPathData } = require('../lib/path.js');

exports.type = 'perItem';

exports.active = true;

exports.description = 'converts basic shapes to more compact path form';

exports.params = {
  convertArcs: false,
  floatPrecision: null,
};

const none = { value: 0 };
const regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/**
 * Converts basic shape to more compact path.
 * It also allows further optimizations like
 * combining paths with similar attributes.
 *
 * @see https://www.w3.org/TR/SVG11/shapes.html
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Lev Solntsev
 */
exports.fn = function (item, params) {
  const precision = params ? params.floatPrecision : null;
  const convertArcs = params && params.convertArcs;

  if (
    item.isElem('rect') &&
    item.hasAttr('width') &&
    item.hasAttr('height') &&
    !item.hasAttr('rx') &&
    !item.hasAttr('ry')
  ) {
    var x = +(item.attr('x') || none).value,
      y = +(item.attr('y') || none).value,
      width = +item.attr('width').value,
      height = +item.attr('height').value;
    // Values like '100%' compute to NaN, thus running after
    // cleanupNumericValues when 'px' units has already been removed.
    // TODO: Calculate sizes from % and non-px units if possible.
    if (isNaN(x - y + width - height)) return;
    const pathData = [
      { command: 'M', args: [x, y] },
      { command: 'H', args: [x + width] },
      { command: 'V', args: [y + height] },
      { command: 'H', args: [x] },
      { command: 'z', args: [] },
    ];
    item.addAttr({
      name: 'd',
      value: stringifyPathData({ pathData, precision }),
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['x', 'y', 'width', 'height']);
  }

  if (item.isElem('line')) {
    var x1 = +(item.attr('x1') || none).value,
      y1 = +(item.attr('y1') || none).value,
      x2 = +(item.attr('x2') || none).value,
      y2 = +(item.attr('y2') || none).value;
    if (isNaN(x1 - y1 + x2 - y2)) return;
    const pathData = [
      { command: 'M', args: [x1, y1] },
      { command: 'L', args: [x2, y2] },
    ];
    item.addAttr({
      name: 'd',
      value: stringifyPathData({ pathData, precision }),
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['x1', 'y1', 'x2', 'y2']);
  }

  if (
    (item.isElem('polyline') || item.isElem('polygon')) &&
    item.hasAttr('points')
  ) {
    var coords = (item.attr('points').value.match(regNumber) || []).map(Number);
    if (coords.length < 4) return false;
    const pathData = [];
    for (let i = 0; i < coords.length; i += 2) {
      pathData.push({
        command: i === 0 ? 'M' : 'L',
        args: coords.slice(i, i + 2),
      });
    }
    if (item.isElem('polygon')) {
      pathData.push({ command: 'z', args: [] });
    }
    item.addAttr({
      name: 'd',
      value: stringifyPathData({ pathData, precision }),
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr('points');
  }

  if (item.isElem('circle') && convertArcs) {
    var cx = +(item.attr('cx') || none).value;
    var cy = +(item.attr('cy') || none).value;
    var r = +(item.attr('r') || none).value;
    if (isNaN(cx - cy + r)) {
      return;
    }
    const pathData = [
      { command: 'M', args: [cx, cy - r] },
      { command: 'A', args: [r, r, 0, 1, 0, cx, cy + r] },
      { command: 'A', args: [r, r, 0, 1, 0, cx, cy - r] },
      { command: 'z', args: [] },
    ];
    item.addAttr({
      name: 'd',
      value: stringifyPathData({ pathData, precision }),
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['cx', 'cy', 'r']);
  }

  if (item.isElem('ellipse') && convertArcs) {
    var ecx = +(item.attr('cx') || none).value;
    var ecy = +(item.attr('cy') || none).value;
    var rx = +(item.attr('rx') || none).value;
    var ry = +(item.attr('ry') || none).value;
    if (isNaN(ecx - ecy + rx - ry)) {
      return;
    }
    const pathData = [
      { command: 'M', args: [ecx, ecy - ry] },
      { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy + ry] },
      { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy - ry] },
      { command: 'z', args: [] },
    ];
    item.addAttr({
      name: 'd',
      value: stringifyPathData({ pathData, precision }),
      prefix: '',
      local: 'd',
    });
    item.renameElem('path').removeAttr(['cx', 'cy', 'rx', 'ry']);
  }
};
