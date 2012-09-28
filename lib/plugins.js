var INHERIT = require('inherit');

module.exports = function(json, plugins, pluginsEngine) {

    var engine = new (pluginsEngine || PluginsEngine)();

    json = engine.pass(json, plugins.directPass);
    json = engine.pass(json, plugins.reversePass, true);

    return json;

};

var PluginsEngine = exports.PluginsEngine = INHERIT({

    _makePluginsList: function(arr) {

        return arr.map(function(plugin) {
            plugin.fn = require('../plugins/' + plugin.name)[plugin.name];

            return plugin;
        });

    },

    pass: function(json, plugins, reverse) {

        plugins = this._makePluginsList(plugins);

        function monkeys(data) {

            data.content = data.content.filter(function(item) {

                if (reverse && item.content) {
                    monkeys.call(this, item);
                }

                var filter = plugins.some(function(plugin) {
                    return plugin.active && plugin.fn(item, plugin.params) === false;
                });

                if (!reverse && item.content) {
                    monkeys.call(this, item);
                }

                return !filter;

            }, this);

            return data;

        };

        return monkeys.call(this, json);

    },

    full: function() {

        this.fullList.forEach(function(plugin) {
            if (plugin.active) {
                json = plugin.fn(json, plugin.params);
            }
        });

        return json;

    }

});

/*
var MyPluginsEngine = INHERIT(PluginsEngine, {

    __constructor: function(options) {
        this.__base();
    }

});
*/
