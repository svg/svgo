```
o-o o   o o--o o-o
 \   \ /  |  | | |
o-o   o   o--o o-o
             | 
          o--o
```

## SVGO

**SVG** **O**ptimizer is a Nodejs-based tool for optimizing SVG vector graphics files.

## Why?

SVG files, especially exported from various editors, usually contains a lot of redundant and useless information such as editor metadata, comments, hidden elements and other stuff that can be safely removed without affecting SVG rendering result.

## What it can do

SVGO has a plugin-based architecture, so almost every optimization is a separate plugin.

Today we have:

* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/cleanupAttrs.js) ] cleanup attributes from newlines, trailing and repeating spaces
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeDoctype.js) ] remove doctype declaration
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeXMLProcInst.js) ] remove XML processing instructions
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeComments.js) ] remove comments
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeMetadata.js) ] remove metadata
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeEditorsNSData.js) ] remove editors namespaces, elements and attributes
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeEmptyAttrs.js) ] remove empty attributes
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeDefaultPx.js) ] remove default "px" unit
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeHiddenElems.js) ] remove a lot of hidden elements
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeEmptyText.js) ] remove empty Text elements
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/removeEmptyContainers.js) ] remove empty Container elements
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/convertColors.js) ] convert colors
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](//github.com/deepsweet/svgo/blob/master/plugins/collapseGroups.js) ] collapse groups

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
```

```
svgo -i test.svg -o test.min.svg
```
```
cat test.svg | svgo -d removeDoctype -d removeComment > test.min.svg
```

## TODO
It's only the very first public alpha :)

1. documentation!
2. phantomjs-based server-side SVG rendering "before vs after" tests
3. more unit tests
4. more plugins
5. …