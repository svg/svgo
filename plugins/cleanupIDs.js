'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'removes unused IDs and minifies used';

exports.params = {
    remove: true,
    minify: true,
    prefix: '',
    preserve: [],
    force: false
};

var referencesProps = new Set(require('./_collections').referencesProps),
    regReferencesUrl = /\burl\(("|')?#(.+?)\1\)/,
    regReferencesHref = /^#(.+?)$/,
    regReferencesBegin = /^(\w+?)\./,
    styleOrScript = ['style', 'script'],
    generateIDchars = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ],
    maxIDindex = generateIDchars.length - 1;

/**
 * Remove unused and minify used IDs
 * (only if there are no any <style> or <script>).
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Kir Belevich
 */
exports.fn = function(data, params) {
    var currentID,
        currentIDstring,
        IDs = new Map(),
        referencesIDs = new Map(),
        hasStyleOrScript = false,
        preserveIDs = new Set(Array.isArray(params.preserve) ? params.preserve : params.preserve ? [params.preserve] : []),
        idValuePrefix = '#',
        idValuePostfix = '.';

    /**
     * Bananas!
     *
     * @param {Array} items input items
     * @return {Array} output items
     */
    function monkeys(items) {
        for (var i = 0; i < items.content.length && !hasStyleOrScript; i++) {
            var item = items.content[i];

            // quit if <style> of <script> presents ('force' param prevents quitting)
            if (!params.force && item.isElem(styleOrScript)) {
                hasStyleOrScript = true;
                continue;
            }
            // …and don't remove any ID if yes
            if (item.isElem()) {
                item.eachAttr(function(attr) {
                    var key, match;

                    // save IDs
                    if (attr.name === 'id') {
                        key = attr.value;
                        if (IDs.has(key)) {
                            item.removeAttr('id'); // remove repeated id
                        } else {
                            IDs.set(key, item);
                        }
                        return;
                    }
                    // save references
                    if (referencesProps.has(attr.name) && (match = attr.value.match(regReferencesUrl))) {
                        key = match[2]; // url() reference
                    } else if (
                        attr.local === 'href' && (match = attr.value.match(regReferencesHref)) ||
                        attr.name === 'begin' && (match = attr.value.match(regReferencesBegin))
                    ) {
                        key = match[1]; // href reference
                    }
                    if (key) {
                        var ref = referencesIDs.get(key) || [];
                        ref.push(attr);
                        referencesIDs.set(key, ref);
                    }
                });
            }
            // go deeper
            if (item.content) {
                monkeys(item);
            }
        }
        return items;
    }

    data = monkeys(data);

    if (hasStyleOrScript) {
        return data;
    }

    referencesIDs.forEach(function(value, key) {

        if (IDs.has(key)) {
            // replace referenced IDs with the minified ones
            if (params.minify && !preserveIDs.has(key)) {
                currentIDstring = getIDstring(currentID = generateID(currentID), params);
                IDs.get(key).attr('id').value = currentIDstring;

                value.forEach(function(attr) {
                    attr.value = attr.value.includes(idValuePrefix) ?
                        attr.value.replace(idValuePrefix + key, idValuePrefix + currentIDstring) :
                        attr.value.replace(key + idValuePostfix, currentIDstring + idValuePostfix);
                });
            }
            // don't remove referenced IDs
            IDs.delete(key);
        }
    });
    // remove non-referenced IDs attributes from elements
    if (params.remove) {
        IDs.forEach(function(value, key) {
            if (!preserveIDs.has(key)) {
                value.removeAttr('id');
            }
        });
    }
    return data;
};

/**
 * Generate unique minimal ID.
 *
 * @param {Array} [currentID] current ID
 * @return {Array} generated ID array
 */
function generateID(currentID) {
    if (!currentID) return [0];

    currentID[currentID.length - 1]++;

    for(var i = currentID.length - 1; i > 0; i--) {
        if (currentID[i] > maxIDindex) {
            currentID[i] = 0;

            if (currentID[i - 1] !== undefined) {
                currentID[i - 1]++;
            }
        }
    }
    if (currentID[0] > maxIDindex) {
        currentID[0] = 0;
        currentID.unshift(0);
    }
    return currentID;
}

/**
 * Get string from generated ID array.
 *
 * @param {Array} arr input ID array
 * @return {String} output ID string
 */
function getIDstring(arr, params) {
    var str = params.prefix;
    return str + arr.map(function(i) { return generateIDchars[i]}).join('');
}
