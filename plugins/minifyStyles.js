'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'minifies styles and removes unused styles based on usage data';

exports.params = {
    // ... cssnano options goes here

    // additional 
    usage: {
        force: false,  // force to use usage data even if it unsafe (document contains <script> or on* attributes)
        ids: true,
        classes: true,
        tags: true
    }
};

var cssTools = require('../lib/css-tools'),
    postcss  = require('postcss'),
    cssnano  = require('cssnano');

/**
 * Minifies styles (<style> element + style attribute) using cssnano
 *
 * @author strarsis <strarsis@gmail.com>
 */
exports.fn = function(document, options) {
    options = options || {};

    /*var minifyForStylesheet = postcss([cssnano]).process().sync,
        minifyForAttribute  = postcss([cssnano]).process().sync;*/
    var minify = function(css) {
        return postcss.sync([cssnano]);
    };

    var styleEls = document.querySelectorAll('style');
    if(styleEls) {
        for(var styleEl of styleEls) {
            // <style> element
            var styleCss    = cssTools.getCssStr(styleEl);
            var styleCssMin = minify(styleCss).css;
            cssTools.setCssStr(styleEl, styleCssMin);
        }
    }

    return document;
};
