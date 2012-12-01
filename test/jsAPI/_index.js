'use strict';

var cover = process.argv[3] === 'mocha-istanbul',
    svg2js = require(cover ? '../../lib-cov/svgo/svg2js' : '../../lib/svgo/svg2js');

describe('jsAPI', function() {

    var svg = '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>',
        config = {
            strict: true,
            trim: true,
            normalize: true,
            lowercase: true,
            xmlns: true,
            position: false
        },
        result;

    before(function(done) {
        svg2js(svg, config).then(function(data) {
            result = data;
            done();
        });
    });

    describe('isElem()', function() {

        it('svg should have property "isElem" with instance of Function', function() {
            result.content[0].should.have.property('isElem').with.instanceOf(Function);
        });

        it('svg.sNode() should be true', function() {
            result.content[0].isElem().should.be.true;
        });

        it('svg.isElem("svg") should be true', function() {
            result.content[0].isElem('svg').should.be.true;
        });

        it('svg.isElem("trololo") should be false', function() {
            result.content[0].isElem('123').should.be.false;
        });

        it('svg.isElem(["svg", "trololo"]) should be true', function() {
            result.content[0].isElem(['svg', 'trololo']).should.be.true;
        });

    });

    describe('hasAttr()', function() {

        it('svg should have property "hasAttr" with instance of Function', function() {
            result.content[0].should.have.property('hasAttr').with.instanceOf(Function);
        });

        it('svg.hasAttr() should be true', function() {
            result.content[0].hasAttr().should.be.true;
        });

        it('svg.hasAttr("xmlns") should be true', function() {
            result.content[0].hasAttr('xmlns').should.be.true;
        });

        it('svg.hasAttr("xmlns", "http://www.w3.org/2000/svg") should be true', function() {
            result.content[0].hasAttr('xmlns', 'http://www.w3.org/2000/svg').should.be.true;
        });

        it('svg.hasAttr("xmlns", "trololo") should be false', function() {
            result.content[0].hasAttr('xmlns', 'trololo').should.be.false;
        });

        it('svg.hasAttr("trololo") should be false', function() {
            result.content[0].hasAttr('trololo').should.be.false;
        });

        it('svg.hasAttr("trololo", "ololo") should be false', function() {
            result.content[0].hasAttr('trololo', 'ololo').should.be.false;
        });

        it('svg.g.hasAttr() should be false', function() {
            result.content[0].content[0].hasAttr().should.be.false;
        });

        it('svg.g.hasAttr("trololo") should be false', function() {
            result.content[0].content[0].hasAttr('trololo').should.be.false;
        });

        it('svg.g.hasAttr("trololo", "ololo") should be false', function() {
            result.content[0].content[0].hasAttr('trololo', 'ololo').should.be.false;
        });

    });

    describe('isEmpty()', function() {

        it('svg should have property "isEmpty" with instance of Function', function() {
            result.content[0].should.have.property('isEmpty').with.instanceOf(Function);
        });

        it('svg.isEmpty() should be false', function() {
            result.content[0].isEmpty().should.be.false;
        });

        it('svg.g.isEmpty() should be true', function() {
            result.content[0].content[0].isEmpty().should.be.true;
        });

    });

});
