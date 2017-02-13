'use strict';

var jsAPI = require('../lib/svgo/jsAPI');


exports.type = 'full';

exports.active = false;

exports.description = 'used text';

var styleOrScript = ['style', 'script'];

exports.fn = function(data, params) {


    var texts = [];

    /**
     * Bananas!
     *
     * @param {Array} items input items
     * @return {Array} output items
     */
    function monkeys(items) {
        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            if (item.isElem(styleOrScript)) {
                continue;
            }
            if (item.isElem()) {
                if(item.content && typeof item.content[0] && typeof item.content[0].text !== 'undefined') {
                  texts.push(item.content[0].text);
                }
            }

            // go deeper
            if (item.content) {
                monkeys(item);
            }
        }
        return items;
    }
    monkeys(data);


    var text = texts.join('');

    var chars = text.split('').filter(function(item, i, ar){ return ar.indexOf(item) === i; });
    var charsStr = chars.join('');

    // Escape CSS multiline comment termination characters ('*/' -> '/*')
    var charsEsc = charsStr.replace('*\/', '\/*');

    var svgElem  = data.content[0];
    var stylesEl = new jsAPI({
      elem:    'style',
      prefix:  '',
      local:   'style',
      content: [{
        text: '/* Characters used:' + "\n" + charsEsc + "\n" + '*/'
      }]
    }, svgElem);
    svgElem.content.unshift(stylesEl);

    return data;
};