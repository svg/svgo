**english** | [русский](https://github.com/svg/svgo/blob/master/README.ru.md)
- - -

<img src="http://soulshine.in/svgo.svg" width="200" height="200" alt="logo"/>

## SVGO [![NPM version](https://badge.fury.io/js/svgo.png)](https://npmjs.org/package/svgo) [![Dependency Status](https://gemnasium.com/svg/svgo.png)](https://gemnasium.com/svg/svgo) [![Build Status](https://secure.travis-ci.org/svg/svgo.png)](https://travis-ci.org/svg/svgo) [![Coverage Status](https://coveralls.io/repos/svg/svgo/badge.png?branch=master)](https://coveralls.io/r/svg/svgo)

**SVG O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.
![](https://mc.yandex.ru/watch/18431326)

## Why?

SVG files, especially exported from various editors, usually contains a lot of redundant and useless information such as editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting SVG rendering result.

## What it can do

SVGO has a plugin-based architecture, so almost every optimization is a separate plugin.

Today we have:

* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupAttrs.js) ] cleanup attributes from newlines, trailing and repeating spaces
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeDoctype.js) ] remove doctype declaration
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeXMLProcInst.js) ] remove XML processing instructions
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeComments.js) ] remove comments
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeMetadata.js) ] remove `<metadata>`
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeTitle.js) ] remove `<title>`
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEditorsNSData.js) ] remove editors namespaces, elements and attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyAttrs.js) ] remove empty attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeHiddenElems.js) ] remove hidden elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyText.js) ] remove empty Text elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyContainers.js) ] remove empty Container elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js) ] remove `viewBox` attribute when possible
* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupEnableBackground.js) ] remove or cleanup `enable-background` attribute when possible
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertColors.js) ] convert colors (from `rgb()` to `#rrggbb`, from `#rrggbb` to `#rgb`)
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertPathData.js) ] convert Path data to relative, convert one segment to another, trim useless delimiters and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertTransform.js) ] collapse multiple transforms into one, convert matrices to the short aliases and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js) ] remove unknown elements content and attributes, remove attrs with default values
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeNonInheritableGroupAttrs.js) ] remove non-inheritable group's "presentation" attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeUnusedNS.js) ] remove unused namespaces declaration
* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupIDs.js) ] remove unused and minify used IDs
* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupNumericValues.js) ] round numeric values to the fixed precision, remove default 'px' units
* [ [>](https://github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](https://github.com/svg/svgo/blob/master/plugins/moveGroupAttrsToElems.js) ] move some group attributes to the content elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/collapseGroups.js) ] collapse useless groups
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeRasterImages.js) ] remove raster images (disabled by default)
* [ [>](https://github.com/svg/svgo/blob/master/plugins/mergePaths.js) ] merge multiple Paths into one
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertShapeToPath.js) ] convert some basic shapes to path
* [ [>](https://github.com/svg/svgo/blob/master/plugins/transformsWithOnePath.js) ] apply transforms, crop by real width, center vertical alignment and resize SVG with one Path inside

Want to know how it works and how to write your own plugin? [Of course you want to](https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md).


## How to use

```sh
$ [sudo] npm install -g svgo
```

```
Usage:
  svgo [OPTIONS] [ARGS]

Options:
  -h, --help : Help
  -v, --version : Version
  -i INPUT, --input=INPUT : Input file, "-" for STDIN
  -s STRING, --string=STRING : Input SVG data string
  -f FOLDER, --folder=FOLDER : Input folder, optimize and rewrite all *.svg files
  -o OUTPUT, --output=OUTPUT : Output file (by default the same as the input), "-" for STDOUT
  --config=CONFIG : Config file to extend or replace default
  --disable=DISABLE : Disable plugin by name
  --enable=ENABLE : Enable plugin by name
  --datauri=DATAURI : Output as Data URI string (base64, URI encoded or unencoded)
  --pretty : Make SVG pretty printed

Arguments:
  INPUT : Alias to --input
  OUTPUT : Alias to --output
```

* with files:

        $ svgo test.svg

    or:

        $ svgo test.svg test.min.svg

* with STDIN / STDOUT:

        $ cat test.svg | svgo -i - -o - > test.min.svg

* with folder

        $ svgo -f ../path/to/folder/with/svg/files

* with strings:

        $ svgo -s '<svg version="1.1">test</svg>' -o test.min.svg

    or even with Data URI base64:

        $ svgo -s 'data:image/svg+xml;base64,…' -o test.min.svg

* with SVGZ:

    from `.svgz` to `.svg`:

        $ gunzip -c test.svgz | svgo -i - -o test.min.svg

    from `.svg` to `.svgz`:

        $ svgo test.svg -o - | gzip -cfq9 > test.svgz

* with GUI – [svgo-gui](https://github.com/svg/svgo-gui)
* as a Nodejs module – [examples](https://github.com/svg/svgo/tree/master/examples)
* as a Grunt task – [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)
* as a Gulp task – [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
* as an OSX Folder Action – [svgo-osx-folder-action](https://github.com/svg/svgo-osx-folder-action)

## License and copyrights

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/master/LICENSE).

Logo by [Yegor Bolshakov](http://xizzzy.ru/).
