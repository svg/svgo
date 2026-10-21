import { describe, expect, it } from 'vitest';
import { optimize } from '../../lib/svgo.js';
import { findReferences } from '../../lib/svgo/tools.js';

describe('ARIA reference token boundaries', () => {
  const cases = [
    ['non-breaking space inside ID', 'a\u00a0b'],
    ['narrow non-breaking space inside ID', 'a\u202fb'],
    ['leading non-breaking space in ID', '\u00a0label'],
  ];

  it.each(cases)('keeps the reference token: %s', (_label, id) => {
    expect(findReferences('aria-labelledby', id)).toEqual([id]);
  });

  it.each(cases)('keeps the referenced target: %s', (_label, id) => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${id}"><text id="${id}">Label</text></svg>`;
    const output = optimize(input, {
      plugins: [{ name: 'cleanupIds', params: { minify: false } }],
    }).data;
    expect(output).toContain(`id="${id}"`);
    expect(output).toContain(`aria-labelledby="${id}"`);
  });

  it('keeps an external HTML ID as one token alongside a local ID', () => {
    expect(
      findReferences('aria-labelledby', 'external\u00a0id inside'),
    ).toEqual(['external\u00a0id', 'inside']);
  });

  it('does not rewrite the external token while minifying a local target', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="external\u00a0id inside"><text id="inside">Internal</text></svg>';
    const output = optimize(input, { plugins: ['cleanupIds'] }).data;
    expect(output).toContain('aria-labelledby="external\u00a0id a"');
    expect(output).toContain('id="a"');
  });
});
