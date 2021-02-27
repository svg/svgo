'use strict';

const { expect } = require('chai');
const { createContentItem } = require('../../lib/svgo.js');
const JSAPI = require('../../lib/svgo/jsAPI.js');

describe('svgo api', function () {
  it('should has createContentItem method', function () {
    expect(createContentItem).to.be.instanceOf(Function);
  });

  it('should be able to create content item', function () {
    var item = createContentItem({
      elem: 'elementName',
      prefix: 'prefixName',
      local: 'localName',
    });
    expect(item).to.be.instanceOf(JSAPI);
    expect(item).to.have.ownProperty('elem').equal('elementName');
    expect(item).to.have.ownProperty('prefix').equal('prefixName');
    expect(item).to.have.ownProperty('local').equal('localName');
  });

  it('should be able create content item without argument', function () {
    var item = createContentItem();
    expect(item).to.be.instanceOf(JSAPI);
    expect(item).to.be.empty;
  });
});
