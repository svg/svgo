<div align="center">
  <img src="./logo/logo-web.svg" width="348.61" height="100" alt="SVGO logo"/>
</div>

## SVGO [![npm version](https://img.shields.io/npm/v/svgo)](https://npmjs.org/package/svgo) [![Discord](https://img.shields.io/discord/815166721315831868)](https://discord.gg/z8jX8NYxrE)

**SVG O**ptimizer is a Node.js-based tool for optimizing SVG vector graphics files.

## Fork Purpose

We saw the need to have a fork of SVGO to use it's architecture - structure and plugins, to create a tool that would allow us to validate the structure of SVG files, by crating a set of rules that would be applied to the SVG files and would return a result of the validation.

## Why?

SVG files, especially those exported from various editors, usually contain a lot of redundant and useless information. This can include editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting the SVG rendering result.

## Test and Validation Capabilities

### Running Plugin Validation Tests

To specifically run the plugin validation tests, use the following command:

```bash
yarn test-plugins
```

### Validating SVG Files Against Rules

To validate a directory of SVG files against a specific validation rule:

```bash
yarn validate-rule --rule=<ruleName> --dir=<directoryPath> [--verbose] [--fail-fast] [--jobs=<number>]
```

Parameters:
- `--rule`: Name of the validation rule to run (e.g., `ensureSingleRootG`)
- `--dir`: Directory containing SVG files to validate
- `--verbose` (optional): Show detailed validation information
- `--fail-fast` (optional): Stop on first validation failure
- `--jobs` (optional): Number of concurrent validation jobs (default: 4)

Example:
```bash
yarn validate-rule --rule=ensureSingleRootG --dir=/path/to/illustrations --verbose --jobs=8
```

### Plugin Validation Structure

The validation tests have a specific structure:

1. **Test Runner**: Located in `test/pluginsValidate/index.test.js`
2. **Test Case Files**: Individual `.svg` files in the `test/pluginsValidate/` directory
3. **Naming Convention**: Files follow the pattern `[checkOrRuleName]_[variantIdentifier].svg`
4. **Embedding Test Parameters**: Test files can include expected outcomes and parameters using a special delimiter format:
   ```svg
   <svg width="10" height="10">...</svg>
   @@@ true @@@ {"somePluginParameter": "value", "anotherParameter": [1, 2, 3]}
   ```

### Adding a New Validation Rule

1. **Define the Plugin Logic** in `pluginsValidate/yourRuleName.js`
2. **Register the Plugin** in `lib/builtinValidate.js`
3. **Add Plugin Configuration** in `pluginsValidate/validatePluginConfig.js` so the plugin is registered for selected types of assets
4. **Create Test Cases** in `test/pluginsValidate/yourRuleName_variant.svg`
5. **Run the Tests** using `yarn test-plugins`

## Installation

Via npm:

```sh
npm -g install svgo
```

Via yarn:

```sh
yarn global add svgo
```

## CLI usage

Processing single files:

```sh
svgo one.svg two.svg -o one.min.svg two.min.svg
```

Processing directory of svg files, recursively using `-f`, `--folder`:

```sh
svgo -f ./path/to/folder/with/svg/files -o ./path/to/folder/with/svg/output
```

Help for advanced usage:

```sh
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

The default preset includes plugins marked with 'Yes' in the [plugin list](#built-in-plugins) below.

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
```

You can also specify a relative or absolute path and customize the current working directory.

```js
const config = await loadConfig(configFile, cwd);
```

## Troubleshooting

### SVG won't scale when CSS is applied on it.

**Observed Problem:** I'm using my SVG files on a website. It looks like the rendered SVG doesn't scale when the dimensions are altered using CSS.

**Possible Solution:** Try disabling `removeViewBox` in the configuration. See [issue #1128](https://github.com/svg/svgo/issues/1128) for details and discussion.

## Built-in plugins

| Plugin                                                                                                            | Description                                                                                                                                              | Default |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| [addAttributesToSVGElement](https://github.com/svg/svgo/blob/main/plugins/addAttributesToSVGElement.js)           | adds attributes to an outer `<svg>` element                                                                                                              |         |
| [addClassesToSVGElement](https://github.com/svg/svgo/blob/main/plugins/addClassesToSVGElement.js)                 | add classnames to an outer `<svg>` element                                                                                                               |         |
| [cleanupAttrs](https://github.com/svg/svgo/blob/main/plugins/cleanupAttrs.js)                                     | cleanup attributes from newlines, trailing, and repeating spaces                                                                                         | Yes     |
| [cleanupEnableBackground](https://github.com/svg/svgo/blob/main/plugins/cleanupEnableBackground.js)               | remove or cleanup `enable-background` attribute when possible                                                                                            | Yes     |
| [cleanupIds](https://github.com/svg/svgo/blob/main/plugins/cleanupIds.js)                                         | remove unused and minify used IDs                                                                                                                        | Yes     |
| [cleanupListOfValues](https://github.com/svg/svgo/blob/main/plugins/cleanupListOfValues.js)                       | round numeric values in attributes that take a list of numbers (like `viewBox` or `enable-background`)                                                   |         |
| [cleanupNumericValues](https://github.com/svg/svgo/blob/main/plugins/cleanupNumericValues.js)                     | round numeric values to the fixed precision, remove default `px` units                                                                                   | Yes     |
| [collapseGroups](https://github.com/svg/svgo/blob/main/plugins/collapseGroups.js)                                 | collapse useless groups                                                                                                                                  | Yes     |
| [convertColors](https://github.com/svg/svgo/blob/main/plugins/convertColors.js)                                   | convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`)                                                                                     | Yes     |
| [convertEllipseToCircle](https://github.com/svg/svgo/blob/main/plugins/convertEllipseToCircle.js)                 | convert non-eccentric `<ellipse>` to `<circle>`                                                                                                          | Yes     |
| [convertPathData](https://github.com/svg/svgo/blob/main/plugins/convertPathData.js)                               | convert Path data to relative or absolute (whichever is shorter), convert one segment to another, trim useless delimiters, smart rounding, and much more | Yes     |
| [convertShapeToPath](https://github.com/svg/svgo/blob/main/plugins/convertShapeToPath.js)                         | convert some basic shapes to `<path>`                                                                                                                    | Yes     |
| [convertStyleToAttrs](https://github.com/svg/svgo/blob/main/plugins/convertStyleToAttrs.js)                       | convert styles into attributes                                                                                                                           |         |
| [convertTransform](https://github.com/svg/svgo/blob/main/plugins/convertTransform.js)                             | collapse multiple transforms into one, convert matrices to the short aliases, and much more                                                              | Yes     |
| [inlineStyles](https://github.com/svg/svgo/blob/main/plugins/inlineStyles.js)                                     | move and merge styles from `<style>` elements to element `style` attributes                                                                              | Yes     |
| [mergePaths](https://github.com/svg/svgo/blob/main/plugins/mergePaths.js)                                         | merge multiple Paths into one                                                                                                                            | Yes     |
| [mergeStyles](https://github.com/svg/svgo/blob/main/plugins/mergeStyles.js)                                       | merge multiple style elements into one                                                                                                                   | Yes     |
| [minifyStyles](https://github.com/svg/svgo/blob/main/plugins/minifyStyles.js)                                     | minify `<style>` elements content with [CSSO](https://github.com/css/csso)                                                                               | Yes     |
| [moveElemsAttrsToGroup](https://github.com/svg/svgo/blob/main/plugins/moveElemsAttrsToGroup.js)                   | move elements' attributes to their enclosing group                                                                                                       | Yes     |
| [moveGroupAttrsToElems](https://github.com/svg/svgo/blob/main/plugins/moveGroupAttrsToElems.js)                   | move some group attributes to the contained elements                                                                                                     | Yes     |
| [prefixIds](https://github.com/svg/svgo/blob/main/plugins/prefixIds.js)                                           | prefix IDs and classes with the SVG filename or an arbitrary string                                                                                      |         |
| [removeAttributesBySelector](https://github.com/svg/svgo/blob/main/plugins/removeAttributesBySelector.js)         | removes attributes of elements that match a CSS selector                                                                                                 |         |
| [removeAttrs](https://github.com/svg/svgo/blob/main/plugins/removeAttrs.js)                                       | remove attributes by pattern                                                                                                                             |         |
| [removeComments](https://github.com/svg/svgo/blob/main/plugins/removeComments.js)                                 | remove comments                                                                                                                                          | Yes     |
| [removeDesc](https://github.com/svg/svgo/blob/main/plugins/removeDesc.js)                                         | remove `<desc>`                                                                                                                                          | Yes     |
| [removeDimensions](https://github.com/svg/svgo/blob/main/plugins/removeDimensions.js)                             | remove `width`/`height` and add `viewBox` if it's missing (opposite to removeViewBox, disable it first)                                                  |         |
| [removeDoctype](https://github.com/svg/svgo/blob/main/plugins/removeDoctype.js)                                   | remove `doctype` declaration                                                                                                                             | Yes     |
| [removeEditorsNSData](https://github.com/svg/svgo/blob/main/plugins/removeEditorsNSData.js)                       | remove editors namespaces, elements, and attributes                                                                                                      | Yes     |
| [removeElementsByAttr](https://github.com/svg/svgo/blob/main/plugins/removeElementsByAttr.js)                     | remove arbitrary elements by `ID` or `className`                                                                                                         |         |
| [removeEmptyAttrs](https://github.com/svg/svgo/blob/main/plugins/removeEmptyAttrs.js)                             | remove empty attributes                                                                                                                                  | Yes     |
| [removeEmptyContainers](https://github.com/svg/svgo/blob/main/plugins/removeEmptyContainers.js)                   | remove empty Container elements                                                                                                                          | Yes     |
| [removeEmptyText](https://github.com/svg/svgo/blob/main/plugins/removeEmptyText.js)                               | remove empty Text elements                                                                                                                               | Yes     |
| [removeHiddenElems](https://github.com/svg/svgo/blob/main/plugins/removeHiddenElems.js)                           | remove hidden elements                                                                                                                                   | Yes     |
| [removeMetadata](https://github.com/svg/svgo/blob/main/plugins/removeMetadata.js)                                 | remove `<metadata>`                                                                                                                                      | Yes     |
| [removeNonInheritableGroupAttrs](https://github.com/svg/svgo/blob/main/plugins/removeNonInheritableGroupAttrs.js) | remove non-inheritable group's "presentation" attributes                                                                                                 | Yes     |
| [removeOffCanvasPaths](https://github.com/svg/svgo/blob/main/plugins/removeOffCanvasPaths.js)                     | removes elements that are drawn outside of the viewbox                                                                                                   |         |
| [removeRasterImages](https://github.com/svg/svgo/blob/main/plugins/removeRasterImages.js)                         | remove raster images                                                                                                                                     |         |
| [removeScriptElement](https://github.com/svg/svgo/blob/main/plugins/removeScriptElement.js)                       | remove `<script>` elements                                                                                                                               |         |
| [removeStyleElement](https://github.com/svg/svgo/blob/main/plugins/removeStyleElement.js)                         | remove `<style>` elements                                                                                                                                |         |
| [removeTitle](https://github.com/svg/svgo/blob/main/plugins/removeTitle.js)                                       | remove `<title>`                                                                                                                                         | Yes     |
| [removeUnknownsAndDefaults](https://github.com/svg/svgo/blob/main/plugins/removeUnknownsAndDefaults.js)           | remove unknown elements content and attributes, remove attributes with default values                                                                    | Yes     |
| [removeUnusedNS](https://github.com/svg/svgo/blob/main/plugins/removeUnusedNS.js)                                 | remove unused namespaces declaration                                                                                                                     | Yes     |
| [removeUselessDefs](https://github.com/svg/svgo/blob/main/plugins/removeUselessDefs.js)                           | remove elements of `<defs>` without `id`                                                                                                                 | Yes     |
| [removeUselessStrokeAndFill](https://github.com/svg/svgo/blob/main/plugins/removeUselessStrokeAndFill.js)         | remove useless `stroke` and `fill` attributes                                                                                                            | Yes     |
| [removeViewBox](https://github.com/svg/svgo/blob/main/plugins/removeViewBox.js)                                   | remove `viewBox` attribute when possible                                                                                                                 | Yes     |
| [removeXMLNS](https://github.com/svg/svgo/blob/main/plugins/removeXMLNS.js)                                       | removes the `xmlns` attribute (for inline SVG)                                                                                                           |         |
| [removeXMLProcInst](https://github.com/svg/svgo/blob/main/plugins/removeXMLProcInst.js)                           | remove XML processing instructions                                                                                                                       | Yes     |
| [reusePaths](https://github.com/svg/svgo/blob/main/plugins/reusePaths.js)                                         | Find duplicated <path> elements and replace them with <use> links                                                                                        |         |
| [sortAttrs](https://github.com/svg/svgo/blob/main/plugins/sortAttrs.js)                                           | sort element attributes for epic readability                                                                                                             | Yes     |
| [sortDefsChildren](https://github.com/svg/svgo/blob/main/plugins/sortDefsChildren.js)                             | sort children of `<defs>` in order to improve compression                                                                                                | Yes     |

## Other ways to use SVGO

| Method            | Reference                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Web app           | [SVGOMG](https://jakearchibald.github.io/svgomg/)                                            |
| GitHub Action     | [SVGO Action](https://github.com/marketplace/actions/svgo-action)                            |
| Grunt task        | [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)                                 |
| Gulp task         | [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)                                         |
| Mimosa module     | [mimosa-minify-svg](https://github.com/dbashford/mimosa-minify-svg)                          |
| OSX Folder Action | [svgo-osx-folder-action](https://github.com/svg/svgo-osx-folder-action)                      |
| Webpack loader    | [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)                     |
| Telegram Bot      | [svgo_bot](https://github.com/maksugr/svgo_bot)                                              |
| PostCSS plugin    | [postcss-svgo](https://github.com/ben-eb/postcss-svgo)                                       |
| Inkscape plugin   | [inkscape-svgo](https://github.com/konsumer/inkscape-svgo)                                   |
| Sketch plugin     | [svgo-compressor](https://github.com/BohemianCoding/svgo-compressor)                         |
| macOS app         | [Image Shrinker](https://image-shrinker.com)                                                 |
| Rollup plugin     | [rollup-plugin-svgo](https://github.com/porsager/rollup-plugin-svgo)                         |
| VS Code plugin    | [vscode-svgo](https://github.com/1000ch/vscode-svgo)                                         |
| Atom plugin       | [atom-svgo](https://github.com/1000ch/atom-svgo)                                             |
| Sublime plugin    | [Sublime-svgo](https://github.com/1000ch/Sublime-svgo)                                       |
| Figma plugin      | [Advanced SVG Export](https://www.figma.com/c/plugin/782713260363070260/Advanced-SVG-Export) |
| Linux app         | [Oh My SVG](https://github.com/sonnyp/OhMySVG)                                               |
| Browser extension | [SVG Gobbler](https://github.com/rossmoody/svg-gobbler)                                      |
| API               | [Vector Express](https://github.com/smidyo/vectorexpress-api#convertor-svgo)                 |

## Donors

| [<img src="https://sheetjs.com/sketch128.png" width="80">](https://sheetjs.com/) | [<img src="https://raw.githubusercontent.com/fontello/fontello/8.0.0/fontello-image.svg" width="80">](https://fontello.com/) |
| :------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|                       [SheetJS LLC](https://sheetjs.com/)                        |                                              [Fontello](https://fontello.com/)                                               |

## License and Copyright

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/main/LICENSE).

Logo by [André Castillo](https://github.com/DerianAndre).
