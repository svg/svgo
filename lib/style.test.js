'use strict';

const { expect } = require('chai');
const { computeStyle } = require('./style.js');
const svg2js = require('./svgo/svg2js.js');

describe('computeStyle', () => {
  it('collects styles', () => {
    const root = svg2js(`
      <svg>
        <rect id="class" class="a" />
        <rect id="two-classes" class="b a" />
        <rect id="attribute" fill="purple" />
        <rect id="inline-style" style="fill: grey;" />
        <g fill="yellow">
          <rect id="inheritance" />
          <g style="fill: blue;">
            <g>
              <rect id="nested-inheritance" />
            </g>
          </g>
        </g>
        <style>
          .a { fill: red; }
          .b { fill: green; stroke: black; }
        </style>
      </svg>
    `);
    expect(computeStyle(root.querySelector('#class'))).to.deep.equal({
      fill: { type: 'static', inherited: false, value: 'red' },
    });
    expect(computeStyle(root.querySelector('#two-classes'))).to.deep.equal({
      fill: { type: 'static', inherited: false, value: 'green' },
      stroke: { type: 'static', inherited: false, value: 'black' },
    });
    expect(computeStyle(root.querySelector('#attribute'))).to.deep.equal({
      fill: { type: 'static', inherited: false, value: 'purple' },
    });
    expect(computeStyle(root.querySelector('#inline-style'))).to.deep.equal({
      fill: { type: 'static', inherited: false, value: 'grey' },
    });
    expect(computeStyle(root.querySelector('#inheritance'))).to.deep.equal({
      fill: { type: 'static', inherited: true, value: 'yellow' },
    });
    expect(
      computeStyle(root.querySelector('#nested-inheritance'))
    ).to.deep.equal({
      fill: { type: 'static', inherited: true, value: 'blue' },
    });
  });

  it('prioritizes different kinds of styles', () => {});
  it('treats at-rules and pseudo-classes as unknown styles', () => {});
  it('considers <style> media attribute', () => {});
  it('ignores <style> with invalid type', () => {});
});
