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
            return;
          }

          filterElementsWithId.set(node.attr('id').value, node);
          return;
        }


        // elements that use a filter (filter attribute)
        if(!node.hasAttr('filter')) {
          return;
        }

        useFilterVal  = node.attr('filter').value;
        if(useFilterVal.length === 0) {
          return; // skip
        }

        useFilterUrl = matchUrl(useFilterVal);
        if(!useFilterUrl) {
          return; // skip
        }

        useFilterId = matchId(useFilterUrl);
        if(!useFilterId) {
          return; // skip
        }

        elementsUsingFilterElementsWithId.push({
          filterId: useFilterId,
          node: node
        });
    });


    var className = '',
        filterId = '';

    // Generate CSS class list from filters
    var filterClasses = new Map(),
        filterClassName = '';
    for (filterId of filterElementsWithId.keys()) {
        filterClassName = camelCase('filter ' + filterId);
        filterClasses.set(filterId, filterClassName);
    }

    // Generate CSS from class list
    var filterClassesStyles = csstree.fromPlainObject({type:'StyleSheet', children: []}),
        filterClassRuleObj = {};
    for ([filterId, className] of filterClasses.entries()) {
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
                                name: className
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

    var styleFilterClassesElem = new document.constructor({
        elem: 'style',
        prefix: '',
        local: 'style',
        content: [ {
            text: csstree.translate(filterClassesStyles)
        } ]
    });
    svgElem.content.unshift(styleFilterClassesElem);


    // Assign filter-using classes to corresponding filter-using elements
    // Remove then redundant filter attribute.
    for (var element of elementsUsingFilterElementsWithId) {
        element.node.removeAttr('filter');
        element.node.class.add(filterClasses.get(element.filterId));
    }

    return document;
};