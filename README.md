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

* [ [>](//github.com/svg/svgo/blob/master/plugins/cleanupAttrs.js) ] cleanup attributes from newlines, trailing and repeating spaces
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeDoctype.js) ] remove doctype declaration
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeXMLProcInst.js) ] remove XML processing instructions
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeComments.js) ] remove comments
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeMetadata.js) ] remove metadata
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeEditorsNSData.js) ] remove editors namespaces, elements and attributes
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeEmptyAttrs.js) ] remove empty attributes
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeDefaultPx.js) ] remove default "px" unit
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeHiddenElems.js) ] remove a lot of hidden elements
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeEmptyText.js) ] remove empty Text elements
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeEmptyContainers.js) ] remove empty Container elements
* [ [>](//github.com/svg/svgo/blob/master/plugins/removeViewBox.js) ] remove viewBox attribute
* [ [>](//github.com/svg/svgo/blob/master/plugins/cleanupEnableBackground.js) ] remove or cleanup enable-background attribute
* [ [>](//github.com/svg/svgo/blob/master/plugins/cleanupSVGElem.js) ] cleanup SVG element from useless attributes
* [ [>](//github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) ] convert styles into attributes
* [ [>](//github.com/svg/svgo/blob/master/plugins/convertColors.js) ] convert colors (from rgb() to #rrggbb, from #rrggbb to #rgb)
* [ [>](//github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) ] move elements attributes to the existing group wrapper
* [ [>](//github.com/svg/svgo/blob/master/plugins/collapseGroups.js) ] collapse groups

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
```

```
svgo -i test.svg -o test.min.svg
```
```
cat test.svg | svgo -d removeDoctype -d removeComment > test.min.svg
```

## TODO

1. PhantomJS-based server-side SVG rendering for "before vs after visual tests"
2. documentation and "plugins how-to"
3. more plugins
4. more unit tests
5. online SVGO web service
6. …
