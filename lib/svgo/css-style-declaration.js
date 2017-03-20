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
  this.addStyleHandler();
};




// attr.style
CSSStyleDeclaration.prototype.addStyleHandler = function() {
  if(Object.getOwnPropertyDescriptor(this.parentNode.attrs, 'style')) {
    return;
  }

  Object.defineProperty(this.parentNode.attrs, 'style', {
    get:          this.getStyleAttr.bind(this),
    set:          this.setStyleAttr.bind(this),
    enumerable:   true,
    configurable: true
  });

  this.styleAttr = {
      'name':  'style'
  };
  this.addValueHandler();
};


// attr.style.value
CSSStyleDeclaration.prototype.addValueHandler = function() {
  if(Object.getOwnPropertyDescriptor(this.styleAttr, 'value')) {
    return;
  }

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
  console.log(newStyleAttr);
  this.setStyleValue(this.styleAttr.value); // must before applying value handler!

  this.styleAttr = newStyleAttr;
  this.addValueHandler();
  this.hasSynced = false;
};

CSSStyleDeclaration.prototype.getStyleValue = function() {
  this.loadCssText();
  if(this.hasParseError) {
    // in case of a parse error, pass through original styles
    return this.styleValue;
  }
  return this.getCssText();
};

CSSStyleDeclaration.prototype.setStyleValue = function(val) {
  this.properties.clear(); // reset all existing properties
  this.styleValue = val;
  this.hasSynced  = false;
};


CSSStyleDeclaration.prototype.loadCssText = function() {
  if(this.hasSynced) {
    return;
  }
  this.hasSynced = true; // must be set at beginning!

  if(!this.styleValue || this.styleValue.length == 0) {
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
  var cssText = [];
  this.properties.forEach(function(property, propertyName) {
    var strImportant = property.priority === 'important' ? '!important' : '';
    cssText.push(propertyName.trim() + ':' + property.value.trim() + strImportant);
  });
  return cssText.join(';');
};


CSSStyleDeclaration.prototype.getPropertyPriority = function(propertyName) {
  var property = this.properties.get(propertyName);
  return property ? property.priority : '';
};

CSSStyleDeclaration.prototype.getPropertyValue = function(propertyName) {
  var property = this.properties.get(propertyName);
  return property ? property.value : null;
};

CSSStyleDeclaration.prototype.item = function(index) {
  return Array.from(this.properties.keys())[index];
};

CSSStyleDeclaration.prototype.removeProperty = function(propertyName) {
  this.properties.delete(propertyName);
  this.length = this.properties.size;
};

CSSStyleDeclaration.prototype.setProperty = function(propertyName, value, priority) {
  if(this.hasSynced) {
    console.log('(Internal)' + propertyName);
  }
  if(!propertyName) {
    return false;
  }
  this.hasStyle();
  this.loadCssText();

  var property = { // always overwrites
    value:    value,
    priority: priority
  };

  this.properties.set(propertyName, property);
  this.length = this.properties.size;

  return this.properties.get(propertyName);
};


// Extra function for retrieving all style properties
CSSStyleDeclaration.prototype.getProperties = function() {
  return this.properties;
};


module.exports = CSSStyleDeclaration;
