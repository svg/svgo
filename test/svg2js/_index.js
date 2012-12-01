'use strict';

var cover = process.argv[3] === 'mocha-istanbul',
    QFS = require('q-fs'),
    PATH = require('path'),
    svg2js = require(cover ? '../../lib-cov/svgo/svg2js' : '../../lib/svgo/svg2js');

describe('svg2js', function() {

    var path = PATH.resolve(__dirname, './test.svg'),
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
        QFS.read(path).then(function(svg) {
            svg2js(svg.toString(), config).then(function(data) {
                result = data;
                done();
            });
        });
    });

    describe('parser', function() {

        it('result should exist', function() {
            result.should.exist;
        });

        it('result should be an instance of Object', function() {
            result.content.should.be.an.instanceOf(Object);
        });

        it('result should have property "content" with instance of Array', function() {
            result.should.have.property('content').with.instanceOf(Array);
        });

        it('content should have length 4', function() {
            result.content.should.have.length(4);
        });

        it('content[0] should have property "processinginstruction" with instance of Object', function() {
            result.content[0].should.have.property('processinginstruction').with.instanceOf(Object);
        });

        it('processinginstruction should have property "name" with value "xml"', function() {
            result.content[0].processinginstruction.should.have.property('name', 'xml');
        });

        it('processinginstruction should have property "body" with value "version=\"1.0\" encoding=\"utf-8\""', function() {
            result.content[0].processinginstruction.should.have.property('body', 'version=\"1.0\" encoding=\"utf-8\"');
        });

        it('content[1] should have property "comment" with value "Generator: Adobe Illustrator…"', function() {
            result.content[1].should.have.property('comment', 'Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');
        });

        it('content[2] should have property "doctype" with value " svg PUBLIC…"', function() {
            result.content[2].should.have.property('doctype', ' svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"');
        });

        it('content[3] should have property "elem" with value "svg"', function() {
            result.content[3].should.have.property('elem', 'svg');
        });

        it('svg should have properties "prefix" and "local', function() {
            result.content[3].should.have.property('prefix');
            result.content[3].should.have.property('local');
        });

    });

    describe('attributes', function() {

        it('svg should have property "attrs" with instance of Object', function() {
            result.content[3].should.have.property('attrs').with.instanceOf(Object);
        });

        it('svg.attrs should have property "xmlns" with instance of Object', function() {
            result.content[3].attrs.should.have.property('xmlns').with.instanceOf(Object);
        });

        it('svg.attrs.xmlns should have properties "name", "value", "prefix", "local" and "uri"', function() {
            result.content[3].attrs.xmlns.should.have.property('name');
            result.content[3].attrs.xmlns.should.have.property('prefix');
            result.content[3].attrs.xmlns.should.have.property('local');
        });

        it('svg.attrs.xmlns.name shoud be equal "xmlns"', function() {
            result.content[3].attrs.xmlns.name.should.equal('xmlns');
        });

        it('svg.attrs.xmlns.value shoud be equal "http://www.w3.org/2000/svg"', function() {
            result.content[3].attrs.xmlns.value.should.equal('http://www.w3.org/2000/svg');
        });

        it('svg.attrs.xmlns.prefix shoud be equal "xmlns"', function() {
            result.content[3].attrs.xmlns.prefix.should.equal('xmlns');
        });

        it('svg.attrs.xmlns.local shoud be empty ""', function() {
            result.content[3].attrs.xmlns.local.should.be.empty;
        });

    });

    describe('content', function() {

        it('svg should have property "content" with instance of Array', function() {
            result.content[3].should.have.property('content').with.instanceOf(Array);
        });

        it('svg.content should have length 2', function() {
            result.content[3].content.should.have.length(2);
        });

    });

});
