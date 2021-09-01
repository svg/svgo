'use strict';

const { spawn } = require('child_process');

test('should exit with 1 code on syntax error', async () => {
  const proc = spawn('node', ['../../bin/svgo', 'invalid.svg'], {
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
  expect(code).toEqual(1);
  expect(stderr).toMatchInlineSnapshot(`
"SvgoParserError: invalid.svg:2:27: Unquoted attribute value

  1 | <svg>
> 2 |   <rect x=\\"0\\" y=\\"0\\" width=10\\" height=\\"20\\" />
    |                           ^
  3 | </svg>
  4 | 

"
`);
});
