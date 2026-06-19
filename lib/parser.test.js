import { jest } from '@jest/globals';
import { parseSvg } from './parser.js';
import { stringifySvg } from './stringifier.js';

const input = `<svg xmlns="http://www.w3.org/2000/svg">
<text x="10" y="35" xml:space="preserve">
    <a href="x">
this is a test
    </a>
</text>
<text x="10" y="35" xml:space="preserve">
    <tspan>
this is a test
    </tspan>
</text>
</svg>`;

const expected = `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="35" xml:space="preserve">
    <a href="x">
this is a test
    </a>
</text><text x="10" y="35" xml:space="preserve">
    <tspan>
this is a test
    </tspan>
</text></svg>`;

test('a text preserved', () => {
  const parsed = parseSvg(input);
  const actual = stringifySvg(parsed, {});

  expect(actual).toBe(expected);
});

describe('maxEntityCount', () => {
  /**
   * Re-import parseSvg with a mocked sax that records the options it receives.
   *
   * @returns {Promise<{ parseSvg: typeof parseSvg, getOpt: () => any }>}
   */
  const importWithSaxSpy = async () => {
    /** @type {any} */
    let receivedOpt;
    jest.resetModules();
    jest.unstable_mockModule('sax', () => ({
      default: {
        /**
         * @param {boolean} _strict
         * @param {any} opt
         */
        parser: (_strict, opt) => {
          receivedOpt = opt;
          return {
            ENTITIES: {},
            write() {
              return this;
            },
            close() {
              return this;
            },
          };
        },
      },
    }));
    const mod = await import('./parser.js');
    return { parseSvg: mod.parseSvg, getOpt: () => receivedOpt };
  };

  afterEach(() => {
    jest.dontMock('sax');
    jest.resetModules();
  });

  test('forwards a provided maxEntityCount to the sax parser', async () => {
    const { parseSvg: parse, getOpt } = await importWithSaxSpy();
    parse('<svg xmlns="http://www.w3.org/2000/svg"/>', undefined, 1234);
    expect(getOpt().maxEntityCount).toBe(1234);
  });

  test('does not pass maxEntityCount when it is omitted', async () => {
    const { parseSvg: parse, getOpt } = await importWithSaxSpy();
    parse('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(getOpt().maxEntityCount).toBeUndefined();
  });
});
