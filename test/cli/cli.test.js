'use strict';

/**
 * @typedef {import('child_process').ChildProcessWithoutNullStreams} ChildProcessWithoutNullStreams
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * @type {(proc: ChildProcessWithoutNullStreams) => Promise<string>}
 */
const waitStdout = (proc) => {
  return new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      resolve(data.toString());
    });
  });
};

/**
 * @type {(proc: ChildProcessWithoutNullStreams) => Promise<void>}
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
    { cwd: __dirname }
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toMatch(/Currently available plugins:/);
});

test('accepts svg as input stream', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', '-'], {
    cwd: __dirname
  });
  proc.stdin.write('<svg><title>stdin</title></svg>');
  proc.stdin.end();
  const stdout = await waitStdout(proc);
  expect(stdout).toEqual('<svg/>');
});

test('accepts svg as string', async () => {
  const input = '<svg><title>string</title></svg>';
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', '--string', input],
    { cwd: __dirname }
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toEqual('<svg/>');
});

test('accepts svg as filename', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', 'output/single.svg'],
    { cwd: __dirname }
  );
  await waitClose(proc);
  const output = fs.readFileSync(
    path.join(__dirname, 'output/single.svg'),
    'utf-8'
  );
  expect(output).toEqual('<svg/>');
});

test('output as stream when "-" is specified', async () => {
  const proc = spawn(
    'node',
    ['../../bin/svgo', '--no-color', 'single.svg', '-o', '-'],
    { cwd: __dirname }
  );
  const stdout = await waitStdout(proc);
  expect(stdout).toEqual('<svg/>');
});

test('should exit with 1 code on syntax error', async () => {
  const proc = spawn('node', ['../../bin/svgo', '--no-color', 'invalid.svg'], {
    cwd: __dirname
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
    })
  ]);
  expect(code).toEqual(1);
  expect(stderr)
    .toEqual(`SvgoParserError: invalid.svg:2:27: Unquoted attribute value

  1 | <svg>
> 2 |   <rect x="0" y="0" width=10" height="20" />
    |                           ^
  3 | </svg>
  4 | 

`);
});
