'use strict';

const fs = require('fs'),
    yaml = require('js-yaml'),
    svgo = require(process.env.COVERAGE ?
        '../../lib-cov/svgo/coa.js' :
        '../../lib/svgo/coa.js').api,
    defaults = Object.assign({}, yaml.safeLoad(fs.readFileSync(__dirname + '/../../.svgo.yml', 'utf8'))),
    path = require('path'),
    svgPath = path.resolve(__dirname, 'test.svg'),
    svgFolderPath = path.resolve(__dirname, 'testSvg'),

    prefixIdsFolderPath = path.resolve(__dirname, 'testPrefixIds'),
    prefixIdsSvgInPath  = path.resolve(prefixIdsFolderPath, 'in.svg'),

    mpDirPath     = path.resolve(__dirname, 'testMultipass'),
    mpSvgInPath   = path.resolve(mpDirPath, 'in.svg'),
    mpSvgExpPath  = path.resolve(mpDirPath, 'out.svg'),
    mpSvgExp      = fs.readFileSync(mpSvgExpPath, 'utf8'),

    svgFolderPathRecursively = path.resolve(__dirname, 'testSvgRecursively'),
    svgFiles = [path.resolve(__dirname, 'testSvg/test.svg'), path.resolve(__dirname, 'testSvg/test.1.svg')],
    tempFolder = 'temp',
    fse = require('fs-extra'),
    checkIsDir = require('../../lib/svgo/tools.js').checkIsDir,
    noop = () => {};

describe('coa', function() {
    let output;

    beforeEach(function() {
        output = '';

        fse.emptyDirSync(tempFolder);
    });

    after(function() {
        fse.removeSync(tempFolder);
    });

    const initialConsoleLog = global.console.log;

    function replaceConsoleLog() {
        global.console.log = message => { output += message };
    }

    function restoreConsoleLog() {
        global.console.log = initialConsoleLog;
    }

    const initialConsoleError = global.console.error;
    const initialProcessExit = global.process.exit;

    function replaceConsoleError() {
        global.console.error = message => { output += message };
        global.process.exit = noop;
    }

    function restoreConsoleError() {
        global.console.error = initialConsoleError;
        global.process.exit = initialProcessExit;
    }

    function calcFolderSvgWeight(folderPath) {
        return fs.readdirSync(folderPath).reduce((initWeight, name) => (
            initWeight +
                (/.svg/.test(name) ? fs.statSync(path.join(folderPath, name)).size : 0) +
                (checkIsDir(path.join(folderPath, name)) ? calcFolderSvgWeight(path.join(folderPath, name)) : 0)
        ), 0);
    }

    it('should throw an error if "config" can not be parsed', function(done) {
        replaceConsoleError();

        svgo({ input: svgPath, config: '{' }).then(onComplete, onComplete);

        function onComplete() {
            restoreConsoleError();
            done(/Error: Couldn't parse config JSON/.test(output) ? null : 'Error was not thrown');
        }
    });

    it('should work properly with string input', function(done) {
        svgo({ string: fs.readFileSync(svgPath, 'utf8'), output: 'temp.svg', quiet: true }).then(function() {
            done();
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize folder', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        svgo({ folder: svgFolderPath, output: tempFolder, quiet: true }).then(function() {
            const optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(optimizedWeight > 0 && initWeight <= optimizedWeight ? null : 'Folder was not optimized');
        }, error => done(error));
    });

    it('should optimize folder recursively', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPathRecursively);

        svgo({ folder: svgFolderPathRecursively, output: tempFolder, quiet: true, recursive: true }).then(function() {
            const optimizedWeight = calcFolderSvgWeight(svgFolderPathRecursively);

            done(optimizedWeight > 0 && initWeight <= optimizedWeight ? null : 'Folder was not optimized');
        }, error => done(error));
    });

    it('should optimize file', function(done) {
        const initialFileLength = fs.readFileSync(path.resolve(__dirname, 'test.svg')).length;

        svgo({ input: svgPath, output: 'temp.svg', quiet: true }).then(function() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFileLength ? null : 'File was not optimized');
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize several files', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        svgo({ input: svgFiles, output: tempFolder, quiet: true }).then(function() {
            const optimizedWeight = calcFolderSvgWeight(tempFolder);

            done(optimizedWeight > 0 && optimizedWeight <= initWeight ? null : 'Files were not optimized');
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize file from process.stdin', function(done) {
        const initialFile = fs.readFileSync(path.resolve(__dirname, 'test.svg'));

        const stdin = require('mock-stdin').stdin();

        setTimeout(() => { stdin.send(initialFile, 'ascii').end(); }, 0);

        svgo({ input: '-', output: 'temp.svg', string: fs.readFileSync(svgPath, 'utf8'), quiet: true })
            .then(onComplete, onComplete);

        function onComplete() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFile.length ? null : 'Files were not optimized');
            fse.removeSync('temp.svg');
        }
    });

    it('should optimize folder, when it stated in input', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        svgo({ input: svgFolderPath, output: tempFolder, quiet: true }).then(function() {
            let optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(optimizedWeight <= initWeight ? null : 'Files were not optimized');
        }, error => done(error));
    });

    it('should throw error when stated in input folder does not exist', function(done) {
        replaceConsoleError();

        svgo({ input: svgFolderPath + 'temp', output: tempFolder }).then(onComplete, onComplete);

        function onComplete(err) {
            restoreConsoleError();
            done(/no such file or directory/.test(err) ? null : 'Error was not thrown');
        }
    });

    it('should pass the filename to the prefixIds plugin', function(done) {
        svgo({
            input:     prefixIdsSvgInPath,
            output:    'temp.svg',
            quiet:     true,
            multipass: false,
            disable: defaults.plugins, // disable all plugins except ...
            enable: [ 'prefixIds' ]    // ... prefixIds
        }).then(function() {
            const svgOut = fs.readFileSync('temp.svg', 'utf8');

            done(/in_svg__/.test(svgOut) ? null : "filename isn't passed to prefixIds plugin.");
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    describe('multipass', function() {
        it('should optimize using multiple passes with multipass enabled', function(done) {

            svgo({
                input:     mpSvgInPath,
                output:    'temp.svg',
                quiet:     true,
                multipass: true
            }).then(function() {
                const mpSvgOut = fs.readFileSync('temp.svg', 'utf8');

                done(mpSvgOut === mpSvgExp ? null : "Multipass wasn't properly used.");
                fse.removeSync('temp.svg');
            }, error => done(error));
        });

        it('should allow prefixId plugin to detect subsequent passes with multipass enabled', function(done) {
            svgo({
                input:     mpSvgInPath,
                output:    'temp.svg',
                quiet:     true,
                multipass: true,
                disable: defaults.plugins, // disable all plugins except ...
                enable: [ 'prefixIds' ]    // ... prefixIds
            }).then(function() {
                const mpSvgOut = fs.readFileSync('temp.svg', 'utf8');

                done(!/in_svg__in_svg__/.test(mpSvgOut) ? null : "prefixIds plugin doesn't detect subsequent passes with multipass enabled.");

                // https://github.com/svg/svgo/issues/659
                // https://github.com/svg/svgo/issues/1133
                fse.removeSync('temp.svg');
            }, error => done(error));
        });

        it('should allow addAttributesToSVGElement plugin to correctly handle subsequent passes with multipass enabled', function(done) {
            svgo({
                input:     mpSvgInPath,
                output:    'temp.svg',
                quiet:     true,
                multipass: true,
                config: `{
                    "plugins": [{ "addAttributesToSVGElement": {
                        "attribute": "aria-hidden='true'"
                    } }]
                }`
            }).then(function() {
                const mpSvgOut = fs.readFileSync('temp.svg', 'utf8');

                done(!/aria-hidden="true" aria-hidden='true'/.test(mpSvgOut) ? null : "addAttributesToSVGElement plugin doesn't correctly handle subsequent passes with multipass enabled.");

                // https://github.com/svg/svgo/issues/659
                // https://github.com/svg/svgo/issues/1133
                fse.removeSync('temp.svg');
            }, error => done(error));
        });
    });

    describe('stdout', function() {
        it('should show file content when no output set', function(done) {
            replaceConsoleLog();

            svgo({ string: fs.readFileSync(svgPath, 'utf8'), output: '-', datauri: 'unenc' }).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleLog();
                done(/www.w3.org\/2000\/svg/.test(output) ? null : 'File content was not shown');
            }
        });

        it('should show message when the folder is empty', function(done) {
            const emptyFolderPath = path.resolve(__dirname, 'testSvgEmpty');
            if (!fs.existsSync(emptyFolderPath)) {
                fs.mkdirSync(emptyFolderPath);
            }

            replaceConsoleError();

            svgo({ folder: emptyFolderPath, quiet: true }).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleError();
                done(/No SVG files/.test(output) ? null : 'Empty folder message was not shown');
            }
        });

        it('should show message when folder does not consists any svg files', function(done) {
            replaceConsoleError();

            svgo({ folder: path.resolve(__dirname, 'testFolderWithNoSvg'), quiet: true }).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleError();
                done(/No SVG files have been found/.test(output) ?
                    null :
                    'Error "No SVG files have been found" was not shown');
            }
        });
    });
});
