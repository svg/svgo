'use strict';

// DOMUtils API for SVGO AST (used by css-select)

var domUtilsSvgo = {};

domUtilsSvgo.isTag = function(node) {
  return node.elem;
};

domUtilsSvgo.getParent = function(node) {
  return node.parent || null; // root item my be passed which got no parent
};

domUtilsSvgo.getChildren = function(node) {
  var childNodes = [];
  node.content.forEach(function(childNode) {
    childNodes.push(childNode);
  });
  return childNodes;
};

domUtilsSvgo.getSiblings = function(node) {
  var parent = domUtilsSvgo.getParent(node);
  return domUtilsSvgo.getChildren(parent);
};

domUtilsSvgo.getName = function(node) {
  return node.elem;
};

domUtilsSvgo.getText = function(node) {
  var nodeText = node.content[0].text || node.content[0].cdata || [],
          DATA = nodeText.indexOf('>') >= 0 || nodeText.indexOf('<') >= 0 ? 'cdata' : 'text';
  return DATA;
};

domUtilsSvgo.hasAttrib = function(node, name) {
  return node.hasAttr(name);
};

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

// Given an array of nodes, remove any member that is contained by another.
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

domUtilsSvgo.getAttributeValue = function(elem, name) {
  var attr = elem.attr(name);
  return attr && attr.value;
};


module.exports = domUtilsSvgo;
