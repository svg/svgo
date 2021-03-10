'use strict';

const { parseName } = require('../lib/svgo/tools.js');

exports.type = 'perItem';

exports.active = true;

exports.description = 'removes editors namespaces, elements and attributes';

var editorNamespaces = require('./_collections').editorNamespaces,
  prefixes = [];

exports.params = {
  additionalNamespaces: [],
};

/**
 * Remove editors namespaces, elements and attributes.
 *
 * @example
 * <svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">
 * <sodipodi:namedview/>
 * <path sodipodi:nodetypes="cccc"/>
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (item, params) {
  if (Array.isArray(params.additionalNamespaces)) {
    editorNamespaces = editorNamespaces.concat(params.additionalNamespaces);
  }

  if (item.type === 'element') {
    if (item.isElem('svg')) {
      item.eachAttr(function (attr) {
        const { prefix, local } = parseName(attr.name);
        if (prefix === 'xmlns' && editorNamespaces.includes(attr.value)) {
          prefixes.push(local);

          // <svg xmlns:sodipodi="">
          item.removeAttr(attr.name);
        }
      });
    }

    // <* sodipodi:*="">
    item.eachAttr(function (attr) {
      const { prefix } = parseName(attr.name);
      if (prefixes.includes(prefix)) {
        item.removeAttr(attr.name);
      }
    });

    // <sodipodi:*>
    const { prefix } = parseName(item.name);
    if (prefixes.includes(prefix)) {
      return false;
    }
  }
};
