
### [ [>](https://github.com/svg/svgo/tree/v0.3.7) ] 0.3.7 / 24.06.2013
* do not remove `result` attribute from filter primitives (fix [#122](https://github.com/svg/svgo/issues/122))
* plugins/cleanupAttrs: replace newline with space when needed (fix [#119](https://github.com/svg/svgo/issues/119))
* lib/coa: look for config file in current folder
* lib/coa: always traverse all files in the given folder
* deprecate svgo-grunt in favor of [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)
* re-enable node-coveralls

### [ [>](https://github.com/svg/svgo/tree/v0.3.6) ] 0.3.6 / 06.06.2013
* plugins/removeNonInheritableGroupAttrs: more attrs groups to exclude (fix [#116](https://github.com/svg/svgo/issues/116) & [#118](https://github.com/svg/svgo/issues/118))
* lib/coa: optimize folder file by file (temp fix [#114](https://github.com/svg/svgo/issues/114))
* `.jshintrc`: JSHint 2.0
* temporarily disable node-coveralls

### [ [>](https://github.com/svg/svgo/tree/v0.3.5) ] 0.3.5 / 07.05.2013
* plugins/transformsWithOnePath: fix curves bounding box calculation
* plugins/transformsWithOnePath: fix possible c+t or q+s bug


### [ [>](https://github.com/svg/svgo/tree/v0.3.4) ] 0.3.4 / 06.05.2013
* plugins/convertPathData: fix m->M bug in some cases
* plugins/transformsWithOnePath: fix last point calculation for C/S/Q/T
* plugins/mergePaths: add space delimiter between z and m

### [ [>](https://github.com/svg/svgo/tree/v0.3.3) ] 0.3.3 / 05.05.2013
* plugins/convertPathData: convert very first m to M, fix applyTransforms with translate() (fix [#112](https://github.com/svg/svgo/issues/112))
* plugins/transformsWithOnePath: fix real width/height rounding; fix scale transform origin; reorder transforms
* plugins/transformsWithOnePath: ability to set new width or height independently with auto rescaling

### [ [>](https://github.com/svg/svgo/tree/v0.3.2) ] 0.3.2 / 03.05.2013
* new plugin [plugins/sortAttrs](https://github.com/svg/svgo/blob/master/plugins/sortAttrs.js)
* plugins/transformsWithOnePath: buggy hcrop (fix [#111](https://github.com/svg/svgo/issues/111))
* Impossible to set output presision to 0 (no fractional part) (fix [#110](https://github.com/svg/svgo/issues/110))
* Istanbul + coveralls.io
* update README with NPM version from badge.fury.io
* update README with dependency status from gemnasium.com
* npmignore unneeded files
* reoptimized project logo

### [ [>](https://github.com/svg/svgo/tree/v0.3.1) ] 0.3.1 / 15.04.2013
* plugins/transformsWithOnePath: resize SVG and automatically rescale inner Path
* better errors handling

### [ [>](https://github.com/svg/svgo/tree/v0.3.0) ] 0.3.0 / 12.04.2013
* global refactoring: getting rid of the many dependencies
* new plugin [plugins/mergePaths](https://github.com/svg/svgo/blob/master/plugins/mergePaths.js)
* new plugin [plugins/transformsWithOnePath](https://github.com/svg/svgo/blob/master/plugins/transformsWithOnePath.js) (renamed and featured `cropAndCenterAlongPath`)
* config: replace default config with `full: true`
* coa: JSON string as value of `--config`
* coa: different types of Data URI strings (close [#105](https://github.com/svg/svgo/issues/105))
* plugins/_transforms: allow spaces at the beginning of transform
* Travis CI: Nodejs 0.10 & 0.11
* `node.extend` → `whet.extend`
* update `.gitignore`
* update docs

### [ [>](https://github.com/svg/svgo/tree/v0.2.4) ] 0.2.4 / 05.04.2013
* new plugin [plugins/cropAndCenterAlongPath](https://github.com/svg/svgo/blob/master/plugins/cropAndCenterAlongPath.js) for the [Fontello](https://github.com/fontello) project

### [ [>](https://github.com/svg/svgo/tree/v0.2.3) ] 0.2.3 / 22.02.2013
* new plugin [plugins/removeNonInheritableGroupAttrs](https://github.com/svg/svgo/blob/master/plugins/removeNonInheritableGroupAttrs.js) (fix [#101](https://github.com/svg/svgo/issues/101))
* new plugin [plugins/removeRasterImages](https://github.com/svg/svgo/blob/master/plugins/removeRasterImages.js) (close [#98](https://github.com/svg/svgo/issues/98))
* plugins/convertTransform: bug with trailing spaces in transform value string (fix [#103](https://github.com/svg/svgo/issues/103))

### [ [>](https://github.com/svg/svgo/tree/v0.2.2) ] 0.2.2 / 09.02.2013
* plugins/convertTransforms: wrong translate() shorthand (fix [#94](https://github.com/svg/svgo/issues/94))
* [yaml.js](https://github.com/jeremyfa/yaml.js) → [js-yaml](https://github.com/nodeca/js-yaml)
* update outdated deps

### [ [>](https://github.com/svg/svgo/tree/v0.2.1) ] 0.2.1 / 18.01.2013
* plugins/moveElemsAttrsToGroup + plugins/moveGroupAttrsToElems: move or just leave transform attr from Group to the inner Path Elems (close [#86](https://github.com/svg/svgo/issues/86))
* plugins/removeViewBox: doesn't catch floating-point numbers (fix [#88](https://github.com/svg/svgo/issues/88))
* plugins/cleanupEnableBackground: doesn't catch floating-point numbers (fix [#89](https://github.com/svg/svgo/issues/89))
* plugins/cleanupNumericValues: wrong floating-point numbers regexp (fix [#92](https://github.com/svg/svgo/issues/92))
* SVG file generated by fontcustom.com not properly compressed (fix [#90](https://github.com/svg/svgo/issues/90))
* `README.ru.md`: стилизация русского языка, улучшение языковых конструкций, правка ошибок (close [#91](https://github.com/svg/svgo/issues/91))
* minor JSHint warning fix

### [ [>](https://github.com/svg/svgo/tree/v0.2.0) ] 0.2.0 / 23.12.2012
* plugins/convertPathData: apply transforms to Path pata (close [#33](https://github.com/svg/svgo/issues/33))
* plugins/convertPathData: `-1.816-9.278.682-13.604` parsing error (fix [#85](https://github.com/svg/svgo/issues/85))
* plugins/convertTransform: `translate(10, 0)` eq `translate(10)`, but not `translate(10, 10)` eq `translate(10)` (fix [#83](https://github.com/svg/svgo/issues/83))
* run plugins/cleanupIDs before plugins/collapseGroups (fix [#84](https://github.com/svg/svgo/issues/84))
* update `.gitignore`

### [ [>](https://github.com/svg/svgo/tree/v0.1.9) ] 0.1.9 / 17.12.2012
* plugins/cleanupIDs: renamed from removeUnusedIDs; minify used IDs (fix [#7](https://github.com/svg/svgo/issues/7))
* lib/svgo/js2svg: restore HTML entities back (fix [#80](https://github.com/svg/svgo/issues/80) + [#81](https://github.com/svg/svgo/issues/81))
* plugins/removeDoctype: do not remove if custom XML entities presents (fix [#77](https://github.com/svg/svgo/issues/77))
* lib/svgo/coa: refactoring, colors and fix [#70](https://github.com/svg/svgo/issues/70)
* lib/svgo: store elapsed time in result object
* usage examples with SVGZ (close [#18](https://github.com/svg/svgo/issues/18))
* more optimized logo
* update `.gitignore`

### [ [>](https://github.com/svg/svgo/tree/v0.1.8) ] 0.1.8 / 11.12.2012
* new plugin [plugins/removeUselessStrokeAndFill](https://github.com/svg/svgo/blob/master/plugins/removeUselessStrokeAndFill.js) (close [#75](https://github.com/svg/svgo/issues/75))
* new plugin [plugins/removeUnusedIDs](https://github.com/svg/svgo/blob/master/plugins/removeUnusedIDs.js) (close [#76](https://github.com/svg/svgo/issues/76))
* plugins/convertPathData: wrong M interpretation in some cases (fix [#73](https://github.com/svg/svgo/issues/73))
* plugins/cleanupAttrs: use `isElem()` API
* `.travis.yml`: check all branches


### [ [>](https://github.com/svg/svgo/tree/v0.1.7) ] 0.1.7 / 08.12.2012
* plugins/convertPathData: incorrect interpretation of `z + m` (fix [#69](https://github.com/svg/svgo/issues/69))
* plugins/convertTransform: do a more accurate floating numbers rounding in `matrixToTransform()` (fix [#68](https://github.com/svg/svgo/issues/68))

### [ [>](https://github.com/svg/svgo/tree/v0.1.6) ] 0.1.6 / 07.12.2012
* plugins/convertPathData: collapse repeated instructions only after curveSmoothShorthands (fix [#64](https://github.com/svg/svgo/issues/64))
* lib/svgo/coa: handle 'there is nothing to optimize' case and display a message about it (fix [#61](https://github.com/svg/svgo/issues/61))
* plugins/cleanupSVGElem: delete as useless artefact


### [ [>](https://github.com/svg/svgo/tree/v0.1.5) ] 0.1.5 / 06.12.2012
* E-notated numbers in paths not recognised (fix [#63](https://github.com/svg/svgo/issues/63))
* update README with `svgo-grunt` and `svgo-osx-folder-action`
* fix `mocha-as-promised` plug in node 0.6

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
