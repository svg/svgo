'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'Move duplicated paths into a defs element, and reference them via use/href';

const uniquePathsToSourceElements = {};
let idPrefix = 'dedupedpath-';
let idCount = 0;
let pathLengthThreshold = 24;
let duplicatesCountThreshold = 2;
let documentElement;

/*
 * Find identical paths and move them to a global defs object,
 * Replacing them with a <use href="#generated-path-id" ...>
 *
 * @author Sam Foster
 */

exports.fn = function (data, params, info) {
  if (!documentElement) {
    documentElement = data.content.find(function(node) {
      return node.isElem('svg');
    });
  }
  if (!documentElement) {
    // no root <svg>?
    return data;
  }
  if (params) {
    if (params.idPrefix) {
      idPrefix = params.idPrefix;
    }
    if (params.pathLengthThreshold) {
      pathLengthThreshold = params.pathLengthThreshold;
    }
    if (params.duplicatesCountThreshold) {
      duplicatesCountThreshold = params.duplicatesCountThreshold;
    }
  }
  // populate uniquePathsToSourceElements
  walkChildren(documentElement.content);

  Object.keys(uniquePathsToSourceElements).forEach(function(key) {
    let elems = uniquePathsToSourceElements[key];
    if (elems.length >= duplicatesCountThreshold) {
      let defs = getOrCreateDefsElement(documentElement);
      let path = appendSharedPath(key, defs);
      let id = path.attr("id").value;

      elems.forEach(function(elem) {
        convertToUseElement(elem, id);
      });
    }
  });
  return data;
}

function handleElement(elem) {
  // Skip over a <defs> child of the top-most <svg>
  if (elem.isElem("defs") && elem.parentNode == documentElement) {
    return false;
  }
  if (elem.hasAttr("d")) {
    let key = elem.attr("d").value.trim();
    if (elem.hasAttr("id")) {
      // Skip elements which already have an id
      return false;
    }
    if (key.length >= pathLengthThreshold) {
      if (!uniquePathsToSourceElements[key]) {
          uniquePathsToSourceElements[key] = [];
      }
      uniquePathsToSourceElements[key].push(elem);
    }
  }
  return true;
}

function appendSharedPath(path, defs) {
  if (!defs.content) {
    defs.content = [];
  }
  let id = idPrefix + (idCount++);
  let CTOR = defs.constructor;
  let pathElem = new CTOR({
    'elem': 'path',
    'prefix': '',
    'local': 'path',
  }, defs);
  pathElem.addAttr({
    'name': 'd',
    'prefix': '',
    'local': 'd',
    'value': path
  });
  pathElem.addAttr({
    'name': 'id',
    'prefix': '',
    'local': 'id',
    'value': id
  });
  defs.spliceContent(0, 0, pathElem);
  return pathElem;
}

function getOrCreateDefsElement(svg) {
  let defs = svg.content.find(function(node) {
    return node.isElem("defs");
  });
  if (!defs) {
    let CTOR = svg.constructor;
    defs = new CTOR({
        'elem': 'defs',
        'prefix': '',
        'local': 'defs',
        'attrs': {},
        'content': []
    }, svg);
    defs.content = [];
    svg.spliceContent(0, 0, defs);
  }
  return defs;
}

function convertToUseElement(elem, id) {
  elem.renameElem('use');
  elem.addAttr({
    'name': 'href',
    'prefix': '',
    'local': 'href',
    'value': '#'+id
  });
  elem.removeAttr('d');
}

function walkChildren(nodes) {
  if (!(nodes && nodes.length)) {
    return;
  }
  nodes.forEach(function(node) {
    if (node.isElem()) {
      let descend = handleElement(node);
      if (!node.isEmpty()) {
        walkChildren(node.content);
      }
    }
  });
}
