import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import svgo, { checkIsDir } from '../../lib/svgo/coa.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgFolderPath = path.resolve(__dirname, 'testSvg');
const svgFolderPathRecursively = path.resolve(__dirname, 'testSvgRecursively');
const svgFiles = [
  path.resolve(__dirname, 'testSvg/test.svg'),
  path.resolve(__dirname, 'testSvg/test.1.svg'),
];
const tempFolder = 'temp';

/**
 * @param {string[]} args
 * @returns {Promise<Command>}
 */
function runProgram(args) {
  const program = new Command();
  svgo(program);
  // prevent running process.exit
  program.exitOverride(() => {});
  // parser skips first two arguments
  return program.parseAsync(['', '', ...args]);
}

describe('coa', function () {
  beforeEach(async () => {
    await fs.promises.rm(tempFolder, { force: true, recursive: true });
    await fs.promises.mkdir(tempFolder);
  });

  afterAll(async () => {
    await fs.promises.rm(tempFolder, { force: true, recursive: true });
  });

  /**
   * @param {string} folderPath
   * @returns {number}
   */
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
        0,
      );
  }

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
    expect(optimizedWeight).toBeGreaterThan(0);
    expect(initWeight).toBeLessThanOrEqual(optimizedWeight);
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
    expect(optimizedWeight).toBeGreaterThan(0);
    expect(initWeight).toBeLessThanOrEqual(optimizedWeight);
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
    expect(optimizedWeight).toBeGreaterThan(0);
    expect(optimizedWeight).toBeLessThanOrEqual(initWeight);
    await fs.promises.rm('temp.svg', { force: true });
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
    expect(optimizedWeight).toBeLessThanOrEqual(initWeight);
  });

  it('should throw error when stated in input folder does not exist', async () => {
    await expect(
      runProgram(['--input', svgFolderPath + 'temp', '--output', tempFolder]),
    ).rejects.toThrow(/no such file or directory/);
  });

  describe('stdout', () => {
    it('should show message when the folder is empty', async () => {
      const emptyFolderPath = path.resolve(__dirname, 'testSvgEmpty');
      if (!fs.existsSync(emptyFolderPath)) {
        fs.mkdirSync(emptyFolderPath);
      }
      await expect(
        runProgram(['--folder', emptyFolderPath, '--quiet']),
      ).rejects.toThrow(/No SVG files/);
    });

    it('should show message when folder does not consists any svg files', async () => {
      await expect(
        runProgram([
          '--folder',
          path.resolve(__dirname, 'testFolderWithNoSvg'),
          '--quiet',
        ]),
      ).rejects.toThrow(/No SVG files have been found/);
    });
  });
});
