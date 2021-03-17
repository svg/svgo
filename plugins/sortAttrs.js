'use strict';

const { parseName } = require('../lib/svgo/tools.js');

exports.type = 'perItem';

exports.active = false;

exports.description = 'sorts element attributes (disabled by default)';

exports.params = {
  order: [
    'id',
    'width',
    'height',
    'x',
    'x1',
    'x2',
    'y',
    'y1',
    'y2',
    'cx',
    'cy',
    'r',
    'fill',
    'stroke',
    'marker',
    'd',
    'points',
  ],
};

/**
 * Sort element attributes for epic readability.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Nikolay Frantsev
 */
exports.fn = function (item, params) {
  const attrs = [];
  const orderlen = params.order.length + 1;
  const xmlnsOrder = params.xmlnsOrder || 'front';

  if (item.type === 'element') {
    for (const [name, value] of Object.entries(item.attributes)) {
      attrs.push({ name, value });
    }

    attrs.sort(function (a, b) {
      const { prefix: prefixA } = parseName(a.name);
      const { prefix: prefixB } = parseName(b.name);
      if (prefixA != prefixB) {
        // xmlns attributes implicitly have the prefix xmlns
        if (xmlnsOrder == 'front') {
          if (prefixA === 'xmlns') return -1;
          if (prefixB === 'xmlns') return 1;
        }
        return prefixA < prefixB ? -1 : 1;
      }

      var aindex = orderlen;
      var bindex = orderlen;

      for (var i = 0; i < params.order.length; i++) {
        if (a.name == params.order[i]) {
          aindex = i;
        } else if (a.name.indexOf(params.order[i] + '-') === 0) {
          aindex = i + 0.5;
        }
        if (b.name == params.order[i]) {
          bindex = i;
        } else if (b.name.indexOf(params.order[i] + '-') === 0) {
          bindex = i + 0.5;
        }
      }

      if (aindex != bindex) {
        return aindex - bindex;
      }
      return a.name < b.name ? -1 : 1;
    });

    const sorted = {};
    attrs.forEach(function (attr) {
      sorted[attr.name] = attr.value;
    });

    item.attributes = sorted;
  }
};
