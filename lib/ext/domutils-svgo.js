'use strict';

// DOMUtils API for SVGO AST (used by css-select)

var domUtilsSvgo = {};

// is the node a tag?
domUtilsSvgo.isTag = function(node) {
  return node.elem;
};

// does at least one of passed element nodes pass the test predicate?


// get the parent of the node
domUtilsSvgo.getParent = function(node) {
  return node.parent || null; // root item my be passed which got no parent
};

// get the node's children
domUtilsSvgo.getChildren = function(node) {
  var childNodes = [];
  node.content.forEach(function(childNode) {
    childNodes.push(childNode);
  });
  return childNodes;
};

/*
  get the siblings of the node. Note that unlike jQuery's `siblings` method,
  this is expected to include the current node as well
  TODO/Clarify: Add current node on top to returned siblings list?
*/
domUtilsSvgo.getSiblings = function(node) {
  var parent = domUtilsSvgo.getParent(node);
  return domUtilsSvgo.getChildren(parent);
};

// get the name of the tag
domUtilsSvgo.getName = function(node) {
  return node.elem;
};

// get the text content of the node, and its children if it has any
domUtilsSvgo.getText = function(node) {
  var nodeText = node.content[0].text || node.content[0].cdata || [],
          DATA = nodeText.indexOf('>') >= 0 || nodeText.indexOf('<') >= 0 ? 'cdata' : 'text';
  return DATA;
};

// does the element have the named attribute?
domUtilsSvgo.hasAttrib = function(node, name) {
  return node.hasAttr(name);
};

// finds all of the element nodes in the array that match the test predicate,
// as well as any of their children that match it
domUtilsSvgo.findAll = function(test, nodes) {
  var result = [];
	for(var i = 0, j = nodes.length; i < j; i++){
		if(!domUtilsSvgo.isTag(nodes[i])) continue;
		if(test(nodes[i])) result.push(nodes[i]); // TODO!

		if(nodes[i].content && nodes[i].content.length > 0){
			result = result.concat(domUtilsSvgo.findAll(test, nodes[i].content));
		}
	}
	return result;
};

domUtilsSvgo.findOne = function(test, nodes) {
  var node = null;

	for(var i = 0, l = nodes.length; i < l && !node; i++){
		if(!domUtilsSvgo.isTag(nodes[i])){
			continue;
		} else if(test(nodes[i])){
			node = nodes[i];
		} else if(nodes[i].content && nodes[i].content.length > 0){
			node = domUtilsSvgo.findOne(test, nodes[i].content);
		}
	}

	return node;
};

// takes an array of nodes, and removes any duplicates, as well as any nodes
// whose ancestors are also in the array
domUtilsSvgo.removeSubsets = function(nodes) {
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
			ancestor = domUtilsSvgo.getParent(ancestor);
		}

		// If the node has been found to be unique, re-insert it.
		if (replace) {
			nodes[idx] = node;
		}
	}

	return nodes;
};

// get the attribute value
domUtilsSvgo.getAttributeValue = function(elem, name) {
  var attr = elem.attr(name);
  return attr && attr.value;
};


/*
  The adapter can also optionally include an equals method, if your DOM
  structure needs a custom equality test to compare two objects which refer
  to the same underlying node. If not provided, `css-select` will fall back to
  `a === b`.
*/
// equals: ( a:Node, b:Node ) => Boolean
// not needed for svgo AST


module.exports = domUtilsSvgo;
