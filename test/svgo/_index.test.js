'use strict';

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const { optimize } = require('../../lib/svgo.js');

const regEOL = new RegExp(EOL, 'g');

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n');
};

const parseFixture = async (file) => {
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
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg');
    const result = optimize(original, { path: 'input.svg' });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { path: 'input.svg' });
    expect(result.data).toEqual('<svg/>');
  });
  it('should preserve style specificity over attributes', async () => {
    const [original, expected] = await parseFixture('style-specificity.svg');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should inline entities', async () => {
    const [original, expected] = await parseFixture('entities.svg');
    const result = optimize(original, {
      path: 'input.svg',
      plugins: [],
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should preserve whitespaces between tspan tags', async () => {
    const [original, expected] = await parseFixture('whitespaces.svg');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should preserve "to" keyframe selector', async () => {
    const [original, expected] = await parseFixture('keyframe-selectors.svg');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should not trim whitespace at start and end of pre element', async () => {
    const [original, expected] = await parseFixture('pre-element.svg');
    const result = optimize(original, {
      path: 'input.svg',
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should not add whitespace in pre element', async () => {
    const [original, expected] = await parseFixture('pre-element-pretty.svg');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toEqual(expected);
  });
});
