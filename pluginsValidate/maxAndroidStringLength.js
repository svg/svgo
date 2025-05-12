'use strict';

exports.type = 'validate';
exports.name = 'maxAndroidStringLength';
exports.active = true;
exports.description = 'Checks that no string in the SVG exceeds Android\'s maximum string length (32,767 characters).';

const MAX_ANDROID_STRING_LENGTH = 32767;

/**
 * Recursively checks that no string in the SVG exceeds Android's maximum string length (32,767 characters).
 *
 * @example
 *
 * @param {any} node - The current node in the SVG AST
 * @return {boolean} Whether all strings are within the allowed length
 *
 * @author Piotr Sobierski
 */
function checkStringLength(node) {
  if (typeof node.value === 'string' && node.value.length > MAX_ANDROID_STRING_LENGTH) {
    return false;
  }
  if (node.attributes) {
    for (const attributeName in node.attributes) {
      const attributeValue = node.attributes[attributeName];
      if (typeof attributeValue === 'string' && attributeValue.length > MAX_ANDROID_STRING_LENGTH) {
        return false;
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const childNode of node.children) {
      if (!checkStringLength(childNode)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Plugin entry point for maxAndroidStringLength
 * @param {any} root - The root of the SVG AST
 * @param {any} validateResult - The validation result object
 * @return {any} validateResult holding the validation result
 */
exports.fn = function (root, validateResult) {
  const passesRule = checkStringLength(root);
  (validateResult).maxAndroidStringLength = passesRule;
  return validateResult;
}; 