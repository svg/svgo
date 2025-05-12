'use strict';

exports.type = 'validate';
exports.name = 'ensureSingleRootG';
exports.active = true;
exports.description = 'Checks if all visual elements in SVG are contained within a single top-level <g> element, with only <defs> allowed outside.';

const ALLOWED_OUTSIDE_G = new Set(['defs']);

/**
 * Plugin entry point for ensureSingleRootG
 * @param {Object} root - The root of the SVG AST
 * @param {Object} validateResult - The validation result object
 * @param {Object} params - Plugin parameters (currently unused)
 * @return {Object} validateResult holding the validation result
 * @author Piotr Sobierski
 */
exports.fn = function (root, validateResult, params) {
  let passesRule = false;

  const svgElement = root.children && root.children.length > 0 && 
                    root.children.find(child => child.type === 'element' && child.name === 'svg');
                    
  if (!svgElement) {
    validateResult.ensureSingleRootG = false;
    return validateResult;
  }

  const svgDirectChildren = svgElement.children ? 
                            svgElement.children.filter(child => child.type === 'element') : 
                            [];

  const gElements = svgDirectChildren.filter(element => element.name === 'g');
  const nonAllowedElements = svgDirectChildren.filter(element => 
    element.name !== 'g' && !ALLOWED_OUTSIDE_G.has(element.name)
  );

  if (gElements.length === 1 && nonAllowedElements.length === 0) {
    passesRule = true;
  }

  validateResult.ensureSingleRootG = passesRule;
  return validateResult;
}; 