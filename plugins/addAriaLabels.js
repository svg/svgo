'use strict';

exports.type = 'perItem';

exports.active = false;

exports.description = 'Adds an aria-labelledby and a referenced <title> and/or <description> section';

exports.params = {
    title: '',
    desc: ''
};

exports.fn = function addAriaLabels(item, params) {
    if (item.isElem('svg')) {
        var ids = [];

        ['desc', 'title'].forEach(function (elem) {
            var value = params[elem];
            if (value) {
                var id;
                if (typeof params.idFn === 'function') {
                  id = params.idFn(elem);
                } else {
                  id = elem + '-' + uid();
                }
                ids.push(id);

                var pos = 0;
                var replace = 0;
                item.content.forEach(function (subItem, index) {
                    if (subItem.isElem(elem)) {
                        pos = index;
                        replace = 1;
                    }
                });
                item.spliceContent(pos, replace, new item.constructor({
                    elem: elem,
                    local: elem,
                    prefix: '',
                    content: [new item.constructor({text: value})],
                    attrs: [new item.constructor({
                        name: 'id',
                        local: 'id',
                        prefix: '',
                        value: id
                    })]
                }));
            }
        });

        if (ids.length) {
            if (item.hasAttr('aria-labelledby')) {
                item.removeAttr('aria-labelledby');
            }
            item.addAttr({
                name: 'aria-labelledby',
                local: 'aria-labelledby',
                prefix: '',
                value: ids.join(' ')
            });
        }
    }
};

function uid() {
    return Math.random().toString(35).substr(2, 7);
}
