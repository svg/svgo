'use strict';

const { createContentItem } = require('../../lib/svgo.js');
const JSAPI = require('../../lib/svgo/jsAPI.js');

describe('svgo api', function () {
  it('should has createContentItem method', function () {
    expect(createContentItem).toBeInstanceOf(Function);
  });

  it('should be able to create content item', function () {
    var item = createContentItem({
      elem: 'elementName',
    });
    expect(item).toBeInstanceOf(JSAPI);
    expect(item.elem).toEqual('elementName');
  });

  it('should be able create content item without argument', function () {
    var item = createContentItem();
    expect(item).toBeInstanceOf(JSAPI);
    expect(item).toEqual({});
  });
});
