'use strict';

/**
 * @typedef {import('../lib/types').Plugin} Plugin
 */

const os = require('os');
const { optimize } = require('./svgo-node.js');

const describeLF = os.EOL === '\r\n' ? describe.skip : describe;
const describeCRLF = os.EOL === '\r\n' ? describe : describe.skip;

describeLF('with LF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120"><circle fill="red" cx="60" cy="60" r="50"/></svg>'
    );
  });

  test('should respect config', () => {
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
      js2svg: { pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\n  <circle fill="red" cx="60" cy="60" r="50"/>\n</svg>\n'
    );
  });

  test('should respect line-ending config', () => {
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
      js2svg: { eol: 'crlf', pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\r\n  <circle fill="red" cx="60" cy="60" r="50"/>\r\n</svg>\r\n'
    );
  });
});

describeCRLF('with CRLF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120"><circle fill="red" cx="60" cy="60" r="50"/></svg>'
    );
  });

  test('should respect config', () => {
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
      js2svg: { pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\r\n  <circle fill="red" cx="60" cy="60" r="50"/>\r\n</svg>\r\n'
    );
  });

  test('should respect line-ending config', () => {
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
      js2svg: { eol: 'lf', pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\n  <circle fill="red" cx="60" cy="60" r="50"/>\n</svg>\n'
    );
  });
});
