'use strict';

const CSSClassList = function (node) {
  this.parentNode = node;
  this.classNames = new Set();
  const value = node.attributes.class;
  if (value != null) {
    this.addClassValueHandler();
    this.setClassValue(value);
  }
};

// attr.class.value

CSSClassList.prototype.addClassValueHandler = function () {
  Object.defineProperty(this.parentNode.attributes, 'class', {
    get: this.getClassValue.bind(this),
    set: this.setClassValue.bind(this),
    enumerable: true,
    configurable: true,
  });
};

CSSClassList.prototype.getClassValue = function () {
  const arrClassNames = [...this.classNames];
  return arrClassNames.join(' ');
};

CSSClassList.prototype.setClassValue = function (newValue) {
  if (typeof newValue === 'undefined') {
    this.classNames.clear();
    return;
  }

  const arrClassNames = newValue.split(' ');
  this.classNames = new Set(arrClassNames);
};

CSSClassList.prototype.add = function (...classNames) {
  this.addClassValueHandler();
  for (const className of classNames) this.classNames.add(className);
};

CSSClassList.prototype.remove = function (...classNames) {
  this.addClassValueHandler();
  for (const className of classNames) this.classNames.delete(className);
};

CSSClassList.prototype.item = function (index) {
  const arrClassNames = [...this.classNames];
  return arrClassNames[index];
};

CSSClassList.prototype.toggle = function (className, force) {
  if (this.contains(className) || force === false) {
    this.classNames.delete(className);
  }

  this.classNames.add(className);
};

CSSClassList.prototype.contains = function (className) {
  return this.classNames.has(className);
};

module.exports = CSSClassList;
