 // replace default config

module.exports = {

  // multipass: true,
  // full: true,

  /* plugins

   - name
  
   or:
   - name: false
   - name: true
  
   or:
   - name:
       param1: 1
       param2: 2
  */
  plugins : [
    "removeDoctype",
    "removeXMLProcInst",
    "removeComments",
    "removeMetadata",
    "removeXMLNS",
    "removeEditorsNSData",
    "cleanupAttrs",
    "minifyStyles",
    "convertStyleToAttrs",
    "cleanupIDs",
    "removeRasterImages",
    "removeUselessDefs",
    "cleanupNumericValues",
    "cleanupListOfValues",
    "convertColors",
    "removeUnknownsAndDefaults",
    "removeNonInheritableGroupAttrs",
    "removeUselessStrokeAndFill",
    "removeViewBox",
    "cleanupEnableBackground",
    "removeHiddenElems",
    "removeEmptyText",
    "convertShapeToPath",
    "moveElemsAttrsToGroup",
    "moveGroupAttrsToElems",
    "collapseGroups",
    "convertPathData",
    "convertTransform",
    "removeEmptyAttrs",
    "removeEmptyContainers",
    "mergePaths",
    "removeUnusedNS",
    "transformsWithOnePath",
    "sortAttrs",
    "removeTitle",
    "removeDesc",
    "removeDimensions",
    "removeAttrs",
    "removeElementsByAttr",
    "addClassesToSVGElement",
    "removeStyleElement",
    "addAttributesToSVGElement"
  ]

  // configure the indent (default 4 spaces) used by `--pretty` here:

  // @see https://github.com/svg/svgo/blob/master/lib/svgo/js2svg.js#L6 for more config options

  // js2svg:
  // pretty: true
  // indent: '  '
};