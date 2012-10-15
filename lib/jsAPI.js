var INHERIT = require('inherit'),
    extend = require('./tools').extend;

/**
 * @module  jsAPI
 *
 * @class SVG-as-JS Nodes API.
 */
exports.Nodes = INHERIT(/** @lends Nodes.prototype */{

    /**
     * @constructs
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
     * Iterates over all attributes.
     *
     * @param {Function} callback
     * @return {Boolean} false if the are no any attributes
     */
    eachAttr: function(callback) {

        if (!this.hasAttr()) return false;

        for (var name in this.attrs) {
            callback(this.attrs[name]);
        }

    },

    /**
     * Determine if element has an attribute
     * (any, or by name or by name + value).
     *
     * @param {String|Object} [name] attribute name or object
     * @param {String} [val] attribute value (will be toString()'ed)
     * @return {Boolean}
     */
    hasAttr: function(attr, val) {

        if (!this.attrs || !Object.keys(this.attrs).length) return false;

        if (!arguments.length) return !!this.attrs;

        if (typeof attr === 'object') {
            val = attr.value;
            attr = attr.name;
        }

        if (val !== undefined) return !!this.attrs[attr] && this.attrs[attr].value === val.toString();

        return !!this.attrs[attr];

    },

    /**
     * Get a specific attribute from an element
     * (by name or name + value).
     *
     * @param {String} [name] attribute name
     * @param {String} [val] attribute value (will be toString()'ed)
     * @return {Object}
     */
    attr: function(name, val) {

        if (!this.hasAttr() || !arguments.length) return undefined;

        if (val !== undefined) return this.hasAttr(name, val) && this.attrs[name];

        return this.hasAttr(name) && this.attrs[name];

    },

    /**
     * Remove a specific attribute.
     *
     * @param {String|Object} attr attribute name or object
     * @param {String} [val] attribute value
     * @return {Boolean}
     */
    removeAttr: function(attr, val) {

        if (!this.hasAttr(attr)) return false;

        if (!arguments.length) {
            delete this.attrs;
            return true;
        }

        if (typeof attr === 'object') {
            val = attr.value;
            attr = attr.name;
        }

        if (val && this.attrs[attr].value !== val) return false;

        delete this.attrs[attr];

        if (!Object.keys(this.attrs).length) delete this.attrs;

        return true;

    },

    /**
     * Add attribute.
     *
     * @param {Object} attr attribute object
     */
    addAttr: function(attr) {

        this.attrs = this.attrs || {};

        this.attrs[attr.name] = attr;

    }

});
