'use strict';

const fs = require('fs');
const path = require('path');
const { validate } = require('../lib/svgo.js');

/**
 * Runs a specific validation rule against an SVG file
 * 
 * @param {string} svgFilePath - Path to the SVG file
 * @param {string} ruleName - Name of the validation rule to run
 * @returns {Object} - Result object with success flag and any error messages
 */
function validateSvgWithRule(svgFilePath, ruleName) {
  try {
    if (!fs.existsSync(svgFilePath)) {
      return { success: false, error: `File not found: ${svgFilePath}` };
    }

    const svgContent = fs.readFileSync(svgFilePath, 'utf8');
    
    const plugin = {
      name: ruleName,
      params: {},
    };

    const result = validate(svgContent, svgFilePath, null, {
      path: svgFilePath,
      plugins: [plugin],
      js2svg: { pretty: true },
    });

    const passed = result[ruleName] === true;
    
    return {
      success: true,
      passed,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
 
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node runValidation.js <svg-file-path> <rule-name>');
    process.exit(1);
  }

  const [svgFilePath, ruleName] = args;
  
  const result = validateSvgWithRule(svgFilePath, ruleName);
  
  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
  
  if (result.passed) {
    console.log(`✓ PASS: ${path.basename(svgFilePath)} [${ruleName}]`);
    process.exit(0);
  } else {
    console.log(`✗ FAIL: ${path.basename(svgFilePath)} [${ruleName}]`);
    process.exit(1);
  }
}

module.exports = { validateSvgWithRule }; 