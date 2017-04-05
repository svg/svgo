'use strict';

exports.type = 'full';

exports.active = true;

exports.params = {
    delim: '__'
};

exports.description = 'prefix IDs';


var csstree   = require('css-tree'),
    cssRx     = require('css-url-regex')(),
    domWalker = require('../lib/dom-walker');

var rxId      = /^#(.*)$/;

/**
 * Prefixes identifiers
 *
 * @param {Object} document document element
 * @param {Object} opts plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(document, opts) {

    var prefix = function(name) {
        return 'prefixIds_02' + opts.delim + name;
    };

    domWalker.preorder(document, function(node) {


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

                node.name = prefix(node.name);
            });

            // update <style>s
            node.content[0].text = csstree.translate(cssAst);
        }


        // element attributes
        if(!node.attrs) {
          return;
        }

        for(var attrName in node.attrs) {
          var attr = node.attrs[attrName];

          // id/class
          if(attrName === 'id' || attrName === 'class') {
            attr.value = prefix(attr.value);
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

            idNamePrefixed = prefix(idName);
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

          idNamePrefixed = prefix(idName);
          idUrlPrefixed  = '#' + idNamePrefixed;

          attr.value = 'url(' + idUrlPrefixed + ')';

        }

    });

    return document;
};
