'use strict';

// DOMUtils API for SVGO AST (used by css-select)
module.exports = {

  // is the node a tag?
  // isTag: ( node:Node ) => isTag:Boolean
  isTag: function(node) {
    return (typeof node.elem !== 'undefined');
  },

  // does at least one of passed element nodes pass the test predicate?
  // existsOne: ( test:Predicate, elems:[ElementNode] ) => existsOne:Boolean
  existsOne: function(test, elems) {
    for(var i = 0, l = elems.length; i < l; i++){
      if(
        this.isTag(elems[i]) && (
          test(elems[i]) || (
            elems[i].content.length > 0 &&
            this.existsOne(test, elems[i].content)
          )
        )
      ){
        return true;
      }
    }

    return false;
  },

  // get the parent of the node
  // getParent: ( node:Node ) => parentNode:Node
  getParent: function(node) {
    return node.parent || null; // root item my be passed which got no parent
  },

  // get the node's children
  // getChildren: ( node:Node ) => children:[Node]
  getChildren: function(node) {
    var childNodes = [];
    node.content.forEach(function(childNode) {
      childNodes.push(childNode);
    });
    return childNodes;
  },

  /*
    get the siblings of the node. Note that unlike jQuery's `siblings` method,
    this is expected to include the current node as well
    TODO/Clarify: Add current node on top to returned siblings list?
  */
  // getSiblings: ( node:Node ) => siblings:[Node]
  getSiblings: function(node) {
    var parent = this.getParent(node);
    return this.getChildren(parent);
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

  // does the element have the named attribute?
  // hasAttrib: ( elem:ElementNode, name:String ) => hasAttrib:Boolean
  hasAttrib: function(elem, name) {
    return elem.hasAttr(name);
  },

  // finds all of the element nodes in the array that match the test predicate,
  // as well as any of their children that match it
  // findAll: ( test:Predicate, nodes:[Node] ) => elems:[ElementNode]
  findAll: function(test, nodes) {
    var result = [];
    for(var i = 0, j = nodes.length; i < j; i++){
      if(!this.isTag(nodes[i])) continue;
      if(test(nodes[i])) result.push(nodes[i]); // TODO!

      if(nodes[i].content && nodes[i].content.length > 0){
        result = result.concat(this.findAll(test, nodes[i].content));
      }
    }
    return result;
  },

  findOne: function(test, nodes) {
    var node = null;

    for(var i = 0, l = nodes.length; i < l && !node; i++){
      if(!this.isTag(nodes[i])){
        continue;
      } else if(test(nodes[i])){
        node = nodes[i];
      } else if(nodes[i].content && nodes[i].content.length > 0){
        node = this.findOne(test, nodes[i].content);
      }
    }

    return node;
  },

  // takes an array of nodes, and removes any duplicates, as well as any nodes
  // whose ancestors are also in the array
  // removeSubsets: ( nodes:[Node] ) => unique:[Node]
  removeSubsets: function(nodes) {
    var idx = nodes.length, node, ancestor, replace;

    // Check if each node (or one of its ancestors) is already contained in the
    // array.
    while (--idx > -1) {
      node = ancestor = nodes[idx];

      // Temporarily remove the node under consideration
      nodes[idx] = null;
      replace = true;

      while (ancestor) {
        if (nodes.indexOf(ancestor) > -1) {
          replace = false;
          nodes.splice(idx, 1);
          break;
        }
        ancestor = this.getParent(ancestor);
      }

      // If the node has been found to be unique, re-insert it.
      if (replace) {
        nodes[idx] = node;
      }
    }

    return nodes;
  },

  // get the attribute value
  // getAttributeValue: ( elem:ElementNode, name:String ) => value:String
  getAttributeValue: function(elem, name) {
    var attr = elem.attr(name);
    return attr && attr.value;
  },


  /*
    The adapter can also optionally include an equals method, if your DOM
    structure needs a custom equality test to compare two objects which refer
    to the same underlying node. If not provided, `css-select` will fall back to
    `a === b`.
  */
  // equals: ( a:Node, b:Node ) => Boolean
  // not needed for svgo AST
};
