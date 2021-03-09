'use strict';

var JSAPI = require('../lib/svgo/jsAPI');

exports.type = 'full';

exports.active = false;

exports.description =
  'Finds <path> elements with the same d, fill, and ' +
  'stroke, and converts them to <use> elements ' +
  'referencing a single <path> def.';

/**
 * Finds <path> elements with the same d, fill, and stroke, and converts them to
 * <use> elements referencing a single <path> def.
 *
 * @author Jacob Howcroft
 */
exports.fn = function (data) {
  const seen = new Map();
  let count = 0;
  const defs = [];
  traverse(data, (item) => {
    if (!item.isElem('path') || !item.hasAttr('d')) {
      return;
    }
    const d = item.attr('d').value;
    const fill = (item.hasAttr('fill') && item.attr('fill').value) || '';
    const stroke = (item.hasAttr('stroke') && item.attr('stroke').value) || '';
    const key = d + ';s:' + stroke + ';f:' + fill;
    const hasSeen = seen.get(key);
    if (!hasSeen) {
      seen.set(key, { elem: item, reused: false });
      return;
    }
    if (!hasSeen.reused) {
      hasSeen.reused = true;
      if (!hasSeen.elem.hasAttr('id')) {
        hasSeen.elem.addAttr({
          name: 'id',
          local: 'id',
          prefix: '',
          value: 'reuse-' + count++,
        });
      }
      defs.push(hasSeen.elem);
    }
    convertToUse(item, hasSeen.elem.attr('id').value);
  });
  if (defs.length > 0) {
    const defsTag = new JSAPI(
      {
        elem: 'defs',
        prefix: '',
        local: 'defs',
        content: [],
        attrs: [],
      },
      data
    );
    data.content[0].spliceContent(0, 0, defsTag);
    for (let def of defs) {
      // Remove class and style before copying to avoid circular refs in
      // JSON.stringify. This is fine because we don't actually want class or
      // style information to be copied.
      const style = def.style;
      const defClass = def.class;
      delete def.style;
      delete def.class;
      const defClone = def.clone();
      def.style = style;
      def.class = defClass;
      defClone.removeAttr('transform');
      defsTag.spliceContent(0, 0, defClone);
      // Convert the original def to a use so the first usage isn't duplicated.
      def = convertToUse(def, defClone.attr('id').value);
      def.removeAttr('id');
    }
  }
  return data;
};

/** */
function convertToUse(item, href) {
  item.renameElem('use');
  item.removeAttr('d');
  item.removeAttr('stroke');
  item.removeAttr('fill');
  item.addAttr({
    name: 'xlink:href',
    local: 'xlink:href',
    prefix: 'none',
    value: '#' + href,
  });
  delete item.pathJS;
  return item;
}

/** */
function traverse(parent, callback) {
  if (parent.isEmpty()) {
    return;
  }
  for (let child of parent.content) {
    callback(child);
    traverse(child, callback);
  }
}
