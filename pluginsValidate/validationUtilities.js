'use strict';

function findElementByName(svg, name) {
  for (const child of svg.children) {
    if (child.name === name) {
      return child;
    } else {
      return findElementByName(child, name);
    }
  }
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
    if (
      node.type === 'element' &&
      shapeElements.includes(node.name) &&
      colors.includes(node.attributes.fill)
    ) {
      result.push(node);
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
  for (const child of svg.children) {
    callback(child);
    walkTree(child, callback);
  }
}
exports.walkTree = walkTree;
