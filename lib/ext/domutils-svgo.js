'use strict';

var baseAdapter = require('css-select-base-adapter');
require('object.assign').shim(); // for node v0.1x support

// DOMUtils API for SVGO AST (used by css-select)
var svgoMinAdapter = {

  // is the node a tag?
  // isTag: ( node:Node ) => isTag:Boolean
  isTag: function(node) {
    return node.isElem();
  },

  // get the parent of the node
  // getParent: ( node:Node ) => parentNode:Node
  getParent: function(node) {
    return node.parent || null; // root item my be passed which got no parent
  },

  // get the node's children
  // getChildren: ( node:Node ) => children:[Node]
  getChildren: function(node) {
    return node.content || [];
  },

  // get the name of the tag
  // getName: ( elem:ElementNode ) => tagName:String
  getName: function(elemAst) {
    return elemAst.elem;
  },

  // get the text content of the node, and its children if it has any
  // getText: ( node:Node ) => text:String
  getText: function(node) {
    var nodeText = node.content[0].text || node.content[0].cdata || [],
            DATA = nodeText.indexOf('>') >= 0 || nodeText.indexOf('<') >= 0 ? 'cdata' : 'text';
    return DATA;
  },

  // get the attribute value
  // getAttributeValue: ( elem:ElementNode, name:String ) => value:String
  getAttributeValue: function(elem, name) {
    var attr = elem.attr(name);
    return attr && attr.value;
  }
};

// use base adapter for default implementations
var svgoAdapter = baseAdapter(svgoMinAdapter);

module.exports  = svgoAdapter;
