var INHERIT = require('inherit');

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} jsdata input data
 * @param {Object} plugins plugins object from config
 * @param {Class} [pluginsEngine] custom plugins engine class
 * @return {Object} output data
 */
module.exports = function(jsdata, plugins, pluginsEngine) {

    PluginsEngine = pluginsEngine || PluginsEngine;

    var engine = new PluginsEngine();

    jsdata = engine.pass(jsdata, plugins.directPass);
    jsdata = engine.pass(jsdata, plugins.reversePass, true);
    jsdata = engine.full(jsdata, plugins.full);

    return jsdata;

};

/**
 * Class PluginsEngine.
 */
var PluginsEngine = exports.PluginsEngine = INHERIT(/** @lends Nodes.prototype */{

    /**
     * Require all plugins into array.
     *
     * @param {Array} arr original plugins list
     * @return {Array} require'ed plugins list
     * @private
     */
    _makePluginsList: function(arr) {

        return arr.map(function(plugin) {
            plugin.fn = require('../plugins/' + plugin.name)[plugin.name];

            return plugin;
        });

    },

    /**
     * Plugins pass function.
     *
     * @param {Object} jsdata input data
     * @param {Array} plugins list of the current plugins type
     * @param {Boolean} [reverse] reverse pass?
     * @return {Object} output data
     */
    pass: function(jsdata, plugins, reverse) {

        plugins = this._makePluginsList(plugins);

        function monkeys(data) {

            data.content = data.content.filter(function(item) {

                // reverse pass
                if (reverse && item.content) {
                    monkeys(item);
                }

                // main filter
                var filter = plugins.some(function(plugin) {
                    return plugin.active && plugin.fn(item, plugin.params) === false;
                });

                // direct pass
                if (!reverse && item.content) {
                    monkeys(item);
                }

                return !filter;

            });

            return data;

        }

        return monkeys(jsdata);

    },

    /**
     * "Full" plugins.
     *
     * @return {[type]} [description]
     */
    full: function(jsdata, plugins) {

        plugins = this._makePluginsList(plugins);

        plugins.forEach(function(plugin) {
            if (plugin.active) {
                jsdata = plugin.fn(jsdata, plugin.params);
            }
        });

        return jsdata;

    }

});

/*
var MyPluginsEngine = INHERIT(PluginsEngine, {

    __constructor: function(options) {
        this.__base();
    }

});
*/
