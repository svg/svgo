![logo](https://raw.github.com/svg/svgo/master/logo200x200.png)

## SVGO v0.1.2 [![Build Status](https://secure.travis-ci.org/svg/svgo.png)](http://travis-ci.org/svg/svgo)

**SVG** **O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.
![](//mc.yandex.ru/watch/18431326)

## Why?

SVG files, especially exported from various editors, usually contains a lot of redundant and useless information such as editor metadata, comments, hidden elements, default or non-optimal values and other stuff that can be safely removed or converted without affecting SVG rendering result.

## What it can do

SVGO has a plugin-based architecture, so almost every optimization is a separate plugin.

Today we have:

* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupAttrs.js) ] cleanup attributes from newlines, trailing and repeating spaces
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeDoctype.js) ] remove doctype declaration
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeXMLProcInst.js) ] remove XML processing instructions
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeComments.js) ] remove comments
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeMetadata.js) ] remove metadata
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEditorsNSData.js) ] remove editors namespaces, elements and attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyAttrs.js) ] remove empty attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeDefaultPx.js) ] remove default "px" unit
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeHiddenElems.js) ] remove a lot of hidden elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyText.js) ] remove empty Text elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeEmptyContainers.js) ] remove empty Container elements
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js) ] remove viewBox attribute
* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupEnableBackground.js) ] remove or cleanup enable-background attribute
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertColors.js) ] convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertPathData.js) ] convert Path data to relative, convert one segment to another, trim useless delimiters and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertTransform.js) ] collapse multiple transforms into one, convert matrices to the short aliases and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js) ] remove unknown elements content and attributes, remove attrs with default values
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeUnusedNS.js) ] remove unused namespaces declaration
* [ [>](https://github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](https://github.com/svg/svgo/blob/master/plugins/collapseGroups.js) ] collapse groups

Want to know how it works and how to write your own plugin? [Of course you want to](https://github.com/svg/svgo/tree/master/plugins#readme).


## How to use

```sh
$ [sudo] npm install -g svgo
```

```sh
Usage:
  svgo [OPTIONS] [ARGS]

Options:
  -h, --help : Help
  -v, --version : Version
  -i INPUT, --input=INPUT : Input file, "-" for STDIN
  -s STRING, --string=STRING : Input SVG data string
  -f FOLDER, --folder=FOLDER : Input folder, optimize and rewrite all *.svg files
  -o OUTPUT, --output=OUTPUT : Output file (by default the same as the input), "-" for STDOUT
  -c CONFIG, --config=CONFIG : Local config file to extend default
  --disable=DISABLE : Disable plugin by name
  --enable=ENABLE : Enable plugin by name
  --datauri : Output as Data URI base64 string
  --pretty : Make SVG pretty printed

Arguments:
  INPUT : Alias to --input
  OUTPUT : Alias to --output
```

* with files:

```sh
$ svgo test.svg
```
```sh
$ svgo test.svg test.min.svg
```

* with STDIN / STDOUT:

```sh
$ cat test.svg | svgo -i - -o - > test.min.svg
```

* with folder

```sh
$ svgo -f ../path/to/folder/with/svg/files
```

* with strings (even with Data URI base64):

```sh
$ svgo -s '<svg version="1.1">test</svg>' -o test.min.svg
```
```sh
$ svgo -s 'data:image/svg+xml;base64,…' -o test.min.svg
```
* with [GUI](https://github.com/svg/svgo-gui) (currently Mac OS X app only)
* as a Nodejs module - [examples](https://github.com/svg/svgo/tree/master/examples)

## TODO

* [v0.1.3](https://github.com/svg/svgo/issues?milestone=5&state=open)
* [v0.1.4](https://github.com/svg/svgo/issues?milestone=6&state=open)


## License and copyrights

This software is released under the terms of the [MIT license](https://github.com/svg/svgo/blob/master/LICENSE).

Logo by [Yegor Bolshakov](http://xizzzy.ru/).