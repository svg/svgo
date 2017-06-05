'use strict';

exports.type = 'full';

exports.active = false;

exports.params = {};

exports.description = 'chain filter elements using CSS filter(...)';


var csstree = require('css-tree'),
    cssRx = require('css-url-regex'),
    camelCase = require('camelcase'),
    domWalker = require('../lib/dom-walker'),
    rxId = /^#(.*)$/; // regular expression for matching + extracting the ID

var matchUrl = function(val) {
    var urlMatches = cssRx().exec(val);
    if (urlMatches === null) {
        return false;
    }
    return urlMatches[1];
};

var matchId = function(urlVal) {
    var idUrlMatches = urlVal.match(rxId);
    if (idUrlMatches === null) {
        return false;
    }
    return idUrlMatches[1];
};

/**
 * Chain filter elements using CSS filter(...) (Workaround for some browsers like Firefox).
 *
 * @param {Object} document document element
 * @param {Object} opts plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(document) {

    // Collect <filter> elements and elements that use a <filter> element by ID
    var filterIds = new Set(),
        elementsUsingFilterById = [];
    domWalker.preorder(document, function(node) {

        // <filter> elements
        if (node.elem === 'filter') {
            if(!node.hasAttr('id')) {
                return; // skip if no ID attribute
            }
            var filterElemId = node.attr('id').value;

            if (filterIds.has(filterElemId)) {
                console.warn('Warning: \'#' + filterElemId + '\' is used multiple times for <filter> elements.');
                return; // skip if ID already added
            }
            filterIds.add(filterElemId);

            return; // done with <filter> element
        }


        // elements that use a filter (filter attribute)
        if (!node.hasAttr('filter')) {
            return; // skip if no filter attribute
        }

        var useFilterVal  = node.attr('filter').value;
        if (useFilterVal.length === 0) {
            return; // skip if empty filter attribute
        }

        var useFilterUrl = matchUrl(useFilterVal);
        if (!useFilterUrl) {
          return; // skip if no url(...) used
        }

        var useFilterId = matchId(useFilterUrl);
        if (!useFilterId) {
            return; // skip if no #id in url(...) used
        }

        elementsUsingFilterById.push({
            filterId: useFilterId,
            node:     node
        });
    });
    if(filterIds.length === 0) {
        return document; // No <filter> elements, skip this SVG.
    }


    // elements that use a <filter> element that actually exists
    var elementsUsingExistingFilterById = elementsUsingFilterById.filter(function(element) {
        var filterExists = filterIds.has(element.filterId);
        if (!filterExists) {
            console.warn('Warning: Element uses non-existing <filter> \'#' + element.filterId + '\', element skipped.');
        }
        return filterExists;
    });

    if(elementsUsingExistingFilterById.length === 0) {
        return document; // No existing <filter> elements are used, skip this SVG.
    }


    // Generate CSS class list + styles for the <filter> elements
    var usedFilterIds = new Set(
        elementsUsingExistingFilterById.map(function(element) {
            return element.filterId;
        })
    );

    var filterClasses = new Map(),
        filterClassesStyles = csstree.fromPlainObject({type:'StyleSheet', children: []});
    for (var filterId of usedFilterIds) {
        var filterClassName = camelCase('filter ' + filterId);
        filterClasses.set(filterId, filterClassName);

        var filterClassRuleObj = {
            type: 'Rule', 
            selector: {
                type: 'SelectorList',
                children: [
                    {
                        type: 'Selector', 
                        children: [
                            {
                                type: 'ClassSelector',
                                name: filterClassName
                            }
                        ]
                    }
                ]
            },
            block: {
                type: 'Block',
                children: [
                    {
                        type: 'Declaration',
                        important: false,
                        property: 'filter',
                        value: {
                            type: 'Value',
                            children: [
                                {
                                    type: 'String',
                                    value: '"url(' + '#' + filterId + ')"'
                                }
                            ]
                        }
                    }
                ]
            }
        };
        filterClassesStyles.children.appendData(csstree.fromPlainObject(filterClassRuleObj));
    }


    if(!filterClassesStyles.children.isEmpty()) {
        // Add new style element with these filter classes styles
        var svgElem = document.content[0];

        // New <style>
        var styleFilterClasses = new document.constructor({
            elem: 'style',
            prefix: '',
            local: 'style',
            content: [] // has to be added in extra step
        }, svgElem);

        // New text content for <style>
        var styleFilterClassesText = new document.constructor({
            text: csstree.translate(filterClassesStyles)
        }, styleFilterClasses);
        // Add text content to <style>
        styleFilterClasses.spliceContent(0, 0, styleFilterClassesText);

        // Add new <style> to <svg>
        svgElem.spliceContent(0, 0, styleFilterClasses);
    }


    // Assign filter-using classes to corresponding filter-using elements
    // Remove then redundant filter attribute.
    for (var element of elementsUsingExistingFilterById) {
        element.node.removeAttr('filter');
        element.node.class.add(filterClasses.get(element.filterId));
    }


    return document;
};