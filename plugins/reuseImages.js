'use strict';

var JSAPI = require('../lib/svgo/jsAPI');

exports.type = 'full';

exports.active = false;

exports.description = 'Finds <image> elements with the same xlink:href, ' +
                      ', width, and height, and converts them to <use> ' +
                      'elements referencing a  single <image> def.';

/**
 * Finds <image> elements with the same xlink:href, width, and height, and converts them to
 * <use> elements referencing a single <image> def.
 *
 * @author Jack Burridge
 */
exports.fn = function(data) {
  const seen = new Map();
  let count = 0;
  const defs = [];
  traverse(data, item => {
    if (!item.isElem('image') || !item.hasAttr('xlink:href')) {
      return;
    }
  const xlinkHref = item.attr('xlink:href').value;
  const width = (item.hasAttr('width') && item.attr('width').value) || '';
  const height = (item.hasAttr('height') && item.attr('height').value) || '';
  const key = xlinkHref + ';w:' + width + ';h:' + height;
    const hasSeen = seen.get(key);
    if (!hasSeen) {
      seen.set(key, {elem: item, reused: false});
      return;
    }
    if (!hasSeen.reused) {
      hasSeen.reused = true;
      if (!hasSeen.elem.hasAttr('id')) {
        hasSeen.elem.addAttr({name: 'id', local: 'id',
                              prefix: '', value: 'reuse-' + (count++)});
      }
      defs.push(hasSeen.elem);
    }
    item = convertToUse(item, hasSeen.elem.attr('id').value);
  });
  const defsTag = new JSAPI({
    elem: 'defs', prefix: '', local: 'defs', content: [], attrs: []}, data);
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
    defClone.removeAttr('x');
    defClone.removeAttr('y');
    defsTag.spliceContent(0, 0, defClone);
    // Convert the original def to a use so the first usage isn't duplicated.
    def = convertToUse(def, defClone.attr('id').value);
    def.removeAttr('id');
  }
  return data;
};

/** */
function convertToUse(item, href) {
  item.renameElem('use');
  item.removeAttr('xlink:href');
  item.removeAttr('width');
  item.removeAttr('height');
  item.addAttr({name: 'xlink:href', local: 'xlink:href',
                prefix: 'none', value: '#' + href});
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
