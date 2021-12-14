'use strict';

function findElementByName(svg, name) {
  let result;
  walkTree(svg, function (node) {
    if (node.name === name) {
      result = node;
    }
  });
  return result;
}

exports.findElementByName = findElementByName;

function findAllElementByName(svg, name) {
  var result = [];
  walkTree(svg, function (node) {
    if (node.type === 'element' && node.name === name) {
      result.push(node);
    }
  });
  return result;
}
exports.findAllElementByName = findAllElementByName;

//find all elements with a given attribute
function findAllElementByAttribute(svg, attribute) {
  var result = [];
  walkTree(svg, function (node) {
    if (
      node.type === 'element' &&
      node.attributes.hasOwnProperty.call(node.attributes, attribute)
    ) {
      result.push(node);
    }
  });
  return result;
}
exports.findAllElementByAttribute = findAllElementByAttribute;

//find all elements with a given attribute
function findAllElementByAttributeValue(svg, attribute, value) {
  var result = [];
  walkTree(svg, function (node) {
    if (
      node.type === 'element' &&
      node.attributes.hasOwnProperty.call(node.attributes, attribute) &&
      node.attributes[attribute] === value
    ) {
      result.push(node);
    }
  });
  return result;
}
exports.findAllElementByAttributeValue = findAllElementByAttributeValue;

// find all shape elements
function findAllShapeElements(svg) {
  var result = [];
  const shapeElements = [
    'circle',
    'ellipse',
    'line',
    'polygon',
    'polyline',
    'rect',
    'path',
  ];
  walkTree(svg, function (node) {
    if (node.type === 'element' && shapeElements.includes(node.name)) {
      result.push(node);
    }
  });
  return result;
}
exports.findAllShapeElements = findAllShapeElements;

function findFillElementsByColors(svg, colors) {
  var result = [];

  const shapeElements = [
    'circle',
    'ellipse',
    'line',
    'polygon',
    'polyline',
    'rect',
    'path',
  ];

  walkTree(svg, function (node) {
    if (node.type === 'element' && shapeElements.includes(node.name)) {
      if (node.attributes.fill) {
        colors.includes(node.attributes.fill.toUpperCase())
          ? result.push(node.attributes.fill)
          : null;
      }
    }
  });
  return result;
}
exports.findFillElementsByColors = findFillElementsByColors;

// count all children in object
function countElements(svg) {
  var count = 0;
  walkTree(svg, function (node) {
    if (node.type === 'element') {
      count++;
    }
  });
  return count;
}
exports.countElements = countElements;

//find all elements with a given attribute
function walkTree(svg, callback) {
  if (!isWalkable(svg)) {
    throw Error(
      'There was a technical error in the asset validation engine. Please contact the design system theme with the assets you are trying to validate'
    );
  }
  for (const child of svg.children) {
    if (!isWalkable(child)) {
      continue;
    }
    callback(child);
    walkTree(child, callback);
  }
}
exports.walkTree = walkTree;

function isWalkable(svg) {
  if (svg.children === undefined) {
    return false;
  } else {
    return true;
  }
}
