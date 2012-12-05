### [ [>](https://github.com/svg/svgo/tree/v0.1.4) ] 0.1.4 / 05.12.2012
* plugins/_collections: more defaults
* `README.ru.md`
* `docs/how-it-works/ru.md`
* mocha + mocha-as-promised + chai + chai-as-promised + should + istanbul = <3
* update dependencies semvers in `package.json`
* `v0.1.x` and `v0.2.x` milestones

### [ [>](https://github.com/svg/svgo/tree/v0.1.3) ] 0.1.3 / 30.11.2012
* new plugin [plugins/cleanupNumericValues](https://github.com/svg/svgo/blob/master/plugins/cleanupNumericValues.js) (close [#8](https://github.com/svg/svgo/issues/8))
* plugins/removeDefaultPx functionality now included in plugins/removeUnknownsAndDefaults
* plugins/removeUnknownsAndDefaults: refactoring and picking up the complete elems+attrs collection (close [#59](https://github.com/svg/svgo/issues/59))
* plugins/convertTransform: error in matrices multiplication (fix [#58](https://github.com/svg/svgo/issues/58))
* plugins/convertTransform: mark translate() and scale() as useless only with one param (fix [#57](https://github.com/svg/svgo/issues/57))
* plugins/convertPathData: drastic speed improvement with huge Path data
* plugins/convertPathData: fix the very first Mm with multiple points (fix [#56](https://github.com/svg/svgo/issues/56))
* plugins/moveElemsAttrsToGroup: additional check for transform attr
* brand-new project `logo.svg`
* `.travis.yml`: build only master branch
* global `'use strict'`
* `.jshintignore`
* README and CHANGELOG: minor corrections

### [ [>](https://github.com/svg/svgo/tree/v0.1.2) ] 0.1.2 / 24.11.2012
* lib/svgo/svg2js: correct 'onerror' failure (fix [#51](https://github.com/svg/svgo/issues/51))
* config: disable sax-js position tracking by default (fix [#52](https://github.com/svg/svgo/issues/52))
* lib/svgo: rename 'startBytes' to 'inBytes' and 'endBytes' to 'outBytes' (close [#53](https://github.com/svg/svgo/issues/53))
* plugins/removeUnknownsAndDefaults: remove SVG id attr (close [#54](https://github.com/svg/svgo/issues/54))

### [ [>](https://github.com/svg/svgo/tree/v0.1.1) ] 0.1.1 / 23.11.2012
* plugins/moveElemsAttrsToGroup: fix inheitable only attrs array (fix [#47](https://github.com/svg/svgo/issues/47))
* plugins/removeEmptyContainers: do not remove an empty 'svg' element (fix [#48](https://github.com/svg/svgo/issues/48))
* plugins/removeDefaultPx: should also understand a floating-numbers too (fix [#49](https://github.com/svg/svgo/issues/49))
* plugins/removeUnknownsAndDefaults: merge multiple groupDefaults attrs (close [#50](https://github.com/svg/svgo/issues/50))

### [ [>](https://github.com/svg/svgo/tree/v0.1.0) ] 0.1.0 / 22.11.2012
* new plugin [plugins/removeUnknownsAndDefaults](https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js) (close [#6](https://github.com/svg/svgo/issues/6))
* plugins/convertPathData: convert straight curves into lines segments (close [#17](https://github.com/svg/svgo/issues/17)); remove an absolute coords conversions
* plugins/convertPathData: convert quadratic Bézier curveto into smooth shorthand (close [#31](https://github.com/svg/svgo/issues/31))
* plugins/convertPathData: convert curveto into smooth shorthand (close [#30](https://github.com/svg/svgo/issues/30))
* lib/svgo: global API refactoring (close [#37](https://github.com/svg/svgo/issues/37))
* lib/svgo: fatal and stupid error in stream chunks concatenation (fix [#40](https://github.com/svg/svgo/issues/40))
* lib/coa: batch folder optimization (close [#29](https://github.com/svg/svgo/issues/29))
* lib/coa: support arguments as aliases to `--input` and `--output` (close [#28](https://github.com/svg/svgo/issues/28))
* project logo by [Egor Bolhshakov](http://xizzzy.ru/)
* move modules to `./lib/svgo/`
* rename and convert `config.json` to `.svgo.yml`
* add [./docs/](https://github.com/svg/svgo/tree/master/docs)
* plugins/convertPathData: don't remove first `M` even if it's `0,0`
* plugins/convertPathData: stronger defense from infinite loop
* plugins/moveElemsAttrsToGroup: should affect only inheritable attributes (fix [#46](https://github.com/svg/svgo/issues/46))* 
* plugins/removeComments: ignore comments which starts with '!' (close [#43](https://github.com/svg/svgo/issues/43))
* config: `cleanupAttrs` should be before `convertStyleToAttrs` (fix [#44](https://github.com/svg/svgo/issues/44))* 
* lib/svgo/jsAPI: add `eachAttr()` optional context param
* temporarily remove PhantomJS and `--test` (close [#38](https://github.com/svg/svgo/issues/38))
* q@0.8.10 compatibility: 'end is deprecated, use done instead' fix
* add [Istanbul](https://github.com/gotwarlost/istanbul) code coverage
* update dependencies versions and gitignore
* README: add TODO section with versions milestones
* update README with License section
* update LICENSE with russian translation
* `.editorconfig`: 2 spaces for YAML

### [ [>](https://github.com/svg/svgo/tree/v0.0.9) ] 0.0.9 / 29.10.2012
* [plugins how-to](https://github.com/svg/svgo/tree/master/plugins#readme) (close [#27](https://github.com/svg/svgo/issues/27))
* allow any plugin of any type to go in any order (close [#14](https://github.com/svg/svgo/issues/14))
* allow to do a multiple optimizations with one init (close [#25](https://github.com/svg/svgo/issues/25))
* plugins/convertPathData: global refactoring
* plugins/convertPathData: do all the tricks with absolute coords too (fix [#22](https://github.com/svg/svgo/issues/22))
* plugins/convertPathData: accumulation of rounding errors (fix [#23](https://github.com/svg/svgo/issues/23))
* plugins/convertPathData: prevent an infinity loop on invalid path data (fix [#26](https://github.com/svg/svgo/issues/26))
* plugins/convertPathData: do not remove very first M from the path data (fix [#24](https://github.com/svg/svgo/issues/24))
* plugins/convertPathData: optimize path data in &lt;glyph&gt; and &lt;missing-glyph&gt; (close [#20](https://github.com/svg/svgo/issues/20))
* plugins/convertTransform: add patternTransform attribute to the process (close [#15](https://github.com/svg/svgo/issues/15))
* plugins/convertTransform: Firefox: removing extra space in front of negative number is alowed only in path data, but not in transform (fix [#12](https://github.com/svg/svgo/issues/12))
* plugins/removeXMLProcInst: remove only 'xml' but not 'xml-stylesheet' (fix [#21](https://github.com/svg/svgo/issues/15))
* plugins/collapseGroups: merge split-level transforms (fix [#13](https://github.com/svg/svgo/issues/13))
* jsdoc corrections

### [ [>](https://github.com/svg/svgo/tree/v0.0.8) ] 0.0.8 / 20.10.2012
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

### [ [>](https://github.com/svg/svgo/tree/v0.0.7) ] 0.0.7 / 14.10.2012
* new plugin [convertPathData](plugins/convertPathData.js)
* --input data now can be a Data URI base64 string
* --output data now can be a Data URI base64 string with --datauri flag
* Travis CI
* JSHint corrections + .jshintrc
* [.editorconfig](http://editorconfig.org/)
* display time spent on optimization
* .svgo → config.json
* lib/phantom_wrapper.js → lib/phantom.js

### [ [>](https://github.com/svg/svgo/tree/v0.0.6) ] 0.0.6 / 04.10.2012
* add --test option to make a visual comparison of two files (PhantomJS pre-required)
* update README and CHANGELOG with the correct relative urls

### [ [>](https://github.com/svg/svgo/tree/v0.0.5) ] 0.0.5 / 03.10.2012
* every plugin now has [at least one test](plugins)
* removeViewBox, cleanupEnableBackground, removeEditorsNSData, convertStyleToAttrs and collapseGroups plugins fixes
* new --pretty option for the pretty printed SVG
* lib/config refactoring

### [ [>](https://github.com/svg/svgo/tree/v0.0.4) ] 0.0.4 / 30.09.2012
* new plugin [removeViewBox](plugins/removeViewBox.js)
* new plugin [cleanupEnableBackground](plugins/cleanupEnableBackground.js)
* display useful info after successful optimization
* 'npm test' with 'spec' mocha output by default

### [ [>](https://github.com/svg/svgo/tree/v0.0.3) ] 0.0.3 / 29.09.2012
* plugins/collapseGroups bugfix
* plugins/moveElemsAttrsToGroup bugfix
* svgo now display --help if running w/o arguments
* massive jsdoc updates
* plugins engine main filter function optimization

### [ [>](https://github.com/svg/svgo/tree/v0.0.2) ] 0.0.2 / 28.09.2012
* add --disable and --enable command line options
* add an empty values rejecting to coa.js
* update README

### [ [>](https://github.com/svg/svgo/tree/v0.0.1) ] 0.0.1 / 27.09.2012
* initial public version
