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
  expect(
    optimize(svg, {
      plugins: ['preset-default'],
      js2svg: { pretty: true, indent: 2 },
    }).data
  ).toMatchInlineSnapshot(`
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
  expect(
    optimize(svg, {
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
    }).data
  ).toMatchInlineSnapshot(`
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

describe('allow to configure EOL', () => {
  test('should respect EOL set to LF', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    // using toEqual because line endings matter in these tests
    expect(
      optimize(svg, {
        js2svg: { eol: 'lf', pretty: true, indent: 2 },
      }).data
    ).toEqual(
      `<svg viewBox="0 0 120 120">\n  <circle fill="red" cx="60" cy="60" r="50"/>\n</svg>\n`
    );
  });

  test('should respect EOL set to CRLF', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    // using toEqual because line endings matter in these tests
    expect(
      optimize(svg, {
        js2svg: { eol: 'crlf', pretty: true, indent: 2 },
      }).data
    ).toEqual(
      `<svg viewBox="0 0 120 120">\r\n  <circle fill="red" cx="60" cy="60" r="50"/>\r\n</svg>\r\n`
    );
  });

  test('should respect EOL set to line break', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    // using toEqual because line endings matter in these tests
    expect(
      optimize(svg, {
        js2svg: { eol: '\r\n', pretty: true, indent: 2 },
      }).data
    ).toEqual(
      `<svg viewBox="0 0 120 120">\r\n  <circle fill="red" cx="60" cy="60" r="50"/>\r\n</svg>\r\n`
    );
  });
});

describe('allow to configure final newline', () => {
  test('should not add final newline when unset', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    expect(optimize(svg).data).toMatchInlineSnapshot(
      `"<svg viewBox=\\"0 0 120 120\\"><circle fill=\\"red\\" cx=\\"60\\" cy=\\"60\\" r=\\"50\\"/></svg>"`
    );
  });

  test('should add final newline when set', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    expect(
      optimize(svg, {
        js2svg: { finalNewline: true },
      }).data
    ).toMatchInlineSnapshot(`
      "<svg viewBox=\\"0 0 120 120\\"><circle fill=\\"red\\" cx=\\"60\\" cy=\\"60\\" r=\\"50\\"/></svg>
      "
    `);
  });

  test('should not add extra newlines when using pretty: true', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    expect(
      optimize(svg, {
        js2svg: { finalNewline: true, pretty: true, indent: 2 },
      }).data
    ).toMatchInlineSnapshot(`
      "<svg viewBox=\\"0 0 120 120\\">
        <circle fill=\\"red\\" cx=\\"60\\" cy=\\"60\\" r=\\"50\\"/>
      </svg>
      "
    `);
  });
});

test('allow to customize precision for preset', () => {
  const svg = `
    <svg viewBox="0 0 120 120">
      <circle fill="#ff0000" cx="60.444444" cy="60" r="50"/>
    </svg>
  `;
  expect(
    optimize(svg, {
      plugins: [
        {
          name: 'preset-default',
          params: {
            floatPrecision: 4,
          },
        },
      ],
      js2svg: { pretty: true, indent: 2 },
    }).data
  ).toMatchInlineSnapshot(`
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
  expect(
    optimize(svg, {
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
    }).data
  ).toMatchInlineSnapshot(`
    "<svg viewBox=\\"0 0 120 120\\">
      <circle fill=\\"red\\" cx=\\"60.44444\\" cy=\\"60\\" r=\\"50\\"/>
    </svg>
    "
  `);
});
