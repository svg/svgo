'use strict';

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Object} plugins plugins object from config
 * @return {Object} output data
 */
module.exports = function(data, info, plugins) {
  const perItemPlugins = [];
  const perItemReversePlugins = [];
  const fullPlugins = [];
  // Try to group sequential elements of plugins array
  for (const plugin of plugins) {
    switch(plugin.type) {
      case 'perItem':
        perItemPlugins.push(plugin);
        break;
      case 'perItemReverse':
        perItemReversePlugins.push(plugin);
        break;
      case 'full':
        fullPlugins.push(plugin);
        break;
    }
  }
  if (perItemPlugins.length !== 0) {
    data = perItem(data, info, perItemPlugins);
  }
  if (perItemReversePlugins.length !== 0) {
    data = perItem(data, info, perItemReversePlugins, true);
  }
  if (fullPlugins.length !== 0) {
    data = full(data, info, fullPlugins);
  }
  return data;
};

/**
 * Direct or reverse per-item loop.
 *
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Array} plugins plugins list to process
 * @param {Boolean} [reverse] reverse pass?
 * @return {Object} output data
 */
function perItem(data, info, plugins, reverse) {

    function monkeys(items) {

        items.content = items.content.filter(function(item) {

            // reverse pass
            if (reverse && item.content) {
                monkeys(item);
            }

            // main filter
            var filter = true;

            for (var i = 0; filter && i < plugins.length; i++) {
                var plugin = plugins[i];

                if (plugin.active && plugin.fn(item, plugin.params, info) === false) {
                    filter = false;
                }
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
 * @param {Object} data input data
 * @param {Object} info extra information
 * @param {Array} plugins plugins list to process
 * @return {Object} output data
 */
function full(data, info, plugins) {

    plugins.forEach(function(plugin) {
        if (plugin.active) {
            data = plugin.fn(data, plugin.params, info);
        }
    });

    return data;

}
