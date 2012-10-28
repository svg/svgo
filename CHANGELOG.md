### [ [>](//github.com/svg/svgo/tree/v0.0.9) ] 0.0.9 / 29.10.2012
* [plugins how-to](https://github.com/svg/svgo/tree/master/plugins#readme) (close [#27](https://github.com/svg/svgo/issues/27))
* allow any plugin of any type to go in any order (close [#14](https://github.com/svg/svgo/issues/14))
* allow to do a multiple optimizations with one init (close [#25](https://github.com/svg/svgo/issues/25))
* plugins/convertPathData: global refactoring
* plugins/convertPathData: do all the tricks with absolute coords too (fix [#22](https://github.com/svg/svgo/issues/22))
* plugins/convertPathData: accumulation of rounding errors (fix [#23](https://github.com/svg/svgo/issues/23))
* plugins/convertPathData: prevent an infinity loop on invalid path data (fix [#26](https://github.com/svg/svgo/issues/26))
* plugins/convertPathData: do not remove very first M from the path data (fix [#24](https://github.com/svg/svgo/issues/24))
* plugins/convertPathData: optimize path data in <glyph> and <missing-glyph> (close [#20](https://github.com/svg/svgo/issues/20))
* plugins/convertTransform: add patternTransform attribute to the process (close [#15](https://github.com/svg/svgo/issues/15))
* plugins/convertTransform: Firefox: removing extra space in front of negative number is alowed only in path data, but not in transform (fix [#12](https://github.com/svg/svgo/issues/12))
* plugins/removeXMLProcInst: remove only 'xml' but not 'xml-stylesheet' (fix [#21](https://github.com/svg/svgo/issues/15))
* plugins/collapseGroups: merge split-level transforms (fix [#13](https://github.com/svg/svgo/issues/13))
* jsdoc corrections

### [ [>](//github.com/svg/svgo/tree/v0.0.8) ] 0.0.8 / 20.10.2012
* new plugin [convertTransform](plugins/convertTransform.js) (close [#5](https://github.com/svg/svgo/issues/5))
* new plugin [removeUnusedNS](plugins/removeUnusedNS.js)
* plugins/convertPathData: remove useless segments
* plugins/convertPathData: a lot of refactoring
* plugins/convertPathData: round numbers before conditions because of exponential notation (fix [#3](https://github.com/svg/svgo/issues/3))
* plugins/moveElemsAttrsToGroup: merge split-level transforms instead of replacing (fix [#10](https://github.com/svg/svgo/issues/10))
* lib/svg2js: catch and output xml parser errors (fix [#4](https://github.com/svg/svgo/issues/4))
* lib/coa: open file for writing only when we are ready (fix [#2](https://github.com/svg/svgo/issues/2))
* lib/tools: node.extend module
* lib/plugins: refactoring
* lib/js2svg: refactoring
* lib/jsAPI: simplification and refactoring
* absolute urls in README
* update .editorconfig
* update .travis.yml with nodejs 0.9

### [ [>](//github.com/svg/svgo/tree/v0.0.7) ] 0.0.7 / 14.10.2012
* new plugin [convertPathData](plugins/convertPathData.js)
* --input data now can be a Data URI base64 string
* --output data now can be a Data URI base64 string with --datauri flag
* Travis CI
* JSHint corrections + .jshintrc
* [.editorconfig](http://editorconfig.org/)
* display time spent on optimization
* .svgo → config.json
* lib/phantom_wrapper.js → lib/phantom.js

### [ [>](//github.com/svg/svgo/tree/v0.0.6) ] 0.0.6 / 04.10.2012
* add --test option to make a visual comparison of two files (PhantomJS pre-required)
* update README and CHANGELOG with the correct relative urls

### [ [>](//github.com/svg/svgo/tree/v0.0.5) ] 0.0.5 / 03.10.2012
* every plugin now has [at least one test](plugins)
* removeViewBox, cleanupEnableBackground, removeEditorsNSData, convertStyleToAttrs and collapseGroups plugins fixes
* new --pretty option for the pretty printed SVG
* lib/config refactoring

### [ [>](//github.com/svg/svgo/tree/v0.0.4) ] 0.0.4 / 30.09.2012
* new plugin [removeViewBox](plugins/removeViewBox.js)
* new plugin [cleanupEnableBackground](plugins/cleanupEnableBackground.js)
* display useful info after successful optimization
* 'npm test' with 'spec' mocha output by default

### [ [>](//github.com/svg/svgo/tree/v0.0.3) ] 0.0.3 / 29.09.2012
* plugins/collapseGroups bugfix
* plugins/moveElemsAttrsToGroup bugfix
* svgo now display --help if running w/o arguments
* massive jsdoc updates
* plugins engine main filter function optimization

### [ [>](//github.com/svg/svgo/tree/v0.0.2) ] 0.0.2 / 28.09.2012
* add --disable and --enable command line options
* add an empty values rejecting to coa.js
* update README

### [ [>](//github.com/svg/svgo/tree/v0.0.1) ] 0.0.1 / 27.09.2012
* initial public version
