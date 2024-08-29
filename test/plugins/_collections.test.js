import { elems } from '../../plugins/_collections.js';

describe('elems.deprecated', () => {
  Object.entries(elems).forEach(([tagName, elemConfig]) => {
    const deprecated = elemConfig.deprecated;
    if (!deprecated) {
      return;
    }

    test(`${tagName} deprecated attributes are all known attributes`, () => {
      if (deprecated.safe) {
        deprecated.safe.forEach((attr) => {
          expect(elemConfig.attrs).toContain(attr);
        });
      }

      if (deprecated.unsafe) {
        deprecated.unsafe.forEach((attr) => {
          expect(elemConfig.attrs).toContain(attr);
        });
      }
    });
  });
});
