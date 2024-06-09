const assert = require('assert');
const {
  VERSION,
  optimize,
  builtinPlugins,
  loadConfig,
} = require('../dist/svgo-node.cjs');
const PKG = require('../package.json');

const fixture = `<svg xmlns="http://www.w3.org/2000/svg">
    <g attr1="val1">
        <g attr2="val2">
            <path attr2="val3" d="..."/>
        </g>
        <path d="..."/>
    </g>
</svg>`;

const expected = `<svg xmlns="http://www.w3.org/2000/svg">
  <g attr1="val1">
    <g attr2="val2">
      <path attr2="val3" d="..."/>
    </g>
    <path d="..."/>
  </g>
</svg>
`;

const runTest = () => {
  const result = optimize(fixture, {
    plugins: [],
    js2svg: { pretty: true, indent: 2, eol: 'lf' },
  });
  const actual = result.data;

  assert.strictEqual(VERSION, PKG.version);
  assert.equal(actual, expected);
  assert.notEqual(builtinPlugins, undefined);
  assert.notEqual(loadConfig, undefined);
};

runTest();
