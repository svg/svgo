<img src="https://svg.github.io/svgo-logo.svg" width="200" height="200" alt="logo"/>

## SVGO [![NPM version](https://badge.fury.io/js/svgo.svg)](https://npmjs.org/package/svgo)

**SVG O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.
![](https://mc.yandex.ru/watch/18431326)

## Why?

SVG files, especially those exported from various editors, usually contain a lot of redundant and useless information. This can include editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting the SVG rendering result.

## Installation

```sh
npm -g svgo
```
or
```sh
yarn global add svgo
```

## CLI usage

```sh
svgo one.svg two.svg -p one.min.svg two.min.svg
```

Or use --folder, -f flag to optimize whole folder of svg icons
```sh
svgo -f ./path/to/folder/with/svg/files -o ./path/to/folder/with/svg/output
```

See help for advanced usage
```sh
svgo --help
```

## Configuration

Some options can be configured with CLI though it may be easier to have configuration in separate file.
SVGO automatically loads configuration from `svgo.config.js` or module specified with `--config` flag.

```js
module.exports = {
  multipass: true, // boolean. false by default
  datauri: 'enc', // 'base64', 'enc' or 'unenc'. 'base64' by default
  js2svg: {
    indent: 2, // string with spaces or number of spaces. 4 by default
    pretty: true, // boolean, false by default
  }
}
```

SVGO has a plugin-based architecture, so almost every optimization is a separate plugin.
There is a set of [builtin plugins](#builtin-plugins). See how to configure them:

```js
module.exports = {
  plugins: [
    // enable builtin plugin by name
    'builtinPluginName',
    // or by expanded version
    {
      name: 'builtinPluginName'
    },
    // some plugins allow/require to pass options
    {
      name: 'builtinPluginName',
      params: {
        optionName: 'optionValue'
      }
    }
  ]
}
```

If `plugins` field is specified default list is fully overrided. To extend default
list use `extendDefaultPlugins` utility:

```js
const { extendDefaultPlugins } = require('svgo');
module.exports = {
  plugins: extendDefaultPlugins([
    {
      name: 'builtinPluginName',
      params: {
        optionName: 'optionValue'
      }
    }
  ])
}
```

To disable one of default plugins use `active` field:

```js
const { extendDefaultPlugins } = require('svgo');
module.exports = {
  plugins: extendDefaultPlugins([
    {
      name: 'builtinPluginName',
      active: false
    }
  ])
}
```

See the list of default plugins:

```js
module.exports = {
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'inlineStyles',
    'minifyStyles',
    'convertStyleToAttrs',
    'cleanupIDs',
    'removeUselessDefs',
    'cleanupNumericValues',
    'convertColors',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeViewBox',
    'cleanupEnableBackground',
    'removeHiddenElems',
    'removeEmptyText',
    'convertShapeToPath',
    'convertEllipseToCircle',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'mergePaths',
    'removeUnusedNS',
    'sortDefsChildren',
    'removeTitle',
    'removeDesc'
  ]
}
```

It's also possible to specify custom plugin:

```js
const anotherCustomPlugin = require('./another-custom-plugin.js')
module.exports = {
  plugins: [
    {
      name: 'customPluginName',
      type: 'perItem', // 'perItem', 'perItemReverse' or 'full'
      params: {
        optionName: 'optionValue',
      },
      fn: (ast, params, info) => {}
    },
    anotherCustomPlugin
  ]
}
```

## API usage

SVGO provides a few low level utilities. `extendDefaultPlugins` is described above.

### optimize

The core of SVGO is `optimize` function.

```js
const { optimize } = require('svgo');
const result = optimize(svgString, {
  // optional but recommended field
  path: 'path-to.svg',
  // all config fields are also available here
  multipass: true
})
const optimizedSvgString = result.data
```

### loadConfig

If you write a tool on top of svgo you might need a way to load svgo config.

```js
const { loadConfig } = require('svgo');
const config = await loadConfig()

// you can also specify relative or absolute path and customize current working directory
const config = await loadConfig(configFile, cwd)
```

## Builtin plugins

| Plugin | Description | Default |
| ------ | ----------- | ------- |
| [cleanupAttrs](https://github.com/svg/svgo/blob/master/plugins/cleanupAttrs.js) | cleanup attributes from newlines, trailing, and repeating spaces | `enabled` |
| [inlineStyles](https://github.com/svg/svgo/blob/master/plugins/inlineStyles.js) | move and merge styles from `<style>` elements to element `style` attributes | `enabled` |
| [removeDoctype](https://github.com/svg/svgo/blob/master/plugins/removeDoctype.js) | remove doctype declaration | `enabled` |
| [removeXMLProcInst](https://github.com/svg/svgo/blob/master/plugins/removeXMLProcInst.js) | remove XML processing instructions | `enabled` |
| [removeComments](https://github.com/svg/svgo/blob/master/plugins/removeComments.js) | remove comments | `enabled` |
| [removeMetadata](https://github.com/svg/svgo/blob/master/plugins/removeMetadata.js) | remove `<metadata>` | `enabled` |
| [removeTitle](https://github.com/svg/svgo/blob/master/plugins/removeTitle.js) | remove `<title>` | `enabled` |
| [removeDesc](https://github.com/svg/svgo/blob/master/plugins/removeDesc.js) | remove `<desc>` | `enabled` |
| [removeUselessDefs](https://github.com/svg/svgo/blob/master/plugins/removeUselessDefs.js) | remove elements of `<defs>` without `id` | `enabled` |
| [removeXMLNS](https://github.com/svg/svgo/blob/master/plugins/removeXMLNS.js) | removes `xmlns` attribute (for inline svg) | `disabled` |
| [removeEditorsNSData](https://github.com/svg/svgo/blob/master/plugins/removeEditorsNSData.js) | remove editors namespaces, elements, and attributes | `enabled` |
| [removeEmptyAttrs](https://github.com/svg/svgo/blob/master/plugins/removeEmptyAttrs.js) | remove empty attributes | `enabled` |
| [removeHiddenElems](https://github.com/svg/svgo/blob/master/plugins/removeHiddenElems.js) | remove hidden elements | `enabled` |
| [removeEmptyText](https://github.com/svg/svgo/blob/master/plugins/removeEmptyText.js) | remove empty Text elements | `enabled` |
| [removeEmptyContainers](https://github.com/svg/svgo/blob/master/plugins/removeEmptyContainers.js) | remove empty Container elements | `enabled` |
| [removeViewBox](https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js) | remove `viewBox` attribute when possible | `enabled` |
| [cleanupEnableBackground](https://github.com/svg/svgo/blob/master/plugins/cleanupEnableBackground.js) | remove or cleanup `enable-background` attribute when possible | `enabled` |
| [minifyStyles](https://github.com/svg/svgo/blob/master/plugins/minifyStyles.js) | minify `<style>` elements content with [CSSO](https://github.com/css/csso) | `enabled` |
| [convertStyleToAttrs](https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) | convert styles into attributes | `enabled` |
| [convertColors](https://github.com/svg/svgo/blob/master/plugins/convertColors.js) | convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`) | `enabled` |
| [convertPathData](https://github.com/svg/svgo/blob/master/plugins/convertPathData.js) | convert Path data to relative or absolute (whichever is shorter), convert one segment to another, trim useless delimiters, smart rounding, and much more | `enabled` |
| [convertTransform](https://github.com/svg/svgo/blob/master/plugins/convertTransform.js) | collapse multiple transforms into one, convert matrices to the short aliases, and much more | `enabled` |
| [removeUnknownsAndDefaults](https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js) | remove unknown elements content and attributes, remove attrs with default values | `enabled` |
| [removeNonInheritableGroupAttrs](https://github.com/svg/svgo/blob/master/plugins/removeNonInheritableGroupAttrs.js) | remove non-inheritable group's "presentation" attributes | `enabled` |
| [removeUselessStrokeAndFill](https://github.com/svg/svgo/blob/master/plugins/removeUselessStrokeAndFill.js) | remove useless `stroke` and `fill` attrs | `enabled` |
| [removeUnusedNS](https://github.com/svg/svgo/blob/master/plugins/removeUnusedNS.js) | remove unused namespaces declaration | `enabled` |
| [prefixIds](https://github.com/svg/svgo/blob/master/plugins/prefixIds.js) | prefix IDs and classes with the SVG filename or an arbitrary string | `disabled` |
| [cleanupIDs](https://github.com/svg/svgo/blob/master/plugins/cleanupIDs.js) | remove unused and minify used IDs | `enabled` |
| [cleanupNumericValues](https://github.com/svg/svgo/blob/master/plugins/cleanupNumericValues.js) | round numeric values to the fixed precision, remove default `px` units | `enabled` |
| [cleanupListOfValues](https://github.com/svg/svgo/blob/master/plugins/cleanupListOfValues.js) | round numeric values in attributes that take a list of numbers (like `viewBox` or `enable-background`) | `disabled` |
| [moveElemsAttrsToGroup](https://github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) | move elements' attributes to their enclosing group | `enabled` |
| [moveGroupAttrsToElems](https://github.com/svg/svgo/blob/master/plugins/moveGroupAttrsToElems.js) | move some group attributes to the contained elements | `enabled` |
| [collapseGroups](https://github.com/svg/svgo/blob/master/plugins/collapseGroups.js) | collapse useless groups | `enabled` |
| [removeRasterImages](https://github.com/svg/svgo/blob/master/plugins/removeRasterImages.js) | remove raster images | `disabled` |
| [mergePaths](https://github.com/svg/svgo/blob/master/plugins/mergePaths.js) | merge multiple Paths into one | `enabled` |
| [convertShapeToPath](https://github.com/svg/svgo/blob/master/plugins/convertShapeToPath.js) | convert some basic shapes to `<path>` | `enabled` |
| [convertEllipseToCircle](https://github.com/svg/svgo/blob/master/plugins/convertEllipseToCircle.js) | convert non-eccentric `<ellipse>` to `<circle>` | `enabled` |
| [sortAttrs](https://github.com/svg/svgo/blob/master/plugins/sortAttrs.js) | sort element attributes for epic readability | `disabled` |
| [sortDefsChildren](https://github.com/svg/svgo/blob/master/plugins/sortDefsChildren.js) | sort children of `<defs>` in order to improve compression | `enabled` |
| [removeDimensions](https://github.com/svg/svgo/blob/master/plugins/removeDimensions.js) | remove `width`/`height` and add `viewBox` if it's missing (opposite to removeViewBox, disable it first) | `disabled` |
| [removeAttrs](https://github.com/svg/svgo/blob/master/plugins/removeAttrs.js) | remove attributes by pattern | `disabled` |
| [removeAttributesBySelector](https://github.com/svg/svgo/blob/master/plugins/removeAttributesBySelector.js) | removes attributes of elements that match a css selector | `disabled` |
| [removeElementsByAttr](https://github.com/svg/svgo/blob/master/plugins/removeElementsByAttr.js) | remove arbitrary elements by ID or className | `disabled` |
| [addClassesToSVGElement](https://github.com/svg/svgo/blob/master/plugins/addClassesToSVGElement.js) | add classnames to an outer `<svg>` element | `disabled` |
| [addAttributesToSVGElement](https://github.com/svg/svgo/blob/master/plugins/addAttributesToSVGElement.js) | adds attributes to an outer `<svg>` element | `disabled` |
| [removeOffCanvasPaths](https://github.com/svg/svgo/blob/master/plugins/removeOffCanvasPaths.js) | removes elements that are drawn outside of the viewbox | `disabled` |
| [removeStyleElement](https://github.com/svg/svgo/blob/master/plugins/removeStyleElement.js) | remove `<style>` elements | `disabled` |
| [removeScriptElement](https://github.com/svg/svgo/blob/master/plugins/removeScriptElement.js) | remove `<script>` elements | `disabled` |
| [reusePaths](https://github.com/svg/svgo/blob/master/plugins/reusePaths.js) | Find duplicated <path> elements and replace them with <use> links | `disabled` |

## Other Ways to Use SVGO

* as a web app – [SVGOMG](https://jakearchibald.github.io/svgomg/)
* as a GitHub Action – [SVGO Action](https://github.com/marketplace/actions/svgo-action)
* as a Nodejs module – [examples](https://github.com/svg/svgo/tree/master/examples)
* as a Grunt task – [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)
* as a Gulp task – [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
* as a Mimosa module – [mimosa-minify-svg](https://github.com/dbashford/mimosa-minify-svg)
* as an OSX Folder Action – [svgo-osx-folder-action](https://github.com/svg/svgo-osx-folder-action)
* as a webpack loader – [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)
* as a Telegram Bot – [svgo_bot](https://github.com/maksugr/svgo_bot)
* as a PostCSS plugin – [postcss-svgo](https://github.com/ben-eb/postcss-svgo)
* as an Inkscape plugin – [inkscape-svgo](https://github.com/konsumer/inkscape-svgo)
* as a Sketch plugin - [svgo-compressor](https://github.com/BohemianCoding/svgo-compressor)
* as macOS app - [Image Shrinker](https://image-shrinker.com)
* as a Rollup plugin - [rollup-plugin-svgo](https://github.com/porsager/rollup-plugin-svgo)
* as a VS Code plugin - [vscode-svgo](https://github.com/1000ch/vscode-svgo)
* as a Atom plugin - [atom-svgo](https://github.com/1000ch/atom-svgo)
* as a Sublime plugin - [Sublime-svgo](https://github.com/1000ch/Sublime-svgo)
* as a Figma plugin - [Advanced SVG Export](https://www.figma.com/c/plugin/782713260363070260/Advanced-SVG-Export)

## Backers

| [<img src="https://sheetjs.com/sketch128.png" width="80">](https://sheetjs.com/) | [<img src="https://rawgithub.com/fontello/fontello/master/fontello-image.svg" width="80">](http://fontello.com/) |
|:-:|:-:|
| [SheetJS LLC](https://sheetjs.com/) | [Fontello](http://fontello.com/) |

## Donations

- PayPal: https://www.paypal.me/deepsweet

## License and Copyright

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/master/LICENSE).

Logo by [Yegor Bolshakov](http://xizzzy.ru/).
