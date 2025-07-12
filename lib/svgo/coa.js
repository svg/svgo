import fs from 'fs';
import path from 'path';
import colors from 'picocolors';
import { fileURLToPath } from 'url';
import { decodeSVGDatauri, encodeSVGDatauri } from './tools.js';
import { loadConfig, optimize } from '../svgo-node.js';
import { builtinPlugins } from '../builtin.js';
import { SvgoParserError } from '../parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '../../package.json');
const PKG = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'));

/**
 * Synchronously check if path is a directory. Tolerant to errors like ENOENT.
 *
 * @param {string} filePath
 */
export function checkIsDir(filePath) {
  try {
    return fs.lstatSync(filePath).isDirectory();
  } catch {
    return filePath.endsWith(path.sep);
  }
}

/**
 * @param {import('commander').Command} program
 */
export default function makeProgram(program) {
  program
    .name(PKG.name)
    .description(PKG.description)
    .version(PKG.version, '-v, --version')
    .argument('[INPUT...]', 'Alias to --input')
    .option('-i, --input <INPUT...>', 'Input files, "-" for STDIN')
    .option('-s, --string <STRING>', 'Input SVG data string')
    .option(
      '-f, --folder <FOLDER>',
      'Input folder, optimize and rewrite all *.svg files',
    )
    .option(
      '-o, --output <OUTPUT...>',
      'Output file or folder (by default the same as the input), "-" for STDOUT',
    )
    .option(
      '-p, --precision <INTEGER>',
      'Set number of digits in the fractional part, overrides plugins params',
    )
    .option(
      '--config <CONFIG>',
      'Custom config file, only .js, .mjs, and .cjs is supported',
    )
    .option(
      '--datauri <FORMAT>',
      'Output as Data URI string (base64), URI encoded (enc) or unencoded (unenc)',
    )
    .option(
      '--multipass',
      'Pass over SVGs multiple times to ensure all optimizations are applied',
    )
    .option('--pretty', 'Make SVG pretty printed')
    .option('--indent <INTEGER>', 'Indent number when pretty printing SVGs')
    .option(
      '--eol <EOL>',
      'Line break to use when outputting SVG: lf, crlf. If unspecified, uses platform default.',
    )
    .option('--final-newline', 'Ensure SVG ends with a line break')
    .option(
      '-r, --recursive',
      "Use with '--folder'. Optimizes *.svg files in folders recursively.",
    )
    .option(
      '--exclude <PATTERN...>',
      "Use with '--folder'. Exclude files matching regular expression pattern.",
    )
    .option(
      '-q, --quiet',
      'Only output error messages, not regular status messages',
    )
    .option('--show-plugins', 'Show available plugins and exit')
    // used by picocolors internally
    .option('--no-color', 'Output plain text without color')
    .action(action);
}

/**
 * @param {ReadonlyArray<string>} args
 * @param {any} opts
 * @param {import('commander').Command} command
 * @returns
 */
async function action(args, opts, command) {
  const input = opts.input || args;
  let output = opts.output;
  /** @type {any} */
  let config = {};

  if (opts.datauri != null) {
    if (
      opts.datauri !== 'base64' &&
      opts.datauri !== 'enc' &&
      opts.datauri !== 'unenc'
    ) {
      console.error(
        "error: option '--datauri' must have one of the following values: 'base64', 'enc' or 'unenc'",
      );
      process.exit(1);
    }
  }

  if (opts.indent != null) {
    const number = Number.parseInt(opts.indent, 10);
    if (Number.isNaN(number)) {
      console.error(
        "error: option '--indent' argument must be an integer number",
      );
      process.exit(1);
    } else {
      opts.indent = number;
    }
  }

  if (opts.eol != null && opts.eol !== 'lf' && opts.eol !== 'crlf') {
    console.error(
      "error: option '--eol' must have one of the following values: 'lf' or 'crlf'",
    );
    process.exit(1);
  }

  // --show-plugins
  if (opts.showPlugins) {
    showAvailablePlugins();
    return;
  }

  // w/o anything
  if (
    (input.length === 0 || input[0] === '-') &&
    !opts.string &&
    !opts.stdin &&
    !opts.folder &&
    process.stdin.isTTY === true
  ) {
    return command.help();
  }

  if (process?.versions?.node && PKG.engines.node) {
    // @ts-expect-error We control this and ensure it is never null.
    const nodeVersion = String(PKG.engines.node).match(/\d*(\.\d+)*/)[0];
    if (parseFloat(process.versions.node) < parseFloat(nodeVersion)) {
      throw Error(
        `${PKG.name} requires Node.js version ${nodeVersion} or higher.`,
      );
    }
  }

  // --config
  const loadedConfig = await loadConfig(opts.config);
  if (loadedConfig != null) {
    config = loadedConfig;
  }

  // --quiet
  if (opts.quiet) {
    config.quiet = opts.quiet;
  }

  // --recursive
  if (opts.recursive) {
    config.recursive = opts.recursive;
  }

  // --exclude
  config.exclude = opts.exclude
    ? opts.exclude.map((/** @type {string} */ pattern) => RegExp(pattern))
    : [];

  // --precision
  if (opts.precision != null) {
    const number = Number.parseInt(opts.precision, 10);
    if (Number.isNaN(number)) {
      console.error(
        "error: option '-p, --precision' argument must be an integer number",
      );
      process.exit(1);
    } else {
      config.floatPrecision = Math.min(Math.max(0, number), 20);
    }
  }

  // --multipass
  if (opts.multipass) {
    config.multipass = true;
  }

  // --pretty
  if (opts.pretty) {
    config.js2svg = config.js2svg || {};
    config.js2svg.pretty = true;
    if (opts.indent != null) {
      config.js2svg.indent = opts.indent;
    }
  }

  // --eol
  if (opts.eol) {
    config.js2svg = config.js2svg || {};
    config.js2svg.eol = opts.eol;
  }

  // --final-newline
  if (opts.finalNewline) {
    config.js2svg = config.js2svg || {};
    config.js2svg.finalNewline = true;
  }

  // --output
  if (output) {
    if (input.length && input[0] != '-') {
      if (output.length == 1 && checkIsDir(output[0])) {
        const dir = output[0];
        for (let i = 0; i < input.length; i++) {
          output[i] = checkIsDir(input[i])
            ? input[i]
            : path.resolve(dir, path.basename(input[i]));
        }
      } else if (output.length < input.length) {
        output = output.concat(input.slice(output.length));
      }
    }
  } else if (input.length) {
    output = input;
  } else if (opts.string) {
    output = '-';
  }

  if (opts.datauri) {
    config.datauri = opts.datauri;
  }

  // --folder
  if (opts.folder) {
    const outputFolder = (output && output[0]) || opts.folder;
    await optimizeFolder(config, opts.folder, outputFolder);
  }

  // --input
  if (input.length !== 0) {
    // STDIN
    if (input[0] === '-') {
      return new Promise((resolve, reject) => {
        let data = '';
        const file = output[0];

        process.stdin
          .on('data', (chunk) => (data += chunk))
          .once('end', () =>
            processSVGData(config, null, data, file).then(resolve, reject),
          );
      });
      // file
    } else {
      await Promise.all(
        input.map((/** @type {string} */ file, /** @type {number} */ n) =>
          optimizeFile(config, file, output[n]),
        ),
      );
    }

    // --string
  } else if (opts.string) {
    const data = decodeSVGDatauri(opts.string);

    return processSVGData(config, null, data, output[0]);
  }
}

/**
 * Optimize SVG files in a directory.
 *
 * @param {any} config options
 * @param {string} dir input directory
 * @param {string} output output directory
 * @return {Promise<any>}
 */
function optimizeFolder(config, dir, output) {
  if (!config.quiet) {
    console.log(`Processing directory '${dir}':\n`);
  }
  return fs.promises
    .readdir(dir)
    .then((files) => processDirectory(config, dir, files, output));
}

/**
 * Process given files, take only SVG.
 *
 * @param {any} config options
 * @param {string} dir input directory
 * @param {ReadonlyArray<string>} files list of file names in the directory
 * @param {string} output output directory
 * @return {Promise<any>}
 */
function processDirectory(config, dir, files, output) {
  // take only *.svg files, recursively if necessary
  const svgFilesDescriptions = getFilesDescriptions(config, dir, files, output);

  return svgFilesDescriptions.length
    ? Promise.all(
        svgFilesDescriptions.map((fileDescription) =>
          optimizeFile(
            config,
            fileDescription.inputPath,
            fileDescription.outputPath,
          ),
        ),
      )
    : Promise.reject(
        new Error(`No SVG files have been found in '${dir}' directory.`),
      );
}

/**
 * Get SVG files descriptions.
 *
 * @param {any} config options
 * @param {string} dir input directory
 * @param {ReadonlyArray<string>} files list of file names in the directory
 * @param {string} output output directory
 * @return {any[]}
 */
function getFilesDescriptions(config, dir, files, output) {
  const filesInThisFolder = files
    .filter(
      (name) =>
        name.slice(-4).toLowerCase() === '.svg' &&
        !config.exclude.some((/** @type {RegExp} */ regExclude) =>
          regExclude.test(name),
        ),
    )
    .map((name) => ({
      inputPath: path.resolve(dir, name),
      outputPath: path.resolve(output, name),
    }));

  if (!config.recursive) {
    return filesInThisFolder;
  }

  return filesInThisFolder.concat(
    files
      .filter((name) => checkIsDir(path.resolve(dir, name)))
      .map((subFolderName) => {
        const subFolderPath = path.resolve(dir, subFolderName);
        const subFolderFiles = fs.readdirSync(subFolderPath);
        const subFolderOutput = path.resolve(output, subFolderName);
        return getFilesDescriptions(
          config,
          subFolderPath,
          subFolderFiles,
          subFolderOutput,
        );
      })
      .reduce((a, b) => a.concat(b), []),
  );
}

/**
 * Read SVG file and pass to processing.
 *
 * @param {any} config options
 * @param {string} file
 * @param {string} output
 * @return {Promise<any>}
 */
function optimizeFile(config, file, output) {
  return fs.promises.readFile(file, 'utf8').then(
    (data) => processSVGData(config, { path: file }, data, output, file),
    (error) => checkOptimizeFileError(config, file, output, error),
  );
}

/**
 * Optimize SVG data.
 *
 * @param {any} config options
 * @param {?{ path: string }} info
 * @param {string} data SVG content to optimize
 * @param {string} output where to write optimized file
 * @param {any=} input input file name (being used if output is a directory)
 * @return {Promise<any>}
 */
function processSVGData(config, info, data, output, input) {
  const startTime = Date.now();
  const prevFileSize = Buffer.byteLength(data, 'utf8');

  let result;
  try {
    result = optimize(data, { ...config, ...info });
  } catch (error) {
    if (error instanceof SvgoParserError) {
      console.error(colors.red(error.toString()));
      process.exit(1);
    } else {
      throw error;
    }
  }
  if (config.datauri) {
    result.data = encodeSVGDatauri(result.data, config.datauri);
  }
  const resultFileSize = Buffer.byteLength(result.data, 'utf8');
  const processingTime = Date.now() - startTime;

  return writeOutput(input, output, result.data).then(
    function () {
      if (!config.quiet && output != '-') {
        if (input) {
          console.log(`\n${path.basename(input)}:`);
        }
        printTimeInfo(processingTime);
        printProfitInfo(prevFileSize, resultFileSize);
      }
    },
    (error) =>
      Promise.reject(
        new Error(
          error.code === 'ENOTDIR'
            ? `Error: output '${output}' is not a directory.`
            : error,
        ),
      ),
  );
}

/**
 * Write result of an optimization.
 *
 * @param {string} input
 * @param {string} output output file name. '-' for stdout
 * @param {string} data data to write
 * @return {Promise<void>}
 */
async function writeOutput(input, output, data) {
  if (output == '-') {
    process.stdout.write(data);
    return Promise.resolve();
  }

  await fs.promises.mkdir(path.dirname(output), { recursive: true });

  return fs.promises
    .writeFile(output, data, 'utf8')
    .catch((error) => checkWriteFileError(input, output, data, error));
}

/**
 * Write time taken to optimize.
 *
 * @param {number} time time in milliseconds.
 */
function printTimeInfo(time) {
  console.log(`Done in ${time} ms!`);
}

/**
 * Write optimizing stats in a human-readable format.
 *
 * @param {number} inBytes size before optimization.
 * @param {number} outBytes size after optimization.
 */
function printProfitInfo(inBytes, outBytes) {
  const profitPercent = 100 - (outBytes * 100) / inBytes;
  /** @type {[string, Function]} */
  const ui = profitPercent < 0 ? ['+', colors.red] : ['-', colors.green];

  console.log(
    Math.round((inBytes / 1024) * 1000) / 1000 + ' KiB',
    ui[0],
    ui[1](Math.abs(Math.round(profitPercent * 10) / 10) + '%'),
    '=',
    Math.round((outBytes / 1024) * 1000) / 1000 + ' KiB',
  );
}

/**
 * Check for errors, if it's a dir optimize the dir.
 *
 * @param {any} config
 * @param {string} input
 * @param {string} output
 * @param {Error & { code: string, path: string }} error
 * @return {Promise<void>}
 */
function checkOptimizeFileError(config, input, output, error) {
  if (error.code == 'EISDIR') {
    return optimizeFolder(config, input, output);
  } else if (error.code == 'ENOENT') {
    return Promise.reject(
      new Error(`Error: no such file or directory '${error.path}'.`),
    );
  }
  return Promise.reject(error);
}

/**
 * Check for saving file error. If the output is a dir, then write file there.
 *
 * @param {string} input
 * @param {string} output
 * @param {string} data
 * @param {Error & { code: string }} error
 * @return {Promise<void>}
 */
function checkWriteFileError(input, output, data, error) {
  if (error.code == 'EISDIR' && input) {
    return fs.promises.writeFile(
      path.resolve(output, path.basename(input)),
      data,
      'utf8',
    );
  } else {
    return Promise.reject(error);
  }
}

/** Show list of available plugins with short description. */
function showAvailablePlugins() {
  const list = builtinPlugins
    .map((plugin) => ` [ ${colors.green(plugin.name)} ] ${plugin.description}`)
    .join('\n');
  console.log('Currently available plugins:\n' + list);
}
