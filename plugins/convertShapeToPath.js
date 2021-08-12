'use strict';

const { stringifyPathData } = require('../lib/path.js');

exports.type = 'perItem';

exports.active = true;

exports.description = 'converts basic shapes to more compact path form';

exports.params = {
  convertArcs: false,
  floatPrecision: null,
};

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
    item.attributes.width != null &&
    item.attributes.height != null
  ) {
    const x = Number(item.attributes.x || '0');
    const y = Number(item.attributes.y || '0');
    let rx = Number(item.attributes.rx) || 'auto';
    let ry = Number(item.attributes.ry) || 'auto';
    const width = Number(item.attributes.width);
    const height = Number(item.attributes.height);
    // Values like '100%' compute to NaN, thus running after
    // cleanupNumericValues when 'px' units has already been removed.
    // TODO: Calculate sizes from % and non-px units if possible.
    if (isNaN(x - y + width - height)) return;


    if (rx === 'auto' && ry === 'auto') {
      // If neither rx nor ry has a properly specified value, this is rectangle with square corners
      rx = ry = 0
    } else if ( ry === 'auto') {
      // If ry missing, use value of rx
      ry = rx
    } else if ( rx === 'auto') {
      // If rx missing, use value of ry
      rx = ry
    }
    // If value of rx greater than half of width, reset to half of width.
    // Do same for ry.
    if (rx > width / 2) {
      rx = width / 2
    }
    if (ry > height / 2) {
      ry = height / 2
    }

    const hasCurves = rx > 0 && ry > 0
    if (hasCurves && !convertArcs) return;

    let pathData = [
      { command: 'M', args: [x + rx, y] },
      { command: 'H', args: [x + width - rx] },
      hasCurves && { command: 'A', args: [rx, ry, 0, 0, 1, x + width, y + ry] },
      { command: 'V', args: [y + height - ry] },
      hasCurves && { command: 'A', args: [rx, ry, 0, 0, 1, x + width - rx, y + height] },
      { command: 'H', args: [x + rx] },
      hasCurves && { command: 'A', args: [rx, ry, 0, 0, 1, x, y + height - ry] },
      hasCurves && { command: 'V', args: [y + ry] },
      hasCurves && { command: 'A', args: [rx, ry, 0, 0, 1, x + rx, y ] },
      { command: 'z', args: [] },
    ];
    // filter out null vallues
    pathData = pathData.filter(val => !!val);
    item.attributes.d = stringifyPathData({ pathData, precision });
    item.renameElem('path');
    delete item.attributes.x;
    delete item.attributes.y;
    delete item.attributes.rx;
    delete item.attributes.ry;
    delete item.attributes.width;
    delete item.attributes.height;
  }

  if (item.isElem('line')) {
    const x1 = Number(item.attributes.x1 || '0');
    const y1 = Number(item.attributes.y1 || '0');
    const x2 = Number(item.attributes.x2 || '0');
    const y2 = Number(item.attributes.y2 || '0');
    if (isNaN(x1 - y1 + x2 - y2)) return;
    const pathData = [
      { command: 'M', args: [x1, y1] },
      { command: 'L', args: [x2, y2] },
    ];
    item.attributes.d = stringifyPathData({ pathData, precision });
    item.renameElem('path');
    delete item.attributes.x1;
    delete item.attributes.y1;
    delete item.attributes.x2;
    delete item.attributes.y2;
  }

  if (
    (item.isElem('polyline') || item.isElem('polygon')) &&
    item.attributes.points != null
  ) {
    const coords = (item.attributes.points.match(regNumber) || []).map(Number);
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
    item.attributes.d = stringifyPathData({ pathData, precision });
    item.renameElem('path');
    delete item.attributes.points;
  }

  if (item.isElem('circle') && convertArcs) {
    const cx = Number(item.attributes.cx || '0');
    const cy = Number(item.attributes.cy || '0');
    const r = Number(item.attributes.r || '0');
    if (isNaN(cx - cy + r)) {
      return;
    }
    const pathData = [
      { command: 'M', args: [cx, cy - r] },
      { command: 'A', args: [r, r, 0, 1, 0, cx, cy + r] },
      { command: 'A', args: [r, r, 0, 1, 0, cx, cy - r] },
      { command: 'z', args: [] },
    ];
    item.attributes.d = stringifyPathData({ pathData, precision });
    item.renameElem('path');
    delete item.attributes.cx;
    delete item.attributes.cy;
    delete item.attributes.r;
  }

  if (item.isElem('ellipse') && convertArcs) {
    const ecx = Number(item.attributes.cx || '0');
    const ecy = Number(item.attributes.cy || '0');
    const rx = Number(item.attributes.rx || '0');
    const ry = Number(item.attributes.ry || '0');
    if (isNaN(ecx - ecy + rx - ry)) {
      return;
    }
    const pathData = [
      { command: 'M', args: [ecx, ecy - ry] },
      { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy + ry] },
      { command: 'A', args: [rx, ry, 0, 1, 0, ecx, ecy - ry] },
      { command: 'z', args: [] },
    ];
    item.attributes.d = stringifyPathData({ pathData, precision });
    item.renameElem('path');
    delete item.attributes.cx;
    delete item.attributes.cy;
    delete item.attributes.rx;
    delete item.attributes.ry;
  }
};
