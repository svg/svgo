```
o-o o   o o--o o-o
 \   \ /  |  | | |
o-o   o   o--o o-o
             |
          o--o
```

## SVGO v0.0.8 [![Build Status](https://secure.travis-ci.org/svg/svgo.png)](http://travis-ci.org/svg/svgo)

**SVG** **O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.

## Why?

SVG files, especially exported from various editors, usually contains a lot of redundant and useless information such as editor metadata, comments, hidden elements, default values or non-optimal values and other stuff that can be safely removed or converted without affecting SVG rendering result.

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
* [ [>](https://github.com/svg/svgo/blob/master/plugins/cleanupSVGElem.js) ] cleanup SVG element from useless attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertColors.js) ] convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertPathData.js) ] convert Path data to relative, trim useless delimiters and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/convertTransform.js) ] collapse multiple transforms into one, convert matrices to the short aliases and much more
* [ [>](https://github.com/svg/svgo/blob/master/plugins/removeUnusedNS.js) ] remove unused namespaces declaration
* [ [>](https://github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](https://github.com/svg/svgo/blob/master/plugins/collapseGroups.js) ] collapse groups

How-to instructions and plugins API docs will coming ASAP.


## How to use

```
npm install -g svgo
```

```
Usage:
  svgo [OPTIONS] [ARGS]

Options:
  -h, --help : Help
  -v, --version : Version
  -i INPUT, --input=INPUT : Input: stdin (default) | filename | Data URI base64 string
  -o OUTPUT, --output=OUTPUT : Output: stdout (default) | filename
  -c CONFIG, --config=CONFIG : Local config file to extend default
  --disable=DISABLE : Disable plugin by name
  --enable=ENABLE : Enable plugin by name
  --datauri : Output as Data URI base64 string
  --pretty : Make SVG pretty printed
  --test : Make a visual comparison of two files (PhantomJS pre-required)
```

With files:

```
svgo -i test.svg -o test.min.svg
```

With stdin / stdout:

```
cat test.svg | svgo > test.min.svg
```

With Data URI base64 strings:

```
svgo -i 'data:image/svg+xml;base64,…' -o test.min.svg
```

## TODO

1. documentation and "plugins how-to"
2. batch folder optimization
3. more plugins
4. more unit tests
5. online SVGO web service
6. …
