'use strict';

const fs = require('fs'),
    svgo = require(process.env.COVERAGE ?
        '../../lib-cov/svgo/coa.js' :
        '../../lib/svgo/coa.js').api,
    path = require('path'),
    svgPath = path.resolve(__dirname, 'test.svg'),
    svgFolderPath = path.resolve(__dirname, 'testSvg'),
    fse = require('fs-extra');

describe('coa', function() {
    let output;

    beforeEach(function() {
        output = '';

        if (fs.existsSync('temp')) {
            fse.removeSync('temp');
        }

        fs.mkdirSync('temp');
    });

    after(function() {
        fse.removeSync('temp');
    });

    const initialConsoleLog = global.console.log;

    function replaceConsoleLog() {
        global.console.log = message => { output += message };
    }

    function restoreConsoleLog() {
        global.console.log = initialConsoleLog;
    }

    const initialConsoleError = global.console.error;

    function replaceConsoleError() {
        global.console.error = message => { output += message };
    }

    function restoreConsoleError() {
        global.console.error = initialConsoleError;
    }

    function calcFolderSvgWeight(folderPath) {
        return fs.readdirSync(folderPath).reduce((initWeight, fileName) => (
            initWeight + (/.svg/.test(fileName) ? fs.statSync(path.join(folderPath, fileName)).size : 0)
        ), 0);
    }

    it('should throw an error if "config" can not be parsed', function(done) {
        replaceConsoleError();

        svgo({ input: svgPath, config: '{' }).then(function() {
            restoreConsoleError();
            done(/Error: Couldn't parse config JSON/.test(output) ? null : 'Error was not thrown');
        });
    });

    it('should work properly with string input', function(done) {
        svgo({ string: fs.readFileSync(svgPath, 'utf8'), output: 'temp.svg' }).then(function() {
            done();
            fse.removeSync('temp.svg');
        });
    });

    it('should optimize folder', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        svgo({ folder: svgFolderPath }).then(function() {
            const optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(initWeight <= optimizedWeight ? null : 'Folder was not optimized');
        });
    });

    it('should optimize file', function(done) {
        const initialFileLength = fs.readFileSync(path.resolve(__dirname, 'test.svg')).length;

        svgo({ input: svgPath, output: 'temp.svg' }).then(function() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFileLength ? null : 'File was not optimized');
            fse.removeSync('temp.svg');
        });
    });

    it('should optimize many files', function(done) {
        const inputFiles = [1, 2, 3, 4, 5].map(function (i) {
            const dest = path.resolve('temp', `files${i}.svg`);
            fse.copySync(svgPath, dest);
            // Give it something to optimize
            fs.appendFileSync(dest, '\n\n\n\n');
            return dest;
        });
        const initialFileLength = fs.readFileSync(inputFiles[0]).length;

        svgo({
            'in-place': true,
            // With `--in-place`, the cli will receive the arguments and
            // re-arrange them.
        }, {
            input: inputFiles[0],
            output: inputFiles[1],
            rest: inputFiles.slice(2)
        }).then(function () {
            const notOptimized = inputFiles.filter(function (filename) {
                return fs.readFileSync(filename).length >= initialFileLength;
            });
            done(notOptimized.length === 0 ? null : `Files were not optimized: ${notOptimized.join(', ')}`);
        });
    });

    it('should optimize file from process.stdin', function(done) {
        const initialFile = fs.readFileSync(path.resolve(__dirname, 'test.svg'));

        const stdin = require('mock-stdin').stdin();

        setTimeout(() => { stdin.send(initialFile, 'ascii').end(); }, 0);

        svgo({ input: '-', output: 'temp.svg', string: fs.readFileSync(svgPath, 'utf8') }).then(function() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFile.length ? null : 'Files were not optimized');
            fse.removeSync('temp.svg');
        });
    });

    it('should optimize folder, when it stated in input', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        svgo({ input: svgFolderPath, output: 'temp' }).then(function() {
            let optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(initWeight <= optimizedWeight ? null : 'Files were not optimized');
        });
    });

    it('should throw error when stated in input folder does not exist', function(done) {
        svgo({ input: svgFolderPath + 'temp', output: 'temp' })
            .catch(err => done(/no such file or directory/.test(err) ? null : 'Error was not thrown'));
    });

    describe('stdout', function() {
        it('should show file content when no output set', function(done) {
            replaceConsoleLog();

            svgo({ string: fs.readFileSync(svgPath, 'utf8'), output: '-', datauri: 'unenc' }).then(function() {
                restoreConsoleLog();
                done(/www.w3.org\/2000\/svg/.test(output) ? null : 'File content was not shown');
            });
        });

        it('should show message when the folder is empty', function(done) {
            const emptyFolderPath = path.resolve(__dirname, 'testSvgEmpty');
            if (!fs.existsSync(emptyFolderPath)) {
                fs.mkdirSync(emptyFolderPath);
            }

            replaceConsoleLog();

            svgo({ folder: emptyFolderPath }).then(function() {
                restoreConsoleLog();
                done(/is empty/.test(output) ? null : 'Empty folder message was not shown');
            });
        });

        it('should show message when folder does not consists any svg files', function(done) {
            replaceConsoleLog();

            svgo({ folder: path.resolve(__dirname, 'testFolderWithNoSvg') }).then(function() {
                restoreConsoleLog();
                done(/No SVG files have been found/.test(output) ?
                    null :
                    'Error "No SVG files have been found" was not shown');
            });
        });

        it('should create output directory when it does not exist', function(done) {
            const initWeight = calcFolderSvgWeight(svgFolderPath);
            const outputFolder = path.resolve(__dirname, 'temp');

            replaceConsoleLog();

            if (fs.existsSync(outputFolder)) {
                fse.removeSync(outputFolder);
            }

            svgo({ folder: svgFolderPath, output: outputFolder }).then(function() {
                restoreConsoleLog();
                const optimizedWeight = calcFolderSvgWeight(outputFolder);
                done(initWeight <= optimizedWeight ? null : 'Files were not optimized');
                fse.remove(outputFolder);
            });
        });

        it('should show plugins', function(done) {
            replaceConsoleLog();

            svgo({ 'show-plugins': true }).then(function() {
                restoreConsoleLog();
                done(/Currently available plugins:/.test(output) ? null : 'List of plugins was not shown');
            });
        });
    });
});
