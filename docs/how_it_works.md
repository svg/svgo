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

Plugins can remove and modify SVG elements, collapse contents, move attributes and do any other actions you want.

## How it works
### 1. config
SVGO reads, parses and/or extends the [default config](https://github.com/svg/svgo/blob/master/.svgo.yml), which contains all the SVGO settings, including plugins. Something like this:

```yaml
plugins:
  - myTestPlugin
  - myTestPlugin2: false
  - myTestPlugin3:
      param1: 1
      param2: 2
    …
```

It's important to note that every plugin:

  * has its specific position in the plugins list,
  * can be turned on with `name: true` and off with `name: false`,
  * can have its own `params` which will be available later inside a plugin.

These settings can be changed by the provided config file with `--config` command line option. You can force using only your settings with the `full: true` parameter in your config:

```yaml
full: true
plugins:
  - myTestPlugin
  - myTestPlugin3:
      param1: 1
      param2: 2
    …
```

In such a case only listed plugins will be run.

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

  * there are special object keys to represent various SVG nodes: `elem`, `processinginstruction`, `doctype`, `comment`, `cdata` and `text`,
  * `content` is always an array,
  * `attrs` object keys represents a full attr name with namespace if it is, and all the details are inside as the `prefix` and `local` parts.

- - -

### 3. plugins
SVGO applies all plugins from the config to AST data. See a lot of examples in the [plugins directory](https://github.com/svg/svgo/tree/master/plugins) above.


#### 3.1 types
In the simplest case plugins applying process can be represented as "each plugin runs over all AST data items and perform some actions". But 90% of typical optimizations requires some actions only on one (current) item from the data, so there is no sense to copypaste a recursive per-item loop every time on every plugin. And that's why we have a three types of plugins:

* `perItem` - plugin works only with one current item, inside a "from the outside into the depths" recursive loop (default),
* `perItemReverse` - plugin works only with one current item, inside a "from the depths to the outside" recursive loop (useful when you need to collapse elements one after other),
* `full` - plugin works with the full AST and must returns the same.

`perItem` and `perItemReverse` plugins runs inside the recursive `Array.prototype.filter` loop, so if a plugin wants to remove current item then it should just `return false`.

But that's not all ;). We got rid of a loop copypasting, but every plugin still runs over all the SVG-as-JS data, which is not very optimal. Actually, at the first step where we got a config, there was a collapsing of consecutive plugins with the same type, so ultimately one loop wraps a group of plugins:

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

##### renameElem(name)
  * Renames an element.
  * @param {String} name new element name
  * @return {Object} element

##### clone()
  * Perform a deep clone of this node.
  * @return {Object} element

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


##### querySelectorAll(selectors)
  * Evaluate a string of CSS selectors against the element and returns matched elements
  * @param {String} selectors CSS selector(s) string
  * @return {Array} null if no elements matched

##### querySelector(selectors)
  * Evaluate a string of CSS selectors against the element and returns only the first matched element
  * @param {String} selectors CSS selector(s) string
  * @return {Array} null if no element matched

##### matches(selector)
  * Test if a selector matches a given element
  * @param {String} selector CSS selector string
  * @return {Boolean} true if element would be selected by selector string, false if it does not


##### style.getCssText()
  * Get the textual representation of the declaration block (equivalent to .cssText attribute).
  * @return {String} Textual representation of the declaration block (empty string for no properties)

##### style.getPropertyPriority(propertyName)
  * Return the optional priority, "important".
  * @param {String} propertyName representing the property name to be checked.
  * @return {String} priority that represents the priority (e.g. "important") if one exists. If none exists, returns the empty string.

##### style.getPropertyValue(propertyName)
  * Return the property value given a property name.
  * @param {String} propertyName representing the property name to be checked.
  * @return {String} value containing the value of the property. If not set, returns the empty string.

##### style.item(index)
  * Return a property name.
  * @param {Number} index of the node to be fetched. The index is zero-based.
  * @return {String} propertyName that is the name of the CSS property at the specified index.

##### style.getProperties()
  * Return all properties of the node.
  * @return {Map} properties that is a Map with propertyName as key and property (propertyValue + propertyPriority) as value.

##### style.removeProperty(propertyName)
  * Remove a property from the CSS declaration block.
  * @param {String} propertyName representing the property name to be removed.
  * @return {String} oldValue equal to the value of the CSS property before it was removed.

##### style.setProperty(propertyName, value, priority)
  * Modify an existing CSS property or creates a new CSS property in the declaration block.
  * @param {String} propertyName representing the CSS property name to be modified.
  * @param {String} [value] containing the new property value. If not specified, treated as the empty string. value must not contain "!important" -- that should be set using the priority parameter.
  * @param {String} [priority] allowing the "important" CSS priority to be set. If not specified, treated as the empty string.
  * @return {undefined}


##### css-tools.flattenToSelectors(cssAst)
  * Flatten a CSS AST to a selectors list.
  * @param {Object} CSS AST to flatten
  * @return {Array} selectors

##### css-tools.filterByMqs(selectors, useMqs)
  * Filter selectors by Media Query.
  * @param {Array} Selectors to filter
  * @param {Array} Strings of media queries that should pass (<name> <expression>)
  * @return {Array} Filtered selectors that match the passed media queries

##### css-tools.filterByPseudos(selectors, useMqs)
  * Filter selectors by the pseudo-elements and/or -classes they contain.
  * @param {Array} Selectors to filter
  * @param {Array} Strings of single or sequence of pseudo-elements and/or -classes that should pass
  * @return {Array} Filtered selectors that match the passed pseudo-elements and/or -classes

##### css-tools.cleanPseudos(selectors)
  * Remove pseudo-elements and/or -classes from the selectors for proper matching.
  * @param {Array} Selectors to clean
  * @return {Array} Selectors without pseudo-elements and/or -classes

##### css-tools.compareSpecificity(aSpecificity, bSpecificity)
  * Compare two selector specificities.
  * @param {Array} Specificity of selector A
  * @param {Array} Specificity of selector B
  * @return {Number} Score of selector specificity A compared to selector specificity B

##### css-tools.compareSimpleSelectorNode(aSimpleSelectorNode, bSimpleSelectorNode)
  * Compare two simple selectors.
  * @param {Object} Simple selector A
  * @param {Object} Simple selector B
  * @return {Number} Score of selector A compared to selector B

##### css-tools.sortSelectors(selectors)
  * Sort selectors stably by their specificity.
  * @param {Array} Selectors to be sorted
  * @return {Array} Stable sorted selectors

##### css-tools.csstreeToStyleDeclaration(declaration)
  * Convert a css-tree AST style declaration to CSSStyleDeclaration property.
  * @param {Object} css-tree style declaration
  * @return {Object} CSSStyleDeclaration property

##### css-tools.getCssStr(elem)
  * Gets the CSS string of a style element
  * @param {Object} element style element
  * @return {String|Array} CSS string or empty array if no styles are set

##### css-tools.csstreeToStyleDeclaration(elem, css)
  * @param {Object} element style element
  * @param {String} CSS string to be set
  * @return {Object} reference to field with CSS


#### 3.3 tests

There is nothing easier than testing your plugin:

1. put `myPlugin.01.svg` in `test/plugins` like:

```
[original svg]

@@@

[how svg should look afterwards]

@@@

attributes if your plugin needs them
```

2. run `npm test`
3. PROFIT!

You can see a lot of examples in the [test/plugins directory](https://github.com/svg/svgo/tree/master/test/plugins).

- - -

### 4. js2svg
SVGO converts AST back into SVG-as-XML data string.

## What's next
1. Write your own plugin :) or
2. Give me an idea of new optimization or API method
