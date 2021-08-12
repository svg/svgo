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
  it('should run multiple times', async () => {
    const [original, expected] = await parseFixture('multipass.svg');
    const result = optimize(original, {
      multipass: true,
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should pass multipass count to plugins', async () => {
    const [original, expected] = await parseFixture('multipass-prefix-ids.svg');
    const result = optimize(original, {
      multipass: true,
      plugins: ['preset-default', 'prefixIds'],
    });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg');
    const result = optimize(original, { input: 'file', path: 'input.svg' });
    expect(normalize(result.data)).toEqual(expected);
  });
  it('should handle parse error', async () => {
    const fixture = await fs.promises.readFile(
      path.resolve(__dirname, 'invalid.svg')
    );
    const result = optimize(fixture, { input: 'file', path: 'input.svg' });
    expect(result.error).toMatch(/Error in parsing SVG/);
    expect(result.path).toEqual('input.svg');
  });
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { input: 'file', path: 'input.svg' });
    expect(result.data).toEqual('<svg/>');
  });
  it('should preserve style specifity over attributes', async () => {
    const [original, expected] = await parseFixture('style-specifity.svg');
    const result = optimize(original, {
      input: 'file',
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
});
