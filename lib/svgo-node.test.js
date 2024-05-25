import os from 'os';
import path from 'path';
import { optimize, loadConfig } from './svgo-node.js';

const describeLF = os.EOL === '\r\n' ? describe.skip : describe;
const describeCRLF = os.EOL === '\r\n' ? describe : describe.skip;

describeLF('with LF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    expect(data).toBe(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>',
    );
  });

  test('should respect config', () => {
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
      js2svg: { pretty: true, indent: 2 },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="50" fill="red"/>\n</svg>\n',
    );
  });

  test('should respect line-ending config', () => {
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
});

describeCRLF('with CRLF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Created with love
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    expect(data).toBe(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>',
    );
  });

  test('should respect config', () => {
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
      js2svg: { pretty: true, indent: 2 },
    });
    expect(data).toBe(
      '<svg viewBox="0 0 120 120">\r\n  <circle cx="60" cy="60" r="50" fill="red"/>\r\n</svg>\r\n',
    );
  });

  test('should respect line-ending config', () => {
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
});

describe('loadConfig', () => {
  const cwd = process.cwd();
  const fixtures = path.join(cwd, './test/fixtures/config-loader');

  test('loads by absolute path', async () => {
    expect(
      await loadConfig(path.join(fixtures, 'one/two/config.js')),
    ).toStrictEqual({
      plugins: [],
    });
  });

  test('loads by relative path to cwd', async () => {
    const config = await loadConfig('one/two/config.js', fixtures);
    expect(config).toStrictEqual({ plugins: [] });
  });

  test('searches in cwd and up', async () => {
    expect(
      await loadConfig(null, path.join(fixtures, 'one/two')),
    ).toStrictEqual({
      plugins: [],
    });
    expect(
      await loadConfig(null, path.join(cwd, './test/fixtures/missing')),
    ).toBeNull();
    expect(await loadConfig(null, path.join(fixtures, 'mjs'))).toStrictEqual({
      plugins: ['mjs'],
    });
    expect(await loadConfig(null, path.join(fixtures, 'cjs'))).toStrictEqual({
      plugins: ['cjs'],
    });
  });

  test('fails when specified config does not exist', async () => {
    await expect(loadConfig('{}')).rejects.toThrow(/Cannot find module/);
  });

  test('fails when exported config not an object', async () => {
    await expect(
      loadConfig(path.join(fixtures, 'invalid-null.js')),
    ).rejects.toThrow(/Invalid config file/);
    await expect(
      loadConfig(path.join(fixtures, 'invalid-array.js')),
    ).rejects.toThrow(/Invalid config file/);
    await expect(
      loadConfig(path.join(fixtures, 'invalid-string.js')),
    ).rejects.toThrow(/Invalid config file/);
  });

  test('handles runtime errors properly', async () => {
    await expect(
      loadConfig(path.join(fixtures, 'invalid-runtime.js')),
    ).rejects.toThrow(/plugins is not defined/);
    await expect(
      loadConfig(path.join(fixtures, 'invalid-runtime.mjs')),
    ).rejects.toThrow(/plugins is not defined/);
  });

  test('handles MODULE_NOT_FOUND properly', async () => {
    await expect(
      loadConfig(path.join(fixtures, 'module-not-found.js')),
    ).rejects.toThrow(/Cannot find module 'unknown-module'/);
  });
});
