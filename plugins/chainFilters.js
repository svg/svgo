'use strict';

exports.type = 'full';

exports.active = false;

exports.params = {};

exports.description = 'chain filter elements using CSS filter(...)';


var csstree = require('css-tree'),
    camelCase = require('camelcase'),
    domWalker = require('../lib/dom-walker'),
    domTools = require('../lib/dom-tools');


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


        // elements that use a filter (filter attribute) or 
        //                   a filter style
        if (!node.hasAttr('filter') &&
            !(node.style && node.style.getPropertyValue('filter') !== null)) {
            return; // skip if no filter attribute
        }

        var useFilterVal;
        if(node.style.getPropertyValue('filter') !== null) {
          // style filter
          useFilterVal = node.style.getPropertyValue('filter');
        } else {
          // attribute filter
          useFilterVal = node.attr('filter').value;
        }


        if (useFilterVal.length === 0) {
            return; // skip if empty filter attribute
        }

        var useFilterUrl = domTools.matchUrl(useFilterVal);
        if (!useFilterUrl) {
          return; // skip if no url(...) used
        }

        var useFilterId = domTools.matchId(useFilterUrl);
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
            prelude: {
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
        var svgElem = document.querySelector('svg');

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


    for (var element of elementsUsingExistingFilterById) {
        // Assign filter-using classes to corresponding filter-using elements
        element.node.class.add(filterClasses.get(element.filterId));

        // Remove the then redundant filter attribute + styles
        element.node.removeAttr('filter');
        element.node.style.removeProperty('filter');
        if(element.node.style.item(0) === '') {
          // clean up now empty style attributes
          element.node.removeAttr('style');
        }
    }


    return document;
};