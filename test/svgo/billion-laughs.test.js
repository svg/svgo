import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimize } from '../../lib/svgo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('svgo', () => {
  it('should throw on excessive expansion depth', async () => {
    const original = await readFile(
      path.join(__dirname, 'billion-laughs.svg'),
      'utf-8',
    );

    expect(() => {
      optimize(original);
    }).toThrow('Parsed entity depth exceeds max entity depth');
  });

  it('should throw on excessive expansion count', async () => {
    const original = await readFile(
      path.join(__dirname, 'billion-laughs-flat.svg'),
      'utf-8',
    );

    expect(() => {
      optimize(original);
    }).toThrow('Parsed entity count exceeds max entity count');
  });
});
