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
 * Chain filter elements using CSS filter(...) (Fix some browsers like Firefox).
 *
 * @param {Object} document document element
 * @param {Object} opts plugin params
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(document) {

    // Collect <filter> elements and element that use filter by ID
    var filterElementsWithId = new Map(),
        elementsUsingFilterElementsWithId = [],

        useFilterVal = '',
        useFilterUrl = '',
        useFilterId = '';

    domWalker.preorder(document, function(node) {

        // <filter> elements
        if(node.elem === 'filter') {
          if(!node.hasAttr('id')) {
            return; // skip if no ID attribute
          }

          filterElementsWithId.set(node.attr('id').value, node);
          return; // done with <filter> element
        }


        // elements that use a filter (filter attribute)
        if(!node.hasAttr('filter')) {
          return; // skip if no filter attribute
        }

        useFilterVal  = node.attr('filter').value;
        if(useFilterVal.length === 0) {
          return; // skip if empty filter attribute
        }

        useFilterUrl = matchUrl(useFilterVal);
        if(!useFilterUrl) {
          return; // skip if no url(...) used
        }

        useFilterId = matchId(useFilterUrl);
        if(!useFilterId) {
          return; // skip if no #id in url(...) used
        }

        elementsUsingFilterElementsWithId.push({
          filterId: useFilterId,
          node: node
        });
    });

    if(filterElementsWithId.size === 0 || elementsUsingFilterElementsWithId.size === 0) {
      return document; // No elements that use filter and/or no filter elements, skip this SVG.
    }


    // Filter elements that are actually used by an element (by ID)
    var usedFilterElementsWithId = new Map(),
        element;
    for(element of elementsUsingFilterElementsWithId) {
      usedFilterElementsWithId.set(element.filterId, element.node);
    }

    if(usedFilterElementsWithId.size === 0) {
      return document; // No filter elements used at all, skip this SVG.
    }


    // Generate CSS class list from filters +
    // Generate CSS from class list
    var filterClasses = new Map(),
        filterClassName = '',
        filterClassesStyles = csstree.fromPlainObject({type:'StyleSheet', children: []}),
        filterClassRuleObj = {};
    
    for (var filterId of usedFilterElementsWithId.keys()) {
        filterClassName = camelCase('filter ' + filterId);
        filterClasses.set(filterId, filterClassName);

        filterClassRuleObj = {
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


    // Assign filter-using classes to corresponding filter-using elements
    // Remove then redundant filter attribute.
    for (element of elementsUsingFilterElementsWithId) {
        element.node.removeAttr('filter');
        element.node.class.add(filterClasses.get(element.filterId));
    }

    return document;
};