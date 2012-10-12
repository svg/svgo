```
o-o o   o o--o o-o
 \   \ /  |  | | |
o-o   o   o--o o-o
             |
          o--o
```

## SVGO [![Build Status](https://secure.travis-ci.org/svg/svgo.png)](http://travis-ci.org/svg/svgo)

**SVG** **O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.

## Why?

SVG files, especially exported from various editors, usually contains a lot of redundant and useless information such as editor metadata, comments, hidden elements and other stuff that can be safely removed without affecting SVG rendering result.

## What it can do

SVGO has a plugin-based architecture, so almost every optimization is a separate plugin.

Today we have:

* [ [>](svgo/blob/master/plugins/cleanupAttrs.js) ] cleanup attributes from newlines, trailing and repeating spaces
* [ [>](svgo/blob/master/plugins/removeDoctype.js) ] remove doctype declaration
* [ [>](svgo/blob/master/plugins/removeXMLProcInst.js) ] remove XML processing instructions
* [ [>](svgo/blob/master/plugins/removeComments.js) ] remove comments
* [ [>](svgo/blob/master/plugins/removeMetadata.js) ] remove metadata
* [ [>](svgo/blob/master/plugins/removeEditorsNSData.js) ] remove editors namespaces, elements and attributes
* [ [>](svgo/blob/master/plugins/removeEmptyAttrs.js) ] remove empty attributes
* [ [>](svgo/blob/master/plugins/removeDefaultPx.js) ] remove default "px" unit
* [ [>](svgo/blob/master/plugins/removeHiddenElems.js) ] remove a lot of hidden elements
* [ [>](svgo/blob/master/plugins/removeEmptyText.js) ] remove empty Text elements
* [ [>](svgo/blob/master/plugins/removeEmptyContainers.js) ] remove empty Container elements
* [ [>](svgo/blob/master/plugins/removeViewBox.js) ] remove viewBox attribute
* [ [>](svgo/blob/master/plugins/cleanupEnableBackground.js) ] remove or cleanup enable-background attribute
* [ [>](svgo/blob/master/plugins/cleanupSVGElem.js) ] cleanup SVG element from useless attributes
* [ [>](svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](svgo/blob/master/plugins/convertColors.js) ] convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)
* [ [>](svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](svgo/blob/master/plugins/collapseGroups.js) ] collapse groups

But it's not only about rude removing, SVG has a strict [specification](http://www.w3.org/TR/SVG/expanded-toc.html) with a lot of opportunities for optimizations, default values, geometry hacking and more.

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
  -c CONFIG, --config=CONFIG : Local config
  -d DISABLE, --disable=DISABLE : Disable plugin
  -e ENABLE, --enable=ENABLE : Enable plugin
  -i INPUT, --input=INPUT : Input file (default: stdin)
  -o OUTPUT, --output=OUTPUT : Output file (default: stdout)
  -p, --pretty : Make SVG pretty printed
  -t, --test : Make a visual comparison of two files (PhantomJS pre-required)
```

```
svgo -i test.svg -o test.min.svg
```
```
cat test.svg | svgo -d removeDoctype -d removeComment > test.min.svg
```

## TODO

1. documentation and "plugins how-to"
2. more plugins
3. more unit tests
4. online SVGO web service
5. …
