<div align="center">
  <img src="./logo/logo-web.svg" width="348.61" height="100" alt="SVGO logo"/>
</div>

## SVGO [![npm version](https://img.shields.io/npm/v/svgo)](https://npmjs.org/package/svgo) [![Discord](https://img.shields.io/discord/815166721315831868)](https://discord.gg/z8jX8NYxrE)

**SVG O**ptimizer is a Node.js-based tool for optimizing SVG vector graphics files.

## Why?

SVG files, especially those exported from various editors, usually contain a lot of redundant and useless information. This can include editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting the SVG rendering result.

## Installation

```sh
# Via npm
npm -g install svgo
# Via yarn
yarn global add svgo
```

## CLI usage

```sh
# Processing single files:
svgo one.svg two.svg -o one.min.svg two.min.svg
# Processing directory of svg files, recursively using `-f`, `--folder` :
svgo -f ./path/to/folder/with/svg/files -o ./path/to/folder/with/svg/output
# Help for advanced usage
svgo --help
```

## Configuration

SVGO has a plugin-based architecture, separate plugins allows various xml svg optimizations. See [built-in plugins](#built-in-plugins).
SVGO automatically loads configuration from `svgo.config.js` or from `--config ./path/myconfig.js`. Some general options can be configured via CLI.

```js
// svgo.config.js
module.exports = {
  multipass: true, // boolean. false by default
  datauri: 'enc', // 'base64' (default), 'enc' or 'unenc'.
  js2svg: {
    indent: 2, // string with spaces or number of spaces. 4 by default
    pretty: true, // boolean, false by default
  },
  plugins: [
    // set of built-in plugins enabled by default
    'preset-default',

    // enable built-in plugins by name
    'prefixIds',

    // or by expanded notation which allows to configure plugin
    {
      name: 'sortAttrs',
      params: {
        xmlnsOrder: 'alphabetical',
      },
    },
  ],
};
```

### Default preset

When extending default configuration specify `preset-default` plugin to enable optimisations.
Each plugin of default preset can be disabled or configured with "overrides" param.

```js
module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // customize default plugin options
          inlineStyles: {
            onlyMatchedOnce: false,
          },

          // or disable plugins
          removeDoctype: false,
        },
      },
    },
  ],
};
```

Default preset includes the following list of plugins:

- removeDoctype
- removeXMLProcInst
- removeComments
- removeMetadata
- removeEditorsNSData
- cleanupAttrs
- mergeStyles
- inlineStyles
- minifyStyles
- cleanupIds
- removeUselessDefs
- cleanupNumericValues
- convertColors
- removeUnknownsAndDefaults
- removeNonInheritableGroupAttrs
- removeUselessStrokeAndFill
- removeViewBox
- cleanupEnableBackground
- removeHiddenElems
- removeEmptyText
- convertShapeToPath
- convertEllipseToCircle
- moveElemsAttrsToGroup
- moveGroupAttrsToElems
- collapseGroups
- convertPathData
- convertTransform
- removeEmptyAttrs
- removeEmptyContainers
- mergePaths
- removeUnusedNS
- sortDefsChildren
- removeTitle
- removeDesc

### Custom plugin

It's also possible to specify a custom plugin:

```js
const anotherCustomPlugin = require('./another-custom-plugin.js');
module.exports = {
  plugins: [
    {
      name: 'customPluginName',
      params: {
        optionName: 'optionValue',
      },
      fn: (ast, params, info) => {},
    },
    anotherCustomPlugin,
  ],
};
```

## API usage

SVGO provides a few low level utilities.

### optimize

The core of SVGO is `optimize` function.

```js
const { optimize } = require('svgo');
const result = optimize(svgString, {
  // optional but recommended field
  path: 'path-to.svg',
  // all config fields are also available here
  multipass: true,
});
const optimizedSvgString = result.data;
```

### loadConfig

If you write a tool on top of SVGO you might need a way to load SVGO config.

```js
const { loadConfig } = require('svgo');
const config = await loadConfig();

// you can also specify a relative or absolute path and customize the current working directory
const config = await loadConfig(configFile, cwd);
```

## Built-in plugins

| Plugin                                                                                                              | Description                                                                                                                                              | Default    |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [cleanupAttrs](https://github.com/svg/svgo/blob/main/plugins/cleanupAttrs.js)                                     | cleanup attributes from newlines, trailing, and repeating spaces                                                                                         | `enabled`  |
| [mergeStyles](https://github.com/svg/svgo/blob/main/plugins/mergeStyles.js)                                       | merge multiple style elements into one                                                                                                                   | `enabled`  |
| [inlineStyles](https://github.com/svg/svgo/blob/main/plugins/inlineStyles.js)                                     | move and merge styles from `<style>` elements to element `style` attributes                                                                              | `enabled`  |
| [removeDoctype](https://github.com/svg/svgo/blob/main/plugins/removeDoctype.js)                                   | remove `doctype` declaration                                                                                                                             | `enabled`  |
| [removeXMLProcInst](https://github.com/svg/svgo/blob/main/plugins/removeXMLProcInst.js)                           | remove XML processing instructions                                                                                                                       | `enabled`  |
| [removeComments](https://github.com/svg/svgo/blob/main/plugins/removeComments.js)                                 | remove comments                                                                                                                                          | `enabled`  |
| [removeMetadata](https://github.com/svg/svgo/blob/main/plugins/removeMetadata.js)                                 | remove `<metadata>`                                                                                                                                      | `enabled`  |
| [removeTitle](https://github.com/svg/svgo/blob/main/plugins/removeTitle.js)                                       | remove `<title>`                                                                                                                                         | `enabled`  |
| [removeDesc](https://github.com/svg/svgo/blob/main/plugins/removeDesc.js)                                         | remove `<desc>`                                                                                                                                          | `enabled`  |
| [removeUselessDefs](https://github.com/svg/svgo/blob/main/plugins/removeUselessDefs.js)                           | remove elements of `<defs>` without `id`                                                                                                                 | `enabled`  |
| [removeXMLNS](https://github.com/svg/svgo/blob/main/plugins/removeXMLNS.js)                                       | removes the `xmlns` attribute (for inline SVG)                                                                                                           | `disabled` |
| [removeEditorsNSData](https://github.com/svg/svgo/blob/main/plugins/removeEditorsNSData.js)                       | remove editors namespaces, elements, and attributes                                                                                                      | `enabled`  |
| [removeEmptyAttrs](https://github.com/svg/svgo/blob/main/plugins/removeEmptyAttrs.js)                             | remove empty attributes                                                                                                                                  | `enabled`  |
| [removeHiddenElems](https://github.com/svg/svgo/blob/main/plugins/removeHiddenElems.js)                           | remove hidden elements                                                                                                                                   | `enabled`  |
| [removeEmptyText](https://github.com/svg/svgo/blob/main/plugins/removeEmptyText.js)                               | remove empty Text elements                                                                                                                               | `enabled`  |
| [removeEmptyContainers](https://github.com/svg/svgo/blob/main/plugins/removeEmptyContainers.js)                   | remove empty Container elements                                                                                                                          | `enabled`  |
| [removeViewBox](https://github.com/svg/svgo/blob/main/plugins/removeViewBox.js)                                   | remove `viewBox` attribute when possible                                                                                                                 | `enabled`  |
| [cleanupEnableBackground](https://github.com/svg/svgo/blob/main/plugins/cleanupEnableBackground.js)               | remove or cleanup `enable-background` attribute when possible                                                                                            | `enabled`  |
| [minifyStyles](https://github.com/svg/svgo/blob/main/plugins/minifyStyles.js)                                     | minify `<style>` elements content with [CSSO](https://github.com/css/csso)                                                                               | `enabled`  |
| [convertStyleToAttrs](https://github.com/svg/svgo/blob/main/plugins/convertStyleToAttrs.js)                       | convert styles into attributes                                                                                                                           | `disabled` |
| [convertColors](https://github.com/svg/svgo/blob/main/plugins/convertColors.js)                                   | convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`)                                                                                     | `enabled`  |
| [convertPathData](https://github.com/svg/svgo/blob/main/plugins/convertPathData.js)                               | convert Path data to relative or absolute (whichever is shorter), convert one segment to another, trim useless delimiters, smart rounding, and much more | `enabled`  |
| [convertTransform](https://github.com/svg/svgo/blob/main/plugins/convertTransform.js)                             | collapse multiple transforms into one, convert matrices to the short aliases, and much more                                                              | `enabled`  |
| [removeUnknownsAndDefaults](https://github.com/svg/svgo/blob/main/plugins/removeUnknownsAndDefaults.js)           | remove unknown elements content and attributes, remove attributes with default values                                                                    | `enabled`  |
| [removeNonInheritableGroupAttrs](https://github.com/svg/svgo/blob/main/plugins/removeNonInheritableGroupAttrs.js) | remove non-inheritable group's "presentation" attributes                                                                                                 | `enabled`  |
| [removeUselessStrokeAndFill](https://github.com/svg/svgo/blob/main/plugins/removeUselessStrokeAndFill.js)         | remove useless `stroke` and `fill` attributes                                                                                                            | `enabled`  |
| [removeUnusedNS](https://github.com/svg/svgo/blob/main/plugins/removeUnusedNS.js)                                 | remove unused namespaces declaration                                                                                                                     | `enabled`  |
| [prefixIds](https://github.com/svg/svgo/blob/main/plugins/prefixIds.js)                                           | prefix IDs and classes with the SVG filename or an arbitrary string                                                                                      | `disabled` |
| [cleanupIds](https://github.com/svg/svgo/blob/main/plugins/cleanupIds.js)                                         | remove unused and minify used IDs                                                                                                                        | `enabled`  |
| [cleanupNumericValues](https://github.com/svg/svgo/blob/main/plugins/cleanupNumericValues.js)                     | round numeric values to the fixed precision, remove default `px` units                                                                                   | `enabled`  |
| [cleanupListOfValues](https://github.com/svg/svgo/blob/main/plugins/cleanupListOfValues.js)                       | round numeric values in attributes that take a list of numbers (like `viewBox` or `enable-background`)                                                   | `disabled` |
| [moveElemsAttrsToGroup](https://github.com/svg/svgo/blob/main/plugins/moveElemsAttrsToGroup.js)                   | move elements' attributes to their enclosing group                                                                                                       | `enabled`  |
| [moveGroupAttrsToElems](https://github.com/svg/svgo/blob/main/plugins/moveGroupAttrsToElems.js)                   | move some group attributes to the contained elements                                                                                                     | `enabled`  |
| [collapseGroups](https://github.com/svg/svgo/blob/main/plugins/collapseGroups.js)                                 | collapse useless groups                                                                                                                                  | `enabled`  |
| [removeRasterImages](https://github.com/svg/svgo/blob/main/plugins/removeRasterImages.js)                         | remove raster images                                                                                                                                     | `disabled` |
| [mergePaths](https://github.com/svg/svgo/blob/main/plugins/mergePaths.js)                                         | merge multiple Paths into one                                                                                                                            | `enabled`  |
| [convertShapeToPath](https://github.com/svg/svgo/blob/main/plugins/convertShapeToPath.js)                         | convert some basic shapes to `<path>`                                                                                                                    | `enabled`  |
| [convertEllipseToCircle](https://github.com/svg/svgo/blob/main/plugins/convertEllipseToCircle.js)                 | convert non-eccentric `<ellipse>` to `<circle>`                                                                                                          | `enabled`  |
| [sortAttrs](https://github.com/svg/svgo/blob/main/plugins/sortAttrs.js)                                           | sort element attributes for epic readability                                                                                                             | `enabled` |
| [sortDefsChildren](https://github.com/svg/svgo/blob/main/plugins/sortDefsChildren.js)                             | sort children of `<defs>` in order to improve compression                                                                                                | `enabled`  |
| [removeDimensions](https://github.com/svg/svgo/blob/main/plugins/removeDimensions.js)                             | remove `width`/`height` and add `viewBox` if it's missing (opposite to removeViewBox, disable it first)                                                  | `disabled` |
| [removeAttrs](https://github.com/svg/svgo/blob/main/plugins/removeAttrs.js)                                       | remove attributes by pattern                                                                                                                             | `disabled` |
| [removeAttributesBySelector](https://github.com/svg/svgo/blob/main/plugins/removeAttributesBySelector.js)         | removes attributes of elements that match a CSS selector                                                                                                 | `disabled` |
| [removeElementsByAttr](https://github.com/svg/svgo/blob/main/plugins/removeElementsByAttr.js)                     | remove arbitrary elements by `ID` or `className`                                                                                                         | `disabled` |
| [addClassesToSVGElement](https://github.com/svg/svgo/blob/main/plugins/addClassesToSVGElement.js)                 | add classnames to an outer `<svg>` element                                                                                                               | `disabled` |
| [addAttributesToSVGElement](https://github.com/svg/svgo/blob/main/plugins/addAttributesToSVGElement.js)           | adds attributes to an outer `<svg>` element                                                                                                              | `disabled` |
| [removeOffCanvasPaths](https://github.com/svg/svgo/blob/main/plugins/removeOffCanvasPaths.js)                     | removes elements that are drawn outside of the viewbox                                                                                                   | `disabled` |
| [removeStyleElement](https://github.com/svg/svgo/blob/main/plugins/removeStyleElement.js)                         | remove `<style>` elements                                                                                                                                | `disabled` |
| [removeScriptElement](https://github.com/svg/svgo/blob/main/plugins/removeScriptElement.js)                       | remove `<script>` elements                                                                                                                               | `disabled` |
| [reusePaths](https://github.com/svg/svgo/blob/main/plugins/reusePaths.js)                                         | Find duplicated <path> elements and replace them with <use> links                                                                                        | `disabled` |

## Other Ways to Use SVGO

- as a web app – [SVGOMG](https://jakearchibald.github.io/svgomg/)
- as a GitHub Action – [SVGO Action](https://github.com/marketplace/actions/svgo-action)
- as a Grunt task – [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)
- as a Gulp task – [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
- as a Mimosa module – [mimosa-minify-svg](https://github.com/dbashford/mimosa-minify-svg)
- as an OSX Folder Action – [svgo-osx-folder-action](https://github.com/svg/svgo-osx-folder-action)
- as a webpack loader – [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)
- as a Telegram Bot – [svgo_bot](https://github.com/maksugr/svgo_bot)
- as a PostCSS plugin – [postcss-svgo](https://github.com/ben-eb/postcss-svgo)
- as an Inkscape plugin – [inkscape-svgo](https://github.com/konsumer/inkscape-svgo)
- as a Sketch plugin - [svgo-compressor](https://github.com/BohemianCoding/svgo-compressor)
- as a macOS app - [Image Shrinker](https://image-shrinker.com)
- as a Rollup plugin - [rollup-plugin-svgo](https://github.com/porsager/rollup-plugin-svgo)
- as a VS Code plugin - [vscode-svgo](https://github.com/1000ch/vscode-svgo)
- as a Atom plugin - [atom-svgo](https://github.com/1000ch/atom-svgo)
- as a Sublime plugin - [Sublime-svgo](https://github.com/1000ch/Sublime-svgo)
- as a Figma plugin - [Advanced SVG Export](https://www.figma.com/c/plugin/782713260363070260/Advanced-SVG-Export)
- as a Linux app - [Oh My SVG](https://github.com/sonnyp/OhMySVG)
- as a Browser extension - [SVG Gobbler](https://github.com/rossmoody/svg-gobbler)
- as an API - [Vector Express](https://github.com/smidyo/vectorexpress-api#convertor-svgo)

## Donators

| [<img src="https://sheetjs.com/sketch128.png" width="80">](https://sheetjs.com/) | [<img src="https://raw.githubusercontent.com/fontello/fontello/8.0.0/fontello-image.svg" width="80">](https://fontello.com/) |
| :------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------: |
|                       [SheetJS LLC](https://sheetjs.com/)                        |                                               [Fontello](https://fontello.com/)                                               |

## License and Copyright

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/main/LICENSE).

Logo by [André Castillo](https://github.com/DerianAndre).
