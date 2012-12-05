'use strict';

var INHERIT = require('inherit'),
    extend = require('./tools').extend;

/**
 * @module jsAPI
 *
 * @class SVG-as-JS Nodes API.
 */
module.exports = INHERIT(/** @lends Nodes.prototype */{

    /**
     * @constructs
     *
     * @private
     */
    __constructor: function(data) {

        extend(this, data);

    },

    /**
     * Determine if item is an element
     * (any, with a specific name or in a names array).
     *
     * @param {String|Array} [param] element name or names arrays
     *
     * @return {Boolean}
     */
    isElem: function(param) {

        if (!param) return !!this.elem;

        if (Array.isArray(param)) return !!this.elem && (param.indexOf(this.elem) > -1);

        return !!this.elem && this.elem === param;

    },

    /**
     * Determine if element is empty.
     *
     * @return {Boolean}
     */
    isEmpty: function() {

        return !this.content || !this.content.length;

    },

    /**
     * Determine if element has an attribute
     * (any, or by name or by name + value).
     *
     * @param {String} [name] attribute name
     * @param {String} [val] attribute value (will be toString()'ed)
     *
     * @return {Boolean}
     */
    hasAttr: function(name, val) {

        if (!this.attrs || !Object.keys(this.attrs).length) return false;

        if (!arguments.length) return !!this.attrs;

        if (val !== undefined) return !!this.attrs[name] && this.attrs[name].value === val.toString();

        return !!this.attrs[name];

    },

    /**
     * Get a specific attribute from an element
     * (by name or name + value).
     *
     * @param {String} name attribute name
     * @param {String} [val] attribute value (will be toString()'ed)
     *
     * @return {Object|Undefined}
     */
    attr: function(name, val) {

        if (!this.hasAttr() || !arguments.length) return undefined;

        if (val !== undefined) return this.hasAttr(name, val) ? this.attrs[name] : undefined;

        return this.attrs[name];

    },

    /**
     * Remove a specific attribute.
     *
     * @param {String} name attribute name
     * @param {String} [val] attribute value
     *
     * @return {Boolean}
     */
    removeAttr: function(name, val) {

        if (!arguments.length) return false;

        if (!this.hasAttr(name)) return false;

        if (val && this.attrs[name].value !== val) return false;

        delete this.attrs[name];

        if (!Object.keys(this.attrs).length) delete this.attrs;

        return true;

    },

    /**
     * Add attribute.
     *
     * @param {Object} attr attribute object
     *
     * @return {Object} created attribute
     */
    addAttr: function(attr) {

        if (!attr ||
            (attr && attr.name === undefined) ||
            (attr && attr.value === undefined) ||
            (attr && attr.prefix === undefined) ||
            (attr && attr.local === undefined)
        ) return false;

        this.attrs = this.attrs || {};

        return (this.attrs[attr.name] = attr);

    },

    /**
     * Iterates over all attributes.
     *
     * @param {Function} callback callback
     * @param {Object} [context] callback context
     *
     * @return {Boolean} false if there are no any attributes
     */
    eachAttr: function(callback, context) {

        if (!this.hasAttr()) return false;

        for (var name in this.attrs) {
            callback.call(context, this.attrs[name]);
        }

        return true;

    }

});
