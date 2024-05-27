import fs from 'node:fs/promises';
import path from 'path';
import { EOL } from 'os';
import { fileURLToPath } from 'url';
import { VERSION, optimize } from '../../lib/svgo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const regEOL = new RegExp(EOL, 'g');

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n');
};

const parseFixture = async (file) => {
  const filepath = path.resolve(__dirname, file);
  const content = await fs.readFile(filepath, 'utf-8');
  return normalize(content).split(/\s*@@@\s*/);
};

describe('svgo', () => {
  it('version should match package.json', async () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const { version } = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
    expect(VERSION).toStrictEqual(version);
  });

  it('should create indent with 2 spaces', async () => {
    const [original, expected] = await parseFixture('test.svg.txt');
    const result = optimize(original, {
      plugins: [],
      js2svg: { pretty: true, indent: 2 },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg.txt');
    const result = optimize(original, { path: 'input.svg' });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { path: 'input.svg' });
    expect(result.data).toBe('<svg/>');
  });
  it('should preserve style specificity over attributes', async () => {
    const [original, expected] = await parseFixture(
      'style-specificity.svg.txt',
    );
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should inline entities', async () => {
    const [original, expected] = await parseFixture('entities.svg.txt');
    const result = optimize(original, {
      path: 'input.svg',
      plugins: [],
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should preserve whitespaces between tspan tags', async () => {
    const [original, expected] = await parseFixture('whitespaces.svg.txt');
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should preserve "to" keyframe selector', async () => {
    const [original, expected] = await parseFixture(
      'keyframe-selectors.svg.txt',
    );
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should not trim whitespace at start and end of pre element', async () => {
    const [original, expected] = await parseFixture('pre-element.svg.txt');
    const result = optimize(original, {
      path: 'input.svg',
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
  it('should not add whitespace in pre element', async () => {
    const [original, expected] = await parseFixture(
      'pre-element-pretty.svg.txt',
    );
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    });
    expect(normalize(result.data)).toStrictEqual(expected);
  });
});
