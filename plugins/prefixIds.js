'use strict';

exports.type = 'perItem';

exports.active = true;

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


    // <style/>
    if(node.elem === 'style') {
        if (node.isEmpty()) {
            // skip empty <style/>s
            return;
        }

        var cssStr = node.content[0].text || node.content[0].cdata || [];

        var cssAst = {};
        try {
            cssAst = csstree.parse(cssStr, {
                parseValue: false,
                parseCustomProperty: false
            });
        } catch (parseError) {
            console.warn('Warning: Parse error of styles of <style/> element, skipped. Error details: ' + parseError);
            return;
        }

        csstree.walk(cssAst, function(node) {
            if(node.type !== 'IdSelector' && 
               node.type !== 'ClassSelector') {
                 return;
            }

            node.name = addPrefix(node.name);
        });

        // update <style>s
        node.content[0].text = csstree.translate(cssAst);
        return node;
    }


    // element attributes
    if(!node.attrs) {
      return;
    }

    for(var attrName in node.attrs) {
      var attr = node.attrs[attrName];

      // id/class
      if(attrName === 'id' || 
         attrName === 'class') {
        attr.value = addPrefix(attr.value);
        continue;
      }


      var urlVal         = '',
          idUrlMatches   = [],
          idName         = '',
          idNamePrefixed = '',
          idUrlPrefixed  = '';

      // (xlink:)href (deprecated, must be still supported),
      // href
      if(attr.name === 'xlink:href' ||
         attr.name === 'href') {
        urlVal = attr.value;

        idUrlMatches = urlVal.match(rxId);
        if(idUrlMatches === null) {
          continue;
        }
        idName = idUrlMatches[1];

        idNamePrefixed = addPrefix(idName);
        idUrlPrefixed  = '#' + idNamePrefixed;

        attr.value = idUrlPrefixed;
      }


      // url(...)
      var urlMatches = cssRx.exec(attr.value);
      if(urlMatches === null) {
        continue;
      }
      urlVal = urlMatches[1];

      idUrlMatches = urlVal.match(rxId);
      if(idUrlMatches === null) {
        continue;
      }
      idName = idUrlMatches[1];

      idNamePrefixed = addPrefix(idName);
      idUrlPrefixed  = '#' + idNamePrefixed;

      attr.value = 'url(' + idUrlPrefixed + ')';
    }


    return node;
};
