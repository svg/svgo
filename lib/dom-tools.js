'use strict';

var CssRx = require('css-url-regex'),
    rxId = /^#(.*)$/; // regular expression for matching an ID + extracing its name

// Checks if attribute is empty
var attrNotEmpty = function(attr) {
    return (attr && attr.value && attr.value.length > 0);
};

// Escapes a string for being used as ID
var escapeIdentifierName = function(str) {
    return str.replace(/[\. ]/g, '_');
};

// Matches an #ID value, captures the ID name
var matchId = function(urlVal) {
    var idUrlMatches = urlVal.match(rxId);
    if (idUrlMatches === null) {
        return false;
    }
    return idUrlMatches[1];
};

// Matches an url(...) value, captures the URL
var matchUrl = function(val) {
    var cssRx = new CssRx(); // workaround for https://github.com/cssstats/css-url-regex/issues/4
    var urlMatches = cssRx.exec(val);
    if (urlMatches === null) {
        return false;
    }
    return urlMatches[1];
};

module.exports.rxId = rxId;
module.exports.attrNotEmpty = attrNotEmpty;
module.exports.escapeIdentifierName = escapeIdentifierName;
module.exports.matchId = matchId;
module.exports.matchUrl = matchUrl;
