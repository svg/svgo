'use strict';

const fs = require('fs');
const path = require('path');
const del = require('del');
const { expect } = require('chai');
const { Command } = require('commander');
const svgo = require('../../lib/svgo/coa.js');

const svgPath = path.resolve(__dirname, 'test.svg');
const svgFolderPath = path.resolve(__dirname, 'testSvg');
const svgFolderPathRecursively = path.resolve(__dirname, 'testSvgRecursively');
const svgFiles = [
  path.resolve(__dirname, 'testSvg/test.svg'),
  path.resolve(__dirname, 'testSvg/test.1.svg'),
];
const tempFolder = 'temp';
const noop = () => {};

const { checkIsDir } = svgo;

function runProgram(args) {
  const program = new Command();
  svgo(program);
  // prevent running process.exit
  program.exitOverride(() => {});
  // parser skips first two arguments
  return program.parseAsync([0, 1, ...args]);
}

describe('coa', function () {
  let output;

  beforeEach(async () => {
    output = '';
    await del(tempFolder);
    await fs.promises.mkdir(tempFolder);
  });

  after(async () => {
    await del(tempFolder);
  });

  const initialConsoleLog = global.console.log;

  function replaceConsoleLog() {
    global.console.log = (message) => {
      output += message;
    };
  }

  function restoreConsoleLog() {
    global.console.log = initialConsoleLog;
  }

  const initialConsoleError = global.console.error;
  const initialProcessExit = global.process.exit;

  function replaceConsoleError() {
    global.console.error = (message) => {
      output += message;
    };
    global.process.exit = noop;
  }

  function restoreConsoleError() {
    global.console.error = initialConsoleError;
    global.process.exit = initialProcessExit;
  }

  function calcFolderSvgWeight(folderPath) {
    return fs
      .readdirSync(folderPath)
      .reduce(
        (initWeight, name) =>
          initWeight +
          (/.svg/.test(name)
            ? fs.statSync(path.join(folderPath, name)).size
            : 0) +
          (checkIsDir(path.join(folderPath, name))
            ? calcFolderSvgWeight(path.join(folderPath, name))
            : 0),
        0
      );
  }

  it('should work properly with string input', async () => {
    await runProgram([
      '--string',
      fs.readFileSync(svgPath, 'utf8'),
      '--output',
      'temp.svg',
      '--quiet',
    ]);
    await del('temp.svg');
  });

  it('should optimize folder', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath);
    await runProgram([
      '--folder',
      svgFolderPath,
      '--output',
      tempFolder,
      '--quiet',
    ]);
    const optimizedWeight = calcFolderSvgWeight(svgFolderPath);
    expect(optimizedWeight).gt(0);
    expect(initWeight).lte(optimizedWeight);
  });

  it('should optimize folder recursively', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPathRecursively);
    await runProgram([
      '--folder',
      svgFolderPathRecursively,
      '--output',
      tempFolder,
      '--quiet',
      '--recursive',
    ]);
    const optimizedWeight = calcFolderSvgWeight(svgFolderPathRecursively);
    expect(optimizedWeight).gt(0);
    expect(initWeight).lte(optimizedWeight);
  });

  it('should optimize file', async () => {
    const initialFileLength = fs.readFileSync(
      path.resolve(__dirname, 'test.svg')
    ).length;
    await runProgram(['--input', svgPath, '--output', 'temp.svg', '--quiet']);
    const optimizedFileLength = fs.readFileSync('temp.svg').length;
    expect(optimizedFileLength).lte(initialFileLength);
    await del('temp.svg');
  });

  it('should optimize several files', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath);
    await runProgram([
      '--input',
      ...svgFiles,
      '--output',
      tempFolder,
      '--quiet',
    ]);
    const optimizedWeight = calcFolderSvgWeight(tempFolder);
    expect(optimizedWeight).gt(0);
    expect(optimizedWeight).lte(initWeight);
    await del('temp.svg');
  });

  it('should optimize file from process.stdin', async () => {
    const initialFile = fs.readFileSync(path.resolve(__dirname, 'test.svg'));
    const stdin = require('mock-stdin').stdin();
    setTimeout(() => {
      stdin.send(initialFile, 'ascii').end();
    }, 1000);
    try {
      await runProgram([
        '--input',
        '-',
        '--output',
        'temp.svg',
        '--string',
        fs.readFileSync(svgPath, 'utf8'),
        '--quiet',
      ]);
    } finally {
      const optimizedFileLength = fs.readFileSync('temp.svg').length;
      expect(optimizedFileLength).lte(initialFile.length);
      await del('temp.svg');
    }
  });

  it('should optimize folder, when it stated in input', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath);
    await runProgram([
      '--input',
      svgFolderPath,
      '--output',
      tempFolder,
      '--quiet',
    ]);
    let optimizedWeight = calcFolderSvgWeight(svgFolderPath);
    expect(optimizedWeight).lte(initWeight);
  });

  it('should throw error when stated in input folder does not exist', async () => {
    replaceConsoleError();
    try {
      await runProgram([
        '--input',
        svgFolderPath + 'temp',
        '--output',
        tempFolder,
      ]);
    } catch (error) {
      restoreConsoleError();
      expect(error.message).to.match(/no such file or directory/);
    }
  });

  describe('stdout', () => {
    it('should show file content when no output set', async () => {
      replaceConsoleLog();
      try {
        await runProgram([
          '--string',
          fs.readFileSync(svgPath, 'utf8'),
          '--output',
          '-',
          '--datauri',
          'unenc',
        ]);
      } finally {
        restoreConsoleLog();
        expect(output).to.match(/www\.w3\.org\/2000\/svg/);
      }
    });

    it('should show message when the folder is empty', async () => {
      const emptyFolderPath = path.resolve(__dirname, 'testSvgEmpty');
      if (!fs.existsSync(emptyFolderPath)) {
        fs.mkdirSync(emptyFolderPath);
      }
      try {
        await runProgram(['--folder', emptyFolderPath, '--quiet']);
      } catch (error) {
        expect(error.message).to.match(/No SVG files/);
      }
    });

    it('should show message when folder does not consists any svg files', async () => {
      try {
        await runProgram([
          '--folder',
          path.resolve(__dirname, 'testFolderWithNoSvg'),
          '--quiet',
        ]);
      } catch (error) {
        expect(error.message).to.match(/No SVG files have been found/);
      }
    });

    it('should show plugins', async () => {
      replaceConsoleLog();
      try {
        await runProgram(['--show-plugins']);
      } finally {
        restoreConsoleLog();
        expect(output).to.match(/Currently available plugins:/);
      }
    });
  });
});
