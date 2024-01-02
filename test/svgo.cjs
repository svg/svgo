const { optimize } = require('../dist/svgo-node.cjs');
const assert = require('assert');

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
    js2svg: { pretty: true, indent: 2 },
  });
  const actual = result.data;

  assert.equal(actual, expected);
};

runTest();
