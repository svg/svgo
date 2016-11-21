'use strict';

// Adds parent reference to each item 
// (except the topmost root item which got no parent).

var addParentRefs = function(data) {
  if(data.isEmpty()) {
    return;
  }
  var i      = 0,
      length = data.content.length,
      item;
  while(i < length) {
    item = data.content[i];
    item.parent = data;
    addParentRefs(item);
    i++;
  }
  return data;
};

module.exports = addParentRefs;
