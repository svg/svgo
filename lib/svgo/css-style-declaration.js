'use strict';

var csstree  = require('css-tree'),
    csstools = require('../css-tools');

var CSSStyleDeclaration = function(node) {
  this.parentNode = node;

  this.properties = new Map();
  this.hasSynced  = false;

  this.styleAttr     = null;
  this.styleValue    = null;

  this.hasParseError = false;
};

CSSStyleDeclaration.prototype.hasStyle = function() {
  this.styleAttr = { // empty style attr
      'name':  'style',
      'value': null
  };

  this.addStyleHandler();
};


// attr.style
CSSStyleDeclaration.prototype.addStyleHandler = function() {

  Object.defineProperty(this.parentNode.attrs, 'style', {
    get:          this.getStyleAttr.bind(this),
    set:          this.setStyleAttr.bind(this),
    enumerable:   true,
    configurable: true
  });

  this.addStyleValueHandler();
};

// attr.style.value
CSSStyleDeclaration.prototype.addStyleValueHandler = function() {

  Object.defineProperty(this.styleAttr, 'value', {
    get:          this.getStyleValue.bind(this),
    set:          this.setStyleValue.bind(this),
    enumerable:   true,
    configurable: true
  });
};

CSSStyleDeclaration.prototype.getStyleAttr = function() {
  return this.styleAttr;
};

CSSStyleDeclaration.prototype.setStyleAttr = function(newStyleAttr) {
  this.setStyleValue(newStyleAttr.value); // must before applying value handler!

  this.styleAttr = newStyleAttr;
  this.addStyleValueHandler();
  this.hasSynced = false; // raw css changed
};

CSSStyleDeclaration.prototype.getStyleValue = function() {
  return this.getCssText();
};

CSSStyleDeclaration.prototype.setStyleValue = function(newValue) {
  this.properties.clear(); // reset all existing properties
  this.styleValue = newValue;
  this.hasSynced  = false; // raw css changed
};


CSSStyleDeclaration.prototype.loadCssText = function() {
  if(this.hasSynced) {
    return;
  }
  this.hasSynced = true; // must be set here to prevent loop in setProperty(...)

  if(!this.styleValue || this.styleValue.length === 0) {
    return;
  }
  var inlineCssStr = this.styleValue;

  var cssoDeclarations = {};
  try {
    cssoDeclarations = csstree.parse(inlineCssStr, {context: 'declarationList', parseValue: false});
  } catch(parseError) {
    this.hasParseError = true;
    return;
  }

  var self = this;
  cssoDeclarations.children.each(function(cssoDeclaration) {
    var styleDeclaration = csstools.cssoToStyleDeclaration(cssoDeclaration);
    self.setProperty(styleDeclaration.name, styleDeclaration.value, styleDeclaration.priority);
  });
};

CSSStyleDeclaration.prototype.getCssText = function() {
  var properties = this.getProperties();

  if(this.hasParseError) {
    // in case of a parse error, pass through original styles
    return this.styleValue;
  }

  var cssText = [];
  properties.forEach(function(property, propertyName) {
    var strImportant = property.priority === 'important' ? '!important' : '';
    cssText.push(propertyName.trim() + ':' + property.value.trim() + strImportant);
  });
  return cssText.join(';');
};

CSSStyleDeclaration.prototype.getPropertyPriority = function(propertyName) {
  var property = this.getProperties().get(propertyName.trim());
  return property ? property.priority : '';
};

CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName) {
  var property = this.getProperties().get(propertyName.trim());
  return property ? property.value : null;
};

CSSStyleDeclaration.prototype.item = function(index) {
  return Array.from(this.getProperties().keys())[index];
};


CSSStyleDeclaration.prototype.removeProperty = function(propertyName) {
  this.hasStyle();
  this.getProperties().delete(propertyName.trim());
};

CSSStyleDeclaration.prototype.setProperty = function(propertyName, value, priority) {
  this.hasStyle();

  var property = {
    value:       value.trim(),
    priority: priority.trim()
  };
  this.getProperties().set(propertyName.trim(), property);

  return property;
};


// Extra function for retrieving all style properties
CSSStyleDeclaration.prototype.getProperties = function() {
  this.loadCssText();
  return this.properties;
};


module.exports = CSSStyleDeclaration;
