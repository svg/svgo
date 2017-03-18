'use strict';

var csstree  = require('css-tree'),
    csstools = require('../css-tools');

var CSSStyleDeclaration = function(node) {
  this.parentNode = node;

  this.properties = new Map();
  this.length     = 0;

  this.update(); // initialize with styles from style attribute
};


CSSStyleDeclaration.prototype.update = function() {
  var self = this;
  if(!this.parentNode.hasAttr('style')) {
    return;
  }
  var inlineCssStr = this.parentNode.attr('style').value;
  var cssoDeclarations = csstree.parse(inlineCssStr, {context: 'declarationList'});
  cssoDeclarations.children.each(function(cssoDeclaration) {
    var styleDeclaration = csstools.cssoToStyleDeclaration(cssoDeclaration);
    self.setProperty(styleDeclaration.name, styleDeclaration.property.value, styleDeclaration.property.priority);
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
  if(!propertyName) {
    return false;
  }

  var property = { // always overwrites
    value:    value,
    priority: priority
  };

  this.properties.set(propertyName, property);
  this.length = this.properties.size;

  return this.properties.get(propertyName);
};


module.exports = CSSStyleDeclaration;
