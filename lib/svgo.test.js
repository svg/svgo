import { jest } from '@jest/globals';
import { optimize } from './svgo.js';

test('allow to setup default preset', () => {
  const svg = `
    <?xml version="1.0" encoding="utf-8"?>
    <svg viewBox="0 0 120 120">
      <desc>
        Created with love
      </desc>
      <circle fill="#ff0000" cx="60" cy="60" r="50"/>
    </svg>
  `;
  const { data } = optimize(svg, {
    plugins: ['preset-default'],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<svg viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="red"/>
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
              removeAny: true,
            },
          },
        },
      },
    ],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(data).toMatchInlineSnapshot(`
    "<?xml version="1.0" encoding="utf-8"?>
    <svg viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="red"/>
    </svg>
    "
  `);
});

test('warn when user tries enable plugins in preset', () => {
  const svg = `
    <svg viewBox="0 0 120 120"></svg>
  `;
  const warn = jest.spyOn(console, 'warn');
  optimize(svg, {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupListOfValues: true,
          },
        },
      },
    ],
    js2svg: { pretty: true, indent: 2 },
  });
  expect(warn)
    .toBeCalledWith(`You are trying to configure cleanupListOfValues which is not part of preset-default.
Try to put it before or after, for example

plugins: [
  {
    name: 'preset-default',
  },
  'cleanupListOfValues'
]
`);
  warn.mockRestore();
});

describe('allow to configure EOL', () => {
  test('should respect EOL set to LF', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { eol: 'lf', pretty: true, indent: 2 },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="50" fill="red"/>\n</svg>\n',
    );
  });

  test('should respect EOL set to CRLF', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { eol: 'crlf', pretty: true, indent: 2 },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\r\n  <circle cx="60" cy="60" r="50" fill="red"/>\r\n</svg>\r\n',
    );
  });

  test('should default to LF line break for any other EOL values', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle cx="60" cy="60" fill="#ff0000" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { eol: 'invalid', pretty: true, indent: 2 },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="50" fill="red"/>\n</svg>\n',
    );
  });
});

describe('allow to configure final newline', () => {
  test('should not add final newline when unset', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle cx="60" cy="60" r="50" fill="#ff0000"/>
      </svg>
    `;
    const { data } = optimize(svg, { js2svg: { eol: 'lf' } });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>',
    );
  });

  test('should add final newline when set', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { finalNewline: true, eol: 'lf' },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>\n',
    );
  });

  test('should not add extra newlines when using pretty: true', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { finalNewline: true, pretty: true, indent: 2, eol: 'lf' },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="50" fill="red"/>\n</svg>\n',
    );
  });
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
    "<svg viewBox="0 0 120 120">
      <circle cx="60.4444" cy="60" r="50" fill="red"/>
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
    "<svg viewBox="0 0 120 120">
      <circle cx="60.44444" cy="60" r="50" fill="red"/>
    </svg>
    "
  `);
});

test('provides informative error in result', () => {
  expect.assertions(6);
  const svg = `<svg viewBox="0 0 120 120">
      <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
    </svg>
  `;
  try {
    optimize(svg, { path: 'test.svg' });
  } catch (error) {
    expect(error.name).toBe('SvgoParserError');
    expect(error.message).toBe('test.svg:2:33: Unquoted attribute value');
    expect(error.reason).toBe('Unquoted attribute value');
    expect(error.line).toBe(2);
    expect(error.column).toBe(33);
    expect(error.source).toBe(svg);
  }
});

test('provides code snippet in rendered error', () => {
  expect.assertions(1);
  const svg = `<svg viewBox="0 0 120 120">
  <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
</svg>
`;
  try {
    optimize(svg, { path: 'test.svg' });
  } catch (error) {
    expect(error.toString())
      .toBe(`SvgoParserError: test.svg:2:29: Unquoted attribute value

  1 | <svg viewBox="0 0 120 120">
> 2 |   <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
    |                             ^
  3 | </svg>
  4 | 
`);
  }
});

test('supports errors without path', () => {
  expect.assertions(1);
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
  try {
    optimize(svg);
  } catch (error) {
    expect(error.toString())
      .toBe(`SvgoParserError: <input>:11:29: Unquoted attribute value

   9 |   <circle/>
  10 |   <circle/>
> 11 |   <circle fill="#ff0000" cx=60.444444" cy="60" r="50"/>
     |                             ^
  12 | </svg>
  13 | 
`);
  }
});

test('slices long line in error code snippet', () => {
  expect.assertions(1);
  const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 230 120">
  <path d="M318.198 551.135 530.33 918.56l-289.778-77.646 38.823-144.889c77.646-289.778 294.98-231.543 256.156-86.655s178.51 203.124 217.334 58.235q58.234-217.334 250.955 222.534t579.555 155.292z stroke-width="1.5" fill="red" stroke="red" />
</svg>
`;
  try {
    optimize(svg);
  } catch (error) {
    expect(error.toString())
      .toBe(`SvgoParserError: <input>:2:211: Invalid attribute name

  1 | …-0.dtd" viewBox="0 0 230 120">
> 2 | …7.334 250.955 222.534t579.555 155.292z stroke-width="1.5" fill="red" strok…
    |                                                       ^
  3 |  
  4 |  
`);
  }
});

test('multipass option should trigger plugins multiple times', () => {
  const svg = `<svg id="abcdefghijklmnopqrstuvwxyz"></svg>`;
  const list = [];
  const testPlugin = {
    name: 'testPlugin',
    fn: (_root, _params, info) => {
      list.push(info.multipassCount);
      return {
        element: {
          enter: (node) => {
            node.attributes.id = node.attributes.id.slice(1);
          },
        },
      };
    },
  };
  const { data } = optimize(svg, { multipass: true, plugins: [testPlugin] });
  expect(list).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(data).toBe(`<svg id="klmnopqrstuvwxyz"/>`);
});

test('encode as datauri', () => {
  const input = `
    <svg xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(0.707 -0.707 0.707 0.707 255.03 111.21) scale(2)"/>
    </svg>
    `;
  const { data: dataSinglePass } = optimize(input, {
    datauri: 'enc',
    plugins: ['convertTransform'],
  });
  expect(dataSinglePass).toMatchInlineSnapshot(
    `"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20transform%3D%22rotate(-45%20261.757%20-252.243)scale(2)%22%2F%3E%3C%2Fsvg%3E"`,
  );
  const { data: dataMultiPass } = optimize(input, {
    multipass: true,
    datauri: 'enc',
    plugins: ['convertTransform'],
  });
  expect(dataMultiPass).toMatchInlineSnapshot(
    `"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20transform%3D%22rotate(-45%20261.757%20-252.243)scale(2)%22%2F%3E%3C%2Fsvg%3E"`,
  );
});
