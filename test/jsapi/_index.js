'use strict';

const { expect } = require('chai');

var SVGO = require(process.env.COVERAGE ?
    '../../lib-cov/svgo.js' :
    '../../lib/svgo.js');

var JSAPI = require(process.env.COVERAGE ?
    '../../lib-cov/svgo/jsAPI.js' :
    '../../lib/svgo/jsAPI.js');

describe('svgo object', function() {

    it('should has createContentItem method', function() {
        var svgo = new SVGO();
        expect(svgo.createContentItem).to.be.instanceOf(Function);
    });

    it('should be able to create content item', function() {
        var svgo = new SVGO();
        var item = svgo.createContentItem({
            elem: 'elementName',
            prefix: 'prefixName',
            local: 'localName'
        });

        expect(item).to.be.instanceOf(JSAPI);
        expect(item).to.have.ownProperty('elem').equal('elementName');
        expect(item).to.have.ownProperty('prefix').equal('prefixName');
        expect(item).to.have.ownProperty('local').equal('localName');
    });

    it('should be able create content item without argument', function() {
        var svgo = new SVGO();
        var item = svgo.createContentItem();

        expect(item).to.be.instanceOf(JSAPI);
        expect(item).to.be.empty;
    });

    it('should have ES module interop default property', function() {
        expect(SVGO).to.equal(SVGO.default);
    });

});
