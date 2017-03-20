'use strict';

var csstree  = require('css-tree'),
    csstools = require('../css-tools');


var CSSStyleDeclaration = function(node) {
  this.parentNode = node;

  this.properties = new Map();
  this.hasSynced  = false;

  this.styleAttr  = null;
  this.styleValue = null;

  this.parseError = false;
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




CSSStyleDeclaration.prototype._loadCssText = function() {
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
    this.parseError = parseError;
    return;
  }
  this.parseError = false;

  var self = this;
  cssoDeclarations.children.each(function(cssoDeclaration) {
    var styleDeclaration = csstools.cssoToStyleDeclaration(cssoDeclaration);
    self.setProperty(styleDeclaration.name, styleDeclaration.value, styleDeclaration.priority);
  });
};


// only reads from properties

CSSStyleDeclaration.prototype.getCssText = function() {
  var properties = this.getProperties();

  if(this.parseError) {
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

CSSStyleDeclaration.prototype._handleParseError = function() {
  if(this.parseError) {
    console.warn("Warning: Parse error when parsing inline styles, style properties of this element cannot be used. The raw styles can still be get/set using .attr('style').value. Error details: " + this.parseError);
  }
};


CSSStyleDeclaration.prototype._getProperty = function(propertyName) {
  var properties = this.getProperties();
  this._handleParseError();

  var property = this.getProperties().get(propertyName.trim());
  return property;
};

CSSStyleDeclaration.prototype.getPropertyPriority = function(propertyName) {
  var property = this._getProperty(propertyName);
  return property ? property.priority : '';
};

CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName) {
  var property = this._getProperty(propertyName);
  return property ? property.value : null;
};

CSSStyleDeclaration.prototype.item = function(index) {
  var properties = this.getProperties();
  this._handleParseError();

  return Array.from(properties.keys())[index];
};

// Extra function for retrieving all style properties
CSSStyleDeclaration.prototype.getProperties = function() {
  this._loadCssText();
  return this.properties;
};


// writes to properties

CSSStyleDeclaration.prototype.removeProperty = function(propertyName) {
  this.hasStyle();

  var properties = this.getProperties();
  this._handleParseError();

  properties.delete(propertyName.trim());
};

CSSStyleDeclaration.prototype.setProperty = function(propertyName, value, priority) {
  this.hasStyle();

  var properties = this.getProperties();
  this._handleParseError();

  var property = {
    value:       value.trim(),
    priority: priority.trim()
  };
  properties.set(propertyName.trim(), property);

  return property;
};


module.exports = CSSStyleDeclaration;
