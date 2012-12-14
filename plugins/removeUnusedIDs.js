'use strict';

var referencesProps = require('./_collections').referencesProps,
    regReferencesUrl = /^url\(#(.+?)\)$/,
    regReferencesHref = /^#(.+?)$/,
    styleOrScript = ['style', 'script'];

function replaceLast(str, char) {
    str = str.split('');
    str[str.length - 1] = char;
    return str.join('');
}

function replaceFirst(str, char) {
    str = str.split('');
    str[0] = char;
    return str.join('');
}

function generateID(prev) {
    var next;

    if (prev.charCodeAt(prev.length - 1) === 122) {
        next = replaceAt(prev, 'A');
    } else if (prev.charCodeAt(prev.length - 1) === 90) {
        next = replaceAt(prev, 'A');
    } else {
        next = replaceAt(prev, String.fromCharCode(prev.charCodeAt(prev.length - 1) + 1));
    }

    // if (prev.length === 1) {
    //     if (prev.charCodeAt(0) === 122) {
    //         next = String.fromCharCode(65);
    //     } else if (prev.charCodeAt(0) === 90) {
    //         next = 'aa';
    //     }
    // } else if (prev.length === 2) {

    // }
}

/**
 * Remove unused IDs
 * (only if there are no any <style> or <script>).
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.removeUnusedIDs = function(data) {

    var IDs = {},
        referencesIDs = [],
        hasStyleOrScript = false;

    /**
     * Bananas!
     *
     * @param {Array} items input items
     * @return {Array} output items
     */
    function monkeys(items) {

        var i = 0,
            length = items.content.length;

        while(i < length) {

            var item = items.content[i],
                match;

            // check if <style> of <script> presents
            if (item.isElem(styleOrScript)) {
                hasStyleOrScript = true;
            }

            // …and don't remove any ID if yes
            if (!hasStyleOrScript) {

                if (item.isElem()) {

                    item.eachAttr(function(attr) {
                        // save IDs
                        if (attr.name === 'id') {
                            IDs[item.attr('id').value] = item;
                        }

                        // save IDs url() references
                        else if (referencesProps.indexOf(attr.name) > -1) {
                            match = attr.value.match(regReferencesUrl);

                            if (match && referencesIDs.indexOf(match[1]) === -1) {
                                referencesIDs.push(match[1]);
                            }
                        }

                        // save IDs href references
                        else if (attr.name === 'xlink:href') {
                            match = attr.value.match(regReferencesHref);

                            if (match && referencesIDs.indexOf(match[1]) === -1) {
                                referencesIDs.push(match[1]);
                            }
                        }
                    });

                }

                // go deeper
                if (item.content) {
                    monkeys(item);
                }

            }

            i++;

        }

        return items;

    }

    data = monkeys(data);

    if (!hasStyleOrScript) {

        // don't remove referenced IDs
        if (referencesIDs.length) {
            referencesIDs.forEach(function(referencesID) {
                delete IDs[referencesID];
            });
        }

        // remove not referenced IDs from elements
        if (Object.keys(IDs).length) {
            for(var ID in IDs) {
                IDs[ID].removeAttr('id');
            }
        }

    }

    return data;

};
