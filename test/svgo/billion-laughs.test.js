const { readFile } = require('node:fs/promises');
const path = require('path');
const { optimize } = require('../../lib/svgo.js');

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
