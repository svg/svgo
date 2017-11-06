'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'removes declarations of unused namespaces and minifies used namespace prefixes';

exports.params = {
    remove: true,
    minify: true,
    preserve: [],
    force: true
};

var generatePrefixChars = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ],
    maxPrefixIndex = generatePrefixChars.length - 1;

/**
 * Remove unused namespaces and minify used namespace prefixes.
 *
 * @param {Object} data full AST
 * @param {Object} params plugin params
 * @return {Object} full AST
 *
 * @author Kir Belevich
 * @author James Thomson
 */
exports.fn = function(data, params) {
    if (!params.remove && !params.minify) {
        return data;
    }

    var styleOrScript = ['style', 'script'];
    /**
     * Find if the items contain a style or script elem.
     *
     * @param {Object} items the items to search in
     */
    function containsStyleOrScript(items) {
        for (var i = 0; i < items.content.length && !hasStyleOrScript; i++) {
            var item = items.content[i];

            if (item.isElem(styleOrScript)) {
                hasStyleOrScript = true;
                break;
            }

            // go deeper
            if (item.content) {
                containsStyleOrScript(item);
            }
        }
    }

    // if 'force' param is false and the data contains a style or script elem
    // then quit without changing anything
    if (!params.force) {
        var hasStyleOrScript = false;
        containsStyleOrScript(data);

        if (hasStyleOrScript) {
            return data;
        }
    }

    var currentNSPrefix,
        nsesToPreserve = new Set(Array.isArray(params.preserve) ?
            params.preserve : params.preserve ? [params.preserve] : []);
    /**
     * Remove and minify namespaces.
     *
     * @param {Object} items the items to work with
     * @param {Map.<string, string>} prefixedAncestorNSes prefix for key, uri for value
     * @param {string} [parentDefaultNSUri] the items' parent's default namespace uri
     * @return {Map.<string, Array.<Object>>} references to namespaces declared in ancestors of 'items.content' elems
     */
    function cleanup(items, prefixedAncestorNSes, parentDefaultNSUri) {
        // map of refs to return to the caller function
        var refsForCaller = new Map();

        for (var i = 0; i < items.content.length; i++) {
            var item = items.content[i];

            if (item.isElem()) {
                var nsAttrs = getNSAttrs(item, nsesToPreserve, params);
                var defaultNSUri = parentDefaultNSUri;

                // this will only be true if 'remove' param is true
                // and 'preserve' param does not contain 'xmlns'
                if (nsAttrs.has('default')) {
                    var defaultNSAttr = nsAttrs.get('default');

                    if (defaultNSAttr.value === parentDefaultNSUri) {
                        // the elem item's default namespace is unnecessary
                        // so remove it
                        item.removeAttr(defaultNSAttr.name);
                    } else {
                        defaultNSUri = defaultNSAttr.value;
                    }
                }

                // make a map of prefixed namespaces to find references of
                // in this element and its descendants
                var nsesToFind = new Map(prefixedAncestorNSes);

                var prefixedNSAttrs = nsAttrs.get('prefixed');
                nsAttrs.clear();
                var indicesToRemove = [];

                prefixedNSAttrs.forEach((attr, index) => {
                    if (params.remove &&
                        prefixedAncestorNSes.get(attr.local) === attr.value) {
                        // the namespace has the same prefix and uri as one
                        // already in scope, from an ancestor, so remove the
                        // current namespace attr
                        item.removeAttr(attr.name);
                        indicesToRemove.push(index - indicesToRemove.length);
                    } else {
                        // if the namespace has the same prefix as an ancestor
                        // then we are no longer trying to find references to
                        // the ancestor namespace, so overwrite the existing
                        // value, if there is one
                        nsesToFind.set(attr.local, attr.value);
                    }
                });

                indicesToRemove.forEach(attrIndex => {
                    prefixedNSAttrs.splice(attrIndex, 1);
                });

                // collect references, starting with the current elem
                var nsRefs = new Map();
                addNSReference(item, nsesToFind, nsRefs);

                // now collect references from the item's attrs
                item.eachAttr(attr => {
                    if (attr.prefix !== 'xmlns') {
                        addNSReference(attr, nsesToFind, nsRefs);
                    }
                });

                // collect references from descendants
                if (item.content) {
                    var descendantNSRefs =
                        cleanup(item, nsesToFind, defaultNSUri);

                    // add the references from descendants to the existing
                    // references, from the elem and its attrs
                    nsRefs = combineMaps(nsRefs, descendantNSRefs);
                }

                // remove and minify namespace prefixes
                prefixedNSAttrs.forEach(attr => {
                    if (nsRefs.has(attr.local)) {
                        var originalNSPrefix = attr.local;

                        if (params.minify) {
                            var currentNSPrefixMap =
                                generateNSPrefix(
                                    currentNSPrefix,
                                    nsesToPreserve
                                );

                            currentNSPrefix = currentNSPrefixMap.get('arr');
                            var currentNSPrefixString =
                                currentNSPrefixMap.get('str');

                            nsRefs.get(originalNSPrefix).forEach(ref => {
                                var refProperty = ref.hasOwnProperty('elem') ?
                                    'elem' : 'name';

                                ref.prefix = currentNSPrefixString;
                                ref[refProperty] = ref.prefix + ':' + ref.local;
                            });

                            attr.local = currentNSPrefixString;
                            attr.name = 'xmlns:' + attr.local;
                        }

                        nsRefs.delete(originalNSPrefix);
                    } else if (params.remove) {
                        // the namespace is not referenced so remove it
                        item.removeAttr(attr.name);
                    }
                });

                // add the remaining refs to the map to be returned
                refsForCaller = combineMaps(refsForCaller, nsRefs);
            }
        }

        return refsForCaller;
    }

    cleanup(data, new Map());
    return data;
};

/**
 * Get all of the namespace attributes from the input element's attributes.
 *
 * @param {Object} elem elem to find namespace attrs in
 * @param {Set.<string>} nsesToPreserve namespaces to preserve (all prefixes, with the possible exception being 'xmlns')
 * @param {Object} params plugin params
 * @return {Map.<string, (Object|Array.<Object>)>} default namespace attr and array of prefixed namespace attrs
 */
function getNSAttrs(elem, nsesToPreserve, params) {
    var nsAttrs = new Map();
    var prefixed = [];

    Object.keys(elem.attrs).forEach(key => {
        if (elem.attrs[key].prefix === 'xmlns') {
            if (elem.attrs[key].local) {
                // don't add namespace attrs with prefixes that are to be
                // preserved, as we don't need to find references to them
                if (!nsesToPreserve.has(elem.attrs[key].local)) {
                    // don't add 'xml' namespace prefix attr, as it shouldn't be
                    // minified, and remove it, if allowed, as it is optional
                    if (elem.attrs[key].local === 'xml') {
                        if (params.remove) {
                            elem.removeAttr(elem.attrs[key].name);
                        }
                    } else {
                        prefixed.push(elem.attrs[key]);
                    }
                }
            // since all namespace prefixes starting with 'xml',
            // in any case combination, are reserved, 'xmlns' can be used to
            // preserve the default namespace, and as it cannot be minified,
            // only add it if we are allowed to remove namespaces
            } else if (params.remove && !nsesToPreserve.has('xmlns')) {
                nsAttrs.set('default', elem.attrs[key]);
            }
        }
    });

    nsAttrs.set('prefixed', prefixed);
    return nsAttrs;
}

/**
 * Add a reference to a prefixed namespace in scope.
 *
 * @param {Object} item elem or attr
 * @param {Map.<string, string>} nsesToFind the prefixed namespaces in scope
 * @param {Map.<string, Array.<Object>>} nsRefs map of namespace references, with array of items as the value
 */
function addNSReference(item, nsesToFind, nsRefs) {
    if (item.prefix && nsesToFind.has(item.prefix)) {
        var refs = nsRefs.has(item.prefix) ?
            nsRefs.get(item.prefix) : [];

        refs.push(item);
        nsRefs.set(item.prefix, refs);
    }
}

/**
 * Generate a unique, minimal namespace prefix (mostly taken from 'cleanupIDs plugin').
 *
 * @param {Array.<number>} currentNSPrefix array used to make prefix string
 * @param {Set.<string>} nsesToPreserve namespaces to preserve
 * @return {Map.<string, (string|Array.<number>)>} generated namespace prefix array and string
 */
function generateNSPrefix(currentNSPrefix, nsesToPreserve) {
    if (!currentNSPrefix) currentNSPrefix = [-1];

    currentNSPrefix[currentNSPrefix.length - 1]++;

    for (var i = currentNSPrefix.length - 1; i > 0; i--) {
        if (currentNSPrefix[i] > maxPrefixIndex) {
            currentNSPrefix[i] = 0;

            if (currentNSPrefix[i - 1] !== undefined) {
                currentNSPrefix[i - 1]++;
            }
        }
    }

    if (currentNSPrefix[0] > maxPrefixIndex) {
        currentNSPrefix[0] = 0;
        currentNSPrefix.unshift(0);
    }
    // prefixes beginning with 'xml', in any case combination, are reserved
    // (https://www.w3.org/TR/xml-names/#ns-decl) so don't allow
    // the array to start like this
    if (currentNSPrefix.length > 2 &&
        (generatePrefixChars[currentNSPrefix[0]] +
            generatePrefixChars[currentNSPrefix[1]] +
            generatePrefixChars[currentNSPrefix[2]]).toLowerCase() === 'xml') {
        currentNSPrefix[2]++;
    }

    var currentNSPrefixString = getNSPrefixString(currentNSPrefix),
        currentNSPrefixMap = new Map();

    currentNSPrefixMap.set('arr', currentNSPrefix);
    currentNSPrefixMap.set('str', currentNSPrefixString);

    // don't let the string be equal to a preserved namespace prefix
    if (nsesToPreserve.size && nsesToPreserve.has(currentNSPrefixString)) {
        currentNSPrefixMap = generateNSPrefix(currentNSPrefix, nsesToPreserve);
    }

    return currentNSPrefixMap;
}

/**
 * Get string from generated namespace prefix array.
 *
 * @param {Array.<number>} currentNSPrefix array to make the string from
 * @return {string} string created
 */
function getNSPrefixString(currentNSPrefix) {
    return currentNSPrefix.map(i => generatePrefixChars[i]).join('');
}

/**
 * Add the references from map2 to map1 and return map1.
 *
 * @param {Map.<string, Array.<Object>>} map1 the map to return
 * @param {Map.<string, Array.<Object>>} map2 the map to add to map1
 * @return {Map.<string, Array.<Object>>} the combined map
 */
function combineMaps(map1, map2) {
    if(!map1.size) {
        map1 = map2;
    } else if(map2.size) {
        map2.forEach((refs, prefix) => {
            if (map1.has(prefix)) {
                map1.set(
                    prefix,
                    map1.get(prefix).concat(refs)
                );
            } else {
                map1.set(prefix, refs);
            }
        });
    }

    return map1;
}
