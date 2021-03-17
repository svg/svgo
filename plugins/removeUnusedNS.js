'use strict';

const { parseName } = require('../lib/svgo/tools.js');

exports.type = 'full';

exports.active = true;

exports.description = 'removes unused namespaces declaration';

/**
 * Remove unused namespaces declaration.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function (data) {
  let svgElem;
  const xmlnsCollection = [];

  /**
   * Remove namespace from collection.
   *
   * @param {String} ns namescape name
   */
  function removeNSfromCollection(ns) {
    const pos = xmlnsCollection.indexOf(ns);

    // if found - remove ns from the namespaces collection
    if (pos > -1) {
      xmlnsCollection.splice(pos, 1);
    }
  }

  /**
   * Bananas!
   *
   * @param {Array} items input items
   *
   * @return {Array} output items
   */
  function monkeys(items) {
    for (const item of items.children) {
      if (item.type === 'element') {
        if (item.name === 'svg') {
          for (const name of Object.keys(item.attributes)) {
            const { prefix, local } = parseName(name);
            // collect namespaces
            if (prefix === 'xmlns' && local) {
              xmlnsCollection.push(local);
            }
          }

          // if svg element has ns-attr
          if (xmlnsCollection.length) {
            // save svg element
            svgElem = item;
          }
        }

        if (xmlnsCollection.length) {
          const { prefix } = parseName(item.name);
          // check item for the ns-attrs
          if (prefix) {
            removeNSfromCollection(prefix);
          }

          // check each attr for the ns-attrs
          for (const name of Object.keys(item.attributes)) {
            const { prefix } = parseName(name);
            removeNSfromCollection(prefix);
          }
        }

        // if nothing is found - go deeper
        if (xmlnsCollection.length && item.children) {
          monkeys(item);
        }
      }
    }

    return items;
  }

  data = monkeys(data);

  // remove svg element ns-attributes if they are not used even once
  if (xmlnsCollection.length) {
    xmlnsCollection.forEach(function (name) {
      delete svgElem.attributes['xmlns:' + name];
    });
  }

  return data;
};
