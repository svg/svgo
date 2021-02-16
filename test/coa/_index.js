'use strict';

const fs = require('fs'),
    { Command } = require('commander'),
    svgo = require('../../lib/svgo/coa.js'),
    path = require('path'),
    svgPath = path.resolve(__dirname, 'test.svg'),
    svgFolderPath = path.resolve(__dirname, 'testSvg'),
    svgFolderPathRecursively = path.resolve(__dirname, 'testSvgRecursively'),
    svgFiles = [path.resolve(__dirname, 'testSvg/test.svg'), path.resolve(__dirname, 'testSvg/test.1.svg')],
    tempFolder = 'temp',
    fse = require('fs-extra'),
    noop = () => {};

const { checkIsDir } = svgo;

function runProgram(args) {
  const program = new Command();
  svgo(program);
  // prevent running process.exit
  program.exitOverride(() => {});
  // parser skips first two arguments
  return program.parseAsync([0, 1, ...args]);
}

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

    it('should work properly with string input', function(done) {
        runProgram(['--string', fs.readFileSync(svgPath, 'utf8'), '--output', 'temp.svg', '--quiet']).then(function() {
            done();
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize folder', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        runProgram(['--folder', svgFolderPath, '--output', tempFolder, '--quiet']).then(function() {
            const optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(optimizedWeight > 0 && initWeight <= optimizedWeight ? null : 'Folder was not optimized');
        }, error => done(error));
    });

    it('should optimize folder recursively', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPathRecursively);

        runProgram(['--folder', svgFolderPathRecursively, '--output', tempFolder, '--quiet', '--recursive']).then(function() {
            const optimizedWeight = calcFolderSvgWeight(svgFolderPathRecursively);

            done(optimizedWeight > 0 && initWeight <= optimizedWeight ? null : 'Folder was not optimized');
        }, error => done(error));
    });

    it('should optimize file', function(done) {
        const initialFileLength = fs.readFileSync(path.resolve(__dirname, 'test.svg')).length;

        runProgram(['--input', svgPath, '--output', 'temp.svg', '--quiet']).then(function() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFileLength ? null : 'File was not optimized');
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize several files', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        runProgram(['--input', ...svgFiles, '--output', tempFolder, '--quiet']).then(function() {
            const optimizedWeight = calcFolderSvgWeight(tempFolder);

            done(optimizedWeight > 0 && optimizedWeight <= initWeight ? null : 'Files were not optimized');
            fse.removeSync('temp.svg');
        }, error => done(error));
    });

    it('should optimize file from process.stdin', function(done) {
        const initialFile = fs.readFileSync(path.resolve(__dirname, 'test.svg'));

        const stdin = require('mock-stdin').stdin();

        setTimeout(() => { stdin.send(initialFile, 'ascii').end(); }, 0);

        runProgram(['--input', '-', '--output', 'temp.svg', '--string', fs.readFileSync(svgPath, 'utf8'), '--quiet'])
            .then(onComplete, onComplete);

        function onComplete() {
            const optimizedFileLength = fs.readFileSync('temp.svg').length;

            done(optimizedFileLength <= initialFile.length ? null : 'Files were not optimized');
            fse.removeSync('temp.svg');
        }
    });

    it('should optimize folder, when it stated in input', function(done) {
        const initWeight = calcFolderSvgWeight(svgFolderPath);

        runProgram(['--input', svgFolderPath, '--output', tempFolder, '--quiet']).then(function() {
            let optimizedWeight = calcFolderSvgWeight(svgFolderPath);

            done(optimizedWeight <= initWeight ? null : 'Files were not optimized');
        }, error => done(error));
    });

    it('should throw error when stated in input folder does not exist', function(done) {
        replaceConsoleError();

        runProgram(['--input', svgFolderPath + 'temp', '--output', tempFolder]).then(onComplete, onComplete);

        function onComplete(err) {
            restoreConsoleError();
            done(/no such file or directory/.test(err) ? null : 'Error was not thrown');
        }
    });

    describe('stdout', function() {
        it('should show file content when no output set', function(done) {
            replaceConsoleLog();

            runProgram(['--string', fs.readFileSync(svgPath, 'utf8'), '--output', '-', '--datauri', 'unenc']).then(onComplete, onComplete);

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

            runProgram(['--folder', emptyFolderPath, '--quiet']).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleError();
                done(/No SVG files/.test(output) ? null : 'Empty folder message was not shown');
            }
        });

        it('should show message when folder does not consists any svg files', function(done) {
            replaceConsoleError();

            runProgram(['--folder', path.resolve(__dirname, 'testFolderWithNoSvg'), '--quiet']).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleError();
                done(/No SVG files have been found/.test(output) ?
                    null :
                    'Error "No SVG files have been found" was not shown');
            }
        });

        it('should show plugins', function(done) {
            replaceConsoleLog();

            runProgram(['--show-plugins']).then(onComplete, onComplete);

            function onComplete() {
                restoreConsoleLog();
                done(/Currently available plugins:/.test(output) ? null : 'List of plugins was not shown');
            }
        });
    });
});
