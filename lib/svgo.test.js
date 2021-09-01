'use strict';

const { optimize } = require('./svgo.js');

test('allow to setup default preset', () => {
  const svg = `
    <?xml version="1.0" encoding="utf-8"?>
    <svg viewBox="0 0 120 120">
      <desc>
        Not standard description
      </desc>
      <circle fill="#ff0000" cx="60" cy="60" r="50"/>
    </svg>
  `;
  const { data } = optimize(svg, {
    plugins: ['preset-default'],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<svg viewBox=\\"0 0 120 120\\">
      <circle fill=\\"red\\" cx=\\"60\\" cy=\\"60\\" r=\\"50\\"/>
    </svg>
    "
  `);
});

test('allow to disable and customize plugins in preset', () => {
  const svg = `
    <?xml version="1.0" encoding="utf-8"?>
    <svg viewBox="0 0 120 120">
      <desc>
        Not standard description
      </desc>
      <circle fill="#ff0000" cx="60" cy="60" r="50"/>
    </svg>
  `;
  const { data } = optimize(svg, {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeXMLProcInst: false,
            removeDesc: {
              removeAny: false,
            },
          },
        },
      },
    ],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<?xml version=\\"1.0\\" encoding=\\"utf-8\\"?>
    <svg viewBox=\\"0 0 120 120\\">
      <desc>
        Not standard description
      </desc>
      <circle fill=\\"red\\" cx=\\"60\\" cy=\\"60\\" r=\\"50\\"/>
    </svg>
    "
  `);
});

test('allow to customize precision for preset', () => {
  const svg = `
    <svg viewBox="0 0 120 120">
      <circle fill="#ff0000" cx="60.444444" cy="60" r="50"/>
    </svg>
  `;
  const { data } = optimize(svg, {
    plugins: [
      {
        name: 'preset-default',
        params: {
          floatPrecision: 4,
        },
      },
    ],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<svg viewBox=\\"0 0 120 120\\">
      <circle fill=\\"red\\" cx=\\"60.4444\\" cy=\\"60\\" r=\\"50\\"/>
    </svg>
    "
  `);
});

test('plugin precision should override preset precision', () => {
  const svg = `
    <svg viewBox="0 0 120 120">
      <circle fill="#ff0000" cx="60.444444" cy="60" r="50"/>
    </svg>
  `;
  const { data } = optimize(svg, {
    plugins: [
      {
        name: 'preset-default',
        params: {
          floatPrecision: 4,
          overrides: {
            cleanupNumericValues: {
              floatPrecision: 5,
            },
          },
        },
      },
    ],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<svg viewBox=\\"0 0 120 120\\">
      <circle fill=\\"red\\" cx=\\"60.44444\\" cy=\\"60\\" r=\\"50\\"/>
    </svg>
    "
  `);
});

test('provides informative error in result', () => {
  const svg = `<svg viewBox="0 0 120 120">
      <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
    </svg>
  `;
  const { modernError: error } = optimize(svg, { path: 'test.svg' });
  expect(error.name).toEqual('SvgoParserError');
  expect(error.message).toEqual('test.svg:2:33: Unquoted attribute value');
  expect(error.reason).toEqual('Unquoted attribute value');
  expect(error.line).toEqual(2);
  expect(error.column).toEqual(33);
  expect(error.source).toEqual(svg);
});

test('provides code snippet in rendered error', () => {
  const svg = `<svg viewBox="0 0 120 120">
  <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
</svg>
`;
  const { modernError: error } = optimize(svg, { path: 'test.svg' });
  expect(error.toString())
    .toEqual(`SvgoParserError: test.svg:2:29: Unquoted attribute value

  1 | <svg viewBox="0 0 120 120">
> 2 |   <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
    |                             ^
  3 | </svg>
  4 | 
`);
});

test('supports errors without path', () => {
  const svg = `<svg viewBox="0 0 120 120">
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle/>
  <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
</svg>
`;
  const { modernError: error } = optimize(svg);
  expect(error.toString())
    .toEqual(`SvgoParserError: <input>:11:29: Unquoted attribute value

   9 |   <circle/>
  10 |   <circle/>
> 11 |   <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
     |                             ^
  12 | </svg>
  13 | 
`);
});

test('slices long line in error code snippet', () => {
  const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 230 120">
  <path d="M318.198 551.135 530.33 918.56l-289.778-77.646 38.823-144.889c77.646-289.778 294.98-231.543 256.156-86.655s178.51 203.124 217.334 58.235q58.234-217.334 250.955 222.534t579.555 155.292z stroke-width="1.5" fill="red" stroke="red" />
</svg>
`;
  const { modernError: error } = optimize(svg);
  expect(error.toString())
    .toEqual(`SvgoParserError: <input>:2:211: Invalid attribute name

  1 | …-0.dtd" viewBox="0 0 230 120">
> 2 | …7.334 250.955 222.534t579.555 155.292z stroke-width="1.5" fill="red" strok…
    |                                                       ^
  3 |  
  4 |  
`);
});

test('provides legacy error message', () => {
  const svg = `<svg viewBox="0 0 120 120">
  <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
</svg>
`;
  const { error } = optimize(svg, { path: 'test.svg' });
  expect(error)
    .toEqual(`SvgoParserError: test.svg:2:29: Unquoted attribute value

  1 | <svg viewBox="0 0 120 120">
> 2 |   <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
    |                             ^
  3 | </svg>
  4 | 
`);
});
