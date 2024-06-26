<div align="center">
  <img src="./logo/logo-web.svg" width="348.61" height="100" alt=""/>
</div>

# SVGO [![Discord](https://img.shields.io/discord/815166721315831868?logo=discord&logoColor=whitesmoke&label=Discord&color=5865F2)](https://discord.gg/z8jX8NYxrE) [![docs](https://img.shields.io/badge/docs-svgo.dev-blue)](https://svgo.dev) [![GitHub License](https://img.shields.io/github/license/svg/svgo?logo=github)](https://github.com/svg/svgo/blob/main/LICENSE)

SVGO, short for **SVG O**ptimizer, is a Node.js library and command-line application for optimizing SVG files.

## Why?

SVG files, especially those exported from vector editors, usually contain a lot of redundant information. This includes editor metadata, comments, hidden elements, default or suboptimal values, and other stuff that can be safely removed or converted without impacting rendering.

## Installation

You can install SVGO globally through npm, yarn, or pnpm. Alternatively, drop the global flag (`global`/`-g`) to use it in your Node.js project.

### npm
[![Download](https://img.shields.io/badge/npm-Download-blue?logo=npm)](https://www.npmjs.com/package/svgo)
![NPM Collaborators](https://img.shields.io/npm/collaborators/svgo?logo=npm)
![NPM License](https://img.shields.io/npm/l/svgo?logo=npm)
[![npm](https://img.shields.io/npm/v/svgo?logo=npm)](https://npmjs.org/package/svgo)

![NPM Downloads](https://img.shields.io/npm/dw/svgo?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dm/svgo?logo=npm)
![NPM Downloads](https://img.shields.io/npm/dy/svgo?logo=npm)
![NPM Downloads](https://img.shields.io/npm/d18m/svgo?logo=npm)

```sh
npm install -g svgo
```

### yarn
[![Static Badge](https://img.shields.io/badge/yarn-Download-blue?logo=yarn)](https://yarnpkg.com/package?name=svgo)
```sh
yarn global add svgo
```

### pnpm
```sh
pnpm add -g svgo
```

### Homebrew
```sh
brew install svgo
```

## Command-line usage

Process single files:

```sh
svgo one.svg two.svg -o one.min.svg two.min.svg
```

Process a directory of files recursively with `-f`/`--folder`:

```sh
svgo -f path/to/directory_with_svgs -o path/to/output_directory
```

Help for advanced usage:

```sh
svgo --help
```

## Configuration

SVGO has a plugin architecture. You can read more about all plugins in [Plugins | SVGO Documentation](https://svgo.dev/docs/plugins/), and the default plugins in [Preset Default | SVGO Documentation](https://svgo.dev/docs/preset-default/).

SVGO reads the configuration from `svgo.config.mjs` or the `--config path/to/config.mjs` command-line option. Some other parameters can be configured though command-line options too.

**`svgo.config.mjs`**

```js
export default {
  multipass: false, // boolean
  datauri: 'base64', // 'base64'|'enc'|'unenc'
  js2svg: {
    indent: 4, // number
    pretty: false, // boolean
  },
  plugins: [
    'preset-default', // built-in plugins enabled by default
    'prefixIds', // enable built-in plugins by name

    // enable built-in plugins with an object to configure plugins
    {
      name: 'prefixIds',
      params: {
        prefix: 'uwu',
      },
    },
  ],
};
```

### Default preset

Instead of configuring SVGO from scratch, you can tweak the default preset to suit your needs by configuring or disabling the respective plugin.

**`svgo.config.mjs`**

```js
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // disable a default plugin
          cleanupIds: false,

          // customize the params of a default plugin
          inlineStyles: {
            onlyMatchedOnce: false,
          },
        },
      },
    },
  ],
};
```

You can find a list of the default plugins in the order they run in [Preset Default | SVGO Documentation](https://svgo.dev/docs/preset-default/#plugins-list).

### Custom plugins

You can also specify custom plugins:

**`svgo.config.mjs`**

```js
import importedPlugin from './imported-plugin';

export default {
  plugins: [
    // plugin imported from another JavaScript file
    importedPlugin,

    // plugin defined inline
    {
      name: 'customPlugin',
      params: {
        paramName: 'paramValue',
      },
      fn: (ast, params, info) => {},
    },
  ],
};
```

## API usage

SVGO provides a few low level utilities.

### optimize

The core of SVGO is `optimize` function.

```js
import { optimize } from 'svgo';

const result = optimize(svgString, {
  path: 'path-to.svg', // recommended
  multipass: true, // all other config fields are available here
});

const optimizedSvgString = result.data;
```

### loadConfig

If you write a tool on top of SVGO you may want to resolve the `svgo.config.mjs` file.

```js
import { loadConfig } from 'svgo';

const config = await loadConfig();
```

You can also specify a path and customize the current working directory.

```js
const config = await loadConfig(configFile, cwd);
```

## Donors

| [<img src="https://sheetjs.com/sketch128.png" width="80">](https://sheetjs.com/) | [<img src="https://raw.githubusercontent.com/fontello/fontello/8.0.0/fontello-image.svg" width="80">](https://fontello.com/) |
| :------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|                       [SheetJS LLC](https://sheetjs.com/)                        |                                              [Fontello](https://fontello.com/)                                               |

## License and Copyright

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/main/LICENSE).

Logo by [André Castillo](https://github.com/DerianAndre).
