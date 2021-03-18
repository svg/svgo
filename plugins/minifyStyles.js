'use strict';

exports.type = 'full';

exports.active = true;

exports.description =
  'minifies styles and removes unused styles based on usage data';

exports.params = {
  // ... CSSO options goes here

  // additional
  usage: {
    force: false, // force to use usage data even if it unsafe (document contains <script> or on* attributes)
    ids: true,
    classes: true,
    tags: true,
  },
};

var csso = require('csso');

/**
 * Minifies styles (<style> element + style attribute) using CSSO
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function (ast, options) {
  options = options || {};

  var minifyOptionsForStylesheet = cloneObject(options);
  var minifyOptionsForAttribute = cloneObject(options);
  var elems = findStyleElems(ast);

  minifyOptionsForStylesheet.usage = collectUsageData(ast, options);
  minifyOptionsForAttribute.usage = null;

  elems.forEach(function (elem) {
    if (elem.isElem('style')) {
      if (
        elem.children[0].type === 'text' ||
        elem.children[0].type === 'cdata'
      ) {
        const styleCss = elem.children[0].value;
        const minified = csso.minify(styleCss, minifyOptionsForStylesheet).css;
        // preserve cdata if necessary
        // TODO split cdata -> text optimisation into separate plugin
        if (styleCss.indexOf('>') >= 0 || styleCss.indexOf('<') >= 0) {
          elem.children[0].type = 'cdata';
          elem.children[0].value = minified;
        } else {
          elem.children[0].type = 'text';
          elem.children[0].value = minified;
        }
      }
    } else {
      // style attribute
      var elemStyle = elem.attributes.style;

      elem.attributes.style = csso.minifyBlock(
        elemStyle,
        minifyOptionsForAttribute
      ).css;
    }
  });

  return ast;
};

function cloneObject(obj) {
  return { ...obj };
}

function findStyleElems(ast) {
  function walk(items, styles) {
    for (var i = 0; i < items.children.length; i++) {
      var item = items.children[i];

      // go deeper
      if (item.children) {
        walk(item, styles);
      }

      if (item.isElem('style') && item.children.length !== 0) {
        styles.push(item);
      } else if (item.type === 'element' && item.attributes.style != null) {
        styles.push(item);
      }
    }

    return styles;
  }

  return walk(ast, []);
}

function shouldFilter(options, name) {
  if ('usage' in options === false) {
    return true;
  }

  if (options.usage && name in options.usage === false) {
    return true;
  }

  return Boolean(options.usage && options.usage[name]);
}

function collectUsageData(ast, options) {
  function walk(items, usageData) {
    for (const item of items.children) {
      // go deeper
      if (item.type === 'root' || item.type === 'element') {
        walk(item, usageData);
      }

      if (item.type === 'element') {
        if (item.name === 'script') {
          safe = false;
        }

        usageData.tags[item.name] = true;

        if (item.attributes.id != null) {
          usageData.ids[item.attributes.id] = true;
        }

        if (item.attributes.class != null) {
          item.attributes.class
            .replace(/^\s+|\s+$/g, '')
            .split(/\s+/)
            .forEach(function (className) {
              usageData.classes[className] = true;
            });
        }

        if (Object.keys(item.attributes).some((name) => /^on/i.test(name))) {
          safe = false;
        }
      }
    }

    return usageData;
  }

  var safe = true;
  var usageData = {};
  var hasData = false;
  var rawData = walk(ast, {
    ids: Object.create(null),
    classes: Object.create(null),
    tags: Object.create(null),
  });

  if (!safe && options.usage && options.usage.force) {
    safe = true;
  }

  for (const [key, data] of Object.entries(rawData)) {
    if (shouldFilter(options, key)) {
      usageData[key] = Object.keys(data);
      hasData = true;
    }
  }

  return safe && hasData ? usageData : null;
}
