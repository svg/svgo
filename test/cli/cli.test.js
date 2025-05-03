/**
 * @typedef {import('child_process').ChildProcessWithoutNullStreams} ChildProcessWithoutNullStreams
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {ChildProcessWithoutNullStreams} proc
 * @returns {Promise<string>}
 */
const waitStdout = (proc) => {
  return new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      resolve(data.toString());
    });
  });
};

/**
 * @param {ChildProcessWithoutNullStreams} proc
 * @returns {Promise<void>}
 */
const waitClose = (proc) => {
  return new Promise((resolve) => {
    proc.on('close', () => {
      resolve();
    });
  });
};

test('shows plugins when flag specified', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--show-plugins'],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toMatch(/Currently available plugins:/);
});

test('accepts svg as input stream', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', '-'], {
    cwd: __dirname,
  });
  proc.stdin.write('<svg><desc>Created with Love</desc></svg>');
  proc.stdin.end();
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('accepts svg as string', async () => {
  const input = '<svg><desc>Created with Love</desc></svg>';
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--string', input],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('accepts svg as filename', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', 'output/single.svg'],
    { cwd: __dirname },
  );
  await waitClose(proc);
  const output = await fs.readFile(
    path.join(__dirname, 'output/single.svg'),
    'utf-8',
  );
  expect(output).toBe('<svg/>');
});

test('output as stream when "-" is specified', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', '-'],
    { cwd: __dirname },
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toBe('<svg/>');
});

test('should exit with 1 code on syntax error', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', 'invalid.svg'], {
    cwd: __dirname,
  });
  const [code, stderr] = await Promise.all([
    new Promise((resolve) => {
      proc.on('close', (code) => {
        resolve(code);
      });
    }),
    new Promise((resolve) => {
      proc.stderr.on('data', (error) => {
        resolve(error.toString());
      });
    }),
  ]);
  expect(code).toBe(1);
  expect(stderr)
    .toBe(`SvgoParserError: invalid.svg:2:27: Unquoted attribute value

  1 | <svg>
> 2 |   <rect x="0" y="0" width=10" height="20" />
    |                           ^
  3 | </svg>
  4 | 

`);
});
