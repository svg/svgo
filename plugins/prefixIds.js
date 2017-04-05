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
          }

          // url(...)
          var urlMatches = cssRx.exec(attr.value);
          if(urlMatches === null) {
            return;
          }
          var urlVal = urlMatches[1];

          var idUrlMatches = urlVal.match(/^#(.*)$/);
          if(idUrlMatches === null) {
            return;
          }
          var idName = idUrlMatches[1];

          var idNamePrefixed = prefix(idName);
          var idUrlPrefixed  = '#' + idNamePrefixed;

          attr.value = 'url(' + idUrlPrefixed + ')';
        }

    });

    return document;
};
