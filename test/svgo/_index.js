'use strict';

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const { optimize, extendDefaultPlugins } = require('../../lib/svgo.js');

const regEOL = new RegExp(EOL, 'g');

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n');
};

const parseFixture = async file => {
  const filepath = path.resolve(__dirname, file);
  const content = await fs.promises.readFile(filepath, 'utf-8');
  return normalize(content).split(/\s*@@@\s*/);
};

describe('svgo', () => {
  it('should create indent with 2 spaces', async () => {
    const [original, expected] = await parseFixture('test.svg');
      const result = optimize(original, {
        plugins: [],
        js2svg: { pretty: true, indent: 2 },
      });
      expect(normalize(result.data)).to.equal(expected);
  });
  it('should run multiple times', async () => {
    const [original, expected] = await parseFixture('multipass.svg');
      const result = optimize(original, {
        multipass: true,
      });
      expect(normalize(result.data)).to.equal(expected);
  });
  it('should pass multipass count to plugins', async () => {
    const [original, expected] = await parseFixture('multipass-prefix-ids.svg');
      const result = optimize(original, {
        multipass: true,
        plugins: extendDefaultPlugins([
          {
            name: 'prefixIds',
          },
        ]),
      });
      expect(normalize(result.data)).to.equal(expected);
  });
});
