'use strict';

exports.type = 'perItem';

exports.active = false;

exports.params = {
    delim: '__'
};

exports.description = 'prefix IDs';


var path      = require('path'),
    csstree   = require('css-tree'),
    cssRx     = require('css-url-regex')(),
    rxId      = /^#(.*)$/; // regular expression for matching an ID + extracing its name

var escapeIdentifierName = function(str) {
    return str.replace(/[\. ]/g, '_');
};


var matchId = function(urlVal) {
    var idUrlMatches = urlVal.match(rxId);
    if(idUrlMatches === null) {
      return false;
    }
    return idUrlMatches[1];
};

var matchUrl = function(val) {
    var urlMatches = cssRx.exec(val);
    if(urlMatches === null) {
        return false;
    }
    return urlMatches[1];
};

/**
 * Prefixes identifiers
 *
 * @param {Object} node node
 * @param {Object} opts plugin params
 * @param {Object} extra plugin extra information
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(node, opts, extra) {

    // prefix
    var prefix = 'prefix';
    if(extra && extra.prefix && extra.path.length > 0) {
        prefix = opts.extra.prefix;
    } else if(extra && extra.path && extra.path.length > 0) {
        var filename = path.basename(extra.path);
        prefix = filename;
    }

    var addPrefix = function(name) {
        return escapeIdentifierName(prefix + opts.delim + name);
    };
    var prefixId = function(val) {
        var idName = matchId(val);
        if(!idName) {
            return false;
        }
        return '#' + addPrefix(idName);
    };


    // <style/>
    if(node.elem === 'style') {
        if (node.isEmpty()) {
            // skip empty <style/>s
            return node;
        }

        var cssStr = node.content[0].text || node.content[0].cdata || [];

        var cssAst = {};
        try {
            cssAst = csstree.parse(cssStr, {
                parseValue: true,
                parseCustomProperty: false
            });
        } catch (parseError) {
            console.warn('Warning: Parse error of styles of <style/> element, skipped. Error details: ' + parseError);
            return node;
        }

        var idName         = '',
            idNamePrefixed = '';

        csstree.walk(cssAst, function(node) {

            // #ID, .class
            console.log(node.type);
            if((node.type === 'IdSelector' || 
                node.type === 'ClassSelector') &&
               node.name) {
                 node.name = addPrefix(node.name);
                 return; // skip further
            }

            // url(...) in value
            if(node.type === 'Url' &&
               node.value.value && node.value.value.length > 0) {
                 var idPrefixed = prefixId(node.value.value);
                 if(!idPrefixed) {
                   return; // skip further
                 }
                 node.value.value = idPrefixed;
            }

        });

        // update <style>s
        node.content[0].text = csstree.translate(cssAst);
        return node;
    }


    // element attributes
    if(!node.attrs) {
      return node;
    }

    for(var attrName in node.attrs) {
      var attr = node.attrs[attrName];

      if(!attr.value || attr.value.length === 0) {
          continue;
      }


      // id/class
      if(attrName === 'id' || 
         attrName === 'class') {
          attr.value = addPrefix(attr.value);
          continue;
      }


      // (xlink:)href (deprecated, must be still supported),
      // href
      if(attr.name === 'xlink:href' ||
         attr.name === 'href') {
        var idPrefixed = prefixId(attr.value);
        if(!idPrefixed) {
          continue;
        }
        attr.value = idPrefixed;
        continue;
      }


      // url(...) in value
      var urlVal = matchUrl(attr.value);
      if(!urlVal) {
          return node;
      }

      idPrefixed = prefixId(urlVal);
      if(!idPrefixed) {
          return node;
      }

      attr.value = 'url(' + idPrefixed + ')';
    }


    return node;
};
