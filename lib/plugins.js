/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} jsdata input data
 * @param {Object} plugins plugins object from config
 * @return {Object} output data
 */
module.exports = function(data, plugins) {

    data = pass(data, plugins.directPass);
    data = pass(data, plugins.reversePass, true);
    data = full(data, plugins.full);

    return data;

};

/**
 * Require() all plugins in list.
 *
 * @param {Array} arr original plugins list
 * @return {Array} require'ed plugins list
 * @private
 */
function _makePluginsList(plugins) {

    return plugins.map(function(plugin) {
        plugin.fn = require('../plugins/' + plugin.name)[plugin.name];

        return plugin;
    });

}

/**
 * Direct or reverse pass.
 *
 * @param {Object} jsdata input data
 * @param {Array} plugins list of the current plugins type
 * @param {Boolean} [reverse] reverse pass?
 * @return {Object} output data
 */
function pass(data, plugins, reverse) {

    plugins = _makePluginsList(plugins);

    function monkeys(items) {

        items.content = items.content.filter(function(item) {

            // reverse pass
            if (reverse && item.content) {
                monkeys(item);
            }

            // main filter
            var i = 0,
                length = plugins.length,
                filter = true;

            while(filter && i < length) {
                var plugin = plugins[i];

                if (plugin.active && plugin.fn(item, plugin.params) === false) {
                    filter = false;
                }

                i++;
            }

            // direct pass
            if (!reverse && item.content) {
                monkeys(item);
            }

            return filter;

        });

        return items;

    }

    return monkeys(data);

}

/**
 * "Full" plugins.
 *
 * @return {[type]} [description]
 */
function full(data, plugins) {

    plugins = _makePluginsList(plugins);

    plugins.forEach(function(plugin) {
        if (plugin.active) {
            data = plugin.fn(data, plugin.params);
        }
    });

    return data;

}
