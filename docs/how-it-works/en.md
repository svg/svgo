## TOC
* [Intro](#intro)
* [How it works](#how-it-works)
  * [config](#1-config)
  * [svg2js](#2-svg2js)
  * [plugins](#3-plugins)
      * [types](#31-types)
      * [API](#32-api)
      * [tests](#33-tests)
  * [js2svg](#4-js2svg)
* [What's next](#whats-next)


## Intro
So, as [mentioned earlier](https://github.com/svg/svgo#what-it-can-do), SVGO has a plugin-based architecture and almost every optimization is a separate plugin.

Plugins can delete and modify SVG elements, collapse contents, move attributes and do any other actions you want.

## How it works
### 1. config
SVGO reads, parses and/or extends the [default config](https://github.com/svg/svgo/blob/master/.svgo.yml), which contains all the SVGO settings, including plugins. Something like this:

```yaml
plugins:

  - name: myTestPlugin
    active: true
    type: perItem
    params:
      testParam: true
      testParam2: 3

  - name: myTestPlugin2
    active: false
    type: perItemReverse

  - name: myTestPlugin3
    active: true
    type: full

    …
```

It's important to note that every plugin:

  * has its specific position in the plugins array
  * can be turned on with `"active": true` and off with `"active": false`
  * can have its own `params` which will be available later inside a plugin
  * must be one of three types: `perItem`, `perItemReverse` and `full` (we'll return to this later)

- - -

### 2. svg2js
SVGO converts SVG-as-XML data into SVG-as-JS AST representation. Something like this:

```xml
<?xml version="1.0" standalone="no"?>
<!-- Generator: Adobe Illustrator 16.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
    <text>test</text>
    <script><![CDATA[ alert('hello'); ]]></script>
</svg>
```

```js
{
    content: [
        {
            processinginstruction: { name: 'xml', body: 'version="1.0" standalone="no"' }
        },{
            doctype: ' svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"'
        },{
            comment: 'Generator: Adobe Illustrator 16.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)'
        },{
            elem: 'svg',
            prefix: '',
            local: 'svg',
            attrs: {
                version: {
                    name: 'version',
                    value: '1.1',
                    prefix: '',
                    local: 'version'
                },
                xmlns: {
                    name: 'xmlns',
                    value: 'http://www.w3.org/2000/svg',
                    prefix: 'xmlns',
                    local: ''
                }
            },
            content: [
                {
                    elem: 'text',
                    prefix: '',
                    local: 'text',
                    content: [ { text: 'test' } ]
                },{
                    elem: 'script',
                    prefix: '',
                    local: 'script',
                    content: [ { cdata: ' alert(\'hello\'); ' } ]
                }
            ]

        }
    ]
}
```

It's important to note that:

  * there are special object keys to represent various SVG nodes: `elem`, `processinginstruction`, `doctype`, `comment`, `cdata` and `text`
  * `content` is always an array
  * `attrs` object keys represents a full attr name with namespace if it is, and all the details are inside as the `prefix` and `local` parts

- - -

### 3. plugins
SVGO applies all plugins from the config to AST data. See a lot of examples in the [plugins directory](https://github.com/svg/svgo/tree/master/plugins) above.


#### 3.1 types
In the simplest case plugins applying process can be represented as "each plugin runs over all AST data items and perform some actions". But 90% of typical optimizations requires some actions only on one (current) item from the data, so there is no sense to copypaste a recursive per-item loop every time on every plugin. And that's why we have a three types of plugins:

* `perItem` - plugin works only with one current item, inside a "from the outside into the depths" recursive loop (default)
* `perItemReverse` - plugin works only with one current item, inside a "from the depths to the outside" recursive loop (useful when you need to collapse elements one after other)
* `full` - plugin works with the full AST and must returns the same

`perItem` and `perItemReverse` plugins runs inside the recursive `Array.prototype.filter` loop, so if a plugin wants to remove current item then it should just `return false`.

But that's not all ;) We got rid of a loop copypasting, but every plugin still runs over all the SVG-as-JS data, which is not very optimal. Actually, at the first step where we got a config, there was a collapsing of consecutive plugins with the same type, so ultimately one loop wraps a group of plugins:

```yaml
plugins

  - [perItem group],
  - [perItemReverse group],
  - …
  - [perItem group],
  - …
  - [full group]
  - …

  …
```

#### 3.2 API

And of course, writing plugins would not have been so cool without some sugar API:

##### isElem([param])
  * Determine if item is an element (any, with a specific name or in a names array).
  * @param {String|Array} [param] element name or names arrays
  * @return {Boolean}

##### isEmpty()
  * Determine if element is empty.
  * @return {Boolean}

##### hasAttr([attr], [val])
  * Determine if element has an attribute (any, or by name or by name + value).
  * @param {String} [name] attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Boolean}

##### attr(name, [val])
  * Get a specific attribute from an element (by name or name + value).
  * @param {String} name attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Object|Undefined}

##### removeAttr(name, [val])
  * Remove a specific attribute (by name or name + val).
  * @param {String} name attribute name
  * @param {String} [val] attribute value
  * @return {Boolean}

##### addAttr(attr)
  * Add an attribute.
  * @param {Object} attr attribute object
  * @return {Object} created attribute

##### eachAttr(callback, [context])
  * Iterates over all attributes.
  * @param {Function} callback
  * @param {Object} [context] callback context
  * @return {Boolean} false if there are no any attributes

#### 3.3 tests

There is nothing easier than testing your plugin:

1. put `myPlugin.01.orig.svg` and `myPlugin.01.should.svg` in `test/plugins`
2. run `npm test`
3. PROFIT!

You can see a lot of examples in the [test/plugins directory](https://github.com/svg/svgo/tree/master/test/plugins).

- - -

### 4. js2svg
SVGO converts AST back into SVG-as-XML data string.

## What's next
1. Write your own plugin :) or
2. Give me an idea of new optimization or API method
