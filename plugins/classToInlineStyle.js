'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'moves a style from definition to an inline style';

var csso = require('csso');

exports.fn = function (data) {
    var styles = [];
    // prepare
    perItem(data, fillStyles, styles);
    // apply
    return perItem(data, applyStyles, styles);
};


function fillStyles (item, styles) {
    // Find styles
    if (item.elem) {
        if (item.isElem('style') && !item.isEmpty()) {
            var styleCss = item.content[0].text || item.content[0].cdata || [],
                Data = styleCss.indexOf('>') >= 0 || styleCss.indexOf('<') >= 0 ? 'cdata' : 'text';

            if (styleCss.length > 0) {
                styles.push(styleCss);
                item.content[0][Data] = null;
            }
        }
    }
    return item;
}

function applyStyles (item, styles) {
    if (item.elem && item.attrs) {
        var id = item.attr('id') ? item.attr('id').value : undefined;
        var elem = item.elem;
        var classValues = item.attr('class') ? item.attr('class').value.split(' ') : [];
        var textLine = item.attr('style') ? (item.attr('style').value + ';') : '';

        styles.forEach(function (styleCss) {
            var ast = csso.compress(csso.parse(styleCss), {
                restructure: true,
                usage: {
                    classes: classValues,
                    ids: [id],
                    tags: [elem]
                }
            }).ast;
            var style = csso.translate(ast);
            var mt = style.match(/{[^}]*}/ig);
            if (mt) {
                textLine += mt.map(function (t) {
                    return t.replace(/[{}]/g, '');
                }).join(';');
            }
        });

        if(textLine) {
          item.attrs.style = {
            name: 'style',
            value: textLine,
            local: 'style',
            prefix: ''
          };
        }
    }
}

function perItem (data, callback, params) {

    function monkeys (items) {
        items.content = items.content.filter(function (item) {
            callback(item, params);
            if (item.content) {
                monkeys(item);
            }
            return true;

        });
        return items;
    }

    return monkeys(data);
}