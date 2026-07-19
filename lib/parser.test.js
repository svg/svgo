import { jest } from '@jest/globals';
import SAX from 'sax';
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
  // sax mutates the options object it receives (it stamps a default
  // `maxEntityCount`), so snapshot the options at call time, before sax runs.
  /** @type {any} */
  let receivedOpt;

  beforeEach(() => {
    jest.spyOn(SAX, 'parser').mockImplementation((_strict, opt) => {
      receivedOpt = { ...opt };
      // Minimal stub: parseSvg only assigns handlers then calls write().close().
      return /** @type {any} */ ({
        ENTITIES: {},
        write() {
          return this;
        },
        close() {
          return this;
        },
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    receivedOpt = undefined;
  });

  test('forwards a provided maxEntityCount to the parser options', () => {
    parseSvg('<svg xmlns="http://www.w3.org/2000/svg"/>', undefined, 1234);
    expect(receivedOpt.maxEntityCount).toBe(1234);
  });

  test('does not set maxEntityCount when it is omitted', () => {
    parseSvg('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(receivedOpt.maxEntityCount).toBeUndefined();
  });
});
