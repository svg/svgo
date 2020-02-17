'use strict';

const { expect } = require('chai');

var FS = require('fs'),
    PATH = require('path'),
    JSAPI = require('../../lib/svgo/jsAPI'),
    CSSClassList = require('../../lib/svgo/css-class-list'),
    CSSStyleDeclaration = require('../../lib/svgo/css-style-declaration'),
    SVG2JS = require('../../lib/svgo/svg2js');

describe('svg2js', function() {

    describe('working svg', function() {

        var filepath = PATH.resolve(__dirname, './test.svg'),
            root;

        before(function(done) {

            FS.readFile(filepath, 'utf8', function(err, data) {
                if (err) {
                    throw err;
                }

                root = SVG2JS(data)
                done();
            });

        });

        describe('root', function() {

            it('should exist', function() {
                expect(root).to.exist;
            });

            it('should be an instance of Object', function() {
                expect(root).to.be.an.instanceOf(Object);
            });

            it('should have property "content"', function() {
                expect(root).to.have.property('content');
            });

        });

        describe('root.content', function() {

            it('should be an instance of Array', function() {
                expect(root.content).to.be.an.instanceOf(Array);
            });

            it('should have length 4', function() {
                expect(root.content).to.have.lengthOf(4);
            });

        });

        describe('root.content[0].processinginstruction', function() {

            it('should exist', function() {
                expect(root.content[0].processinginstruction).to.exist;
            });

            it('should be an instance of Object', function() {
                expect(root.content[0].processinginstruction).to.be.an.instanceOf(Object);
            });

            it('should have property "name" with value "xml"', function() {
                expect(root.content[0].processinginstruction).to.have.property('name', 'xml');
            });

            it('should have property "body" with value `version="1.0" encoding="utf-8"`', function() {
                expect(root.content[0].processinginstruction).to.have.property('body', 'version="1.0" encoding="utf-8"');
            });

        });

        describe('root.content[1].comment', function() {

            it('should exist', function() {
                expect(root.content[1].comment).to.exist;
            });

            it('should equal "Generator: Adobe Illustrator…"', function() {
                expect(root.content[1].comment).to.equal('Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');
            });

        });

        describe('root.content[2].doctype', function() {

            it('should exist', function() {
                expect(root.content[2].doctype).to.exist;
            });

            it('should eventually equal " svg PUBLIC…"', function() {
                expect(root.content[2].doctype).to.equal(' svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"');
            });

        });

        describe('elem', function() {

            it('should have property elem: "svg"', function() {
                expect(root.content[3]).to.have.property('elem', 'svg');
            });

            it('should have property prefix: ""', function() {
                expect(root.content[3]).to.have.property('prefix', '');
            });

            it('should have property local: "svg"', function() {
                expect(root.content[3]).to.have.property('local', 'svg');
            });

        });

        describe('attributes', function() {

            describe('root.content[3].attrs', function() {

                it('should exist', function() {
                    expect(root.content[3].attrs).to.exist;
                });

                it('should be an instance of Object', function() {
                    expect(root.content[3].attrs).to.be.an.instanceOf(Object);
                });

            });

            describe('root.content[3].attrs.version', function() {

                it('should exist', function() {
                    expect(root.content[3].attrs.version).to.exist;
                });

                it('should be an instance of Object', function() {
                    expect(root.content[3].attrs.version).to.be.an.instanceOf(Object);
                });

                it('should have property name: "version"', function() {
                    expect(root.content[3].attrs.version).to.have.property('name', 'version');
                });

                it('should have property value: "1.1"', function() {
                    expect(root.content[3].attrs.version).to.have.property('value', '1.1');
                });

                it('should have property prefix: ""', function() {
                    expect(root.content[3].attrs.version).to.have.property('prefix', '');
                });

                it('should have property local: "version"', function() {
                    expect(root.content[3].attrs.version).to.have.property('local', 'version');
                });

            });

        });

        describe('content', function() {

            it('should exist', function() {
                expect(root.content[3].content).to.exist;
            });

            it('should be an instance of Array', function() {
                expect(root.content[3].content).to.be.an.instanceOf(Array);
            });

            it('should eventually have length 3', function() {
                expect(root.content[3].content).to.have.lengthOf(3);
            });

        });

        describe('text nodes', function() {

            it('should contain preserved whitespace', function() {
                const textNode = root.content[3].content[1].content[0].content[1];
                return expect(textNode.content[0].text).to.equal('  test  ');
            });

        });

        describe('API', function() {

            describe('clone()', function() {

                it('svg should have property "clone"', function() {
                    expect(root.content[3]).to.have.property('clone');
                });

                it('svg.clone() should be an instance of JSAPI', function() {
                    expect(root.content[3].clone()).to.be.instanceOf(JSAPI);
                });

                it('root.content[3].content[0].clone() has a valid style property', function() {
                    expect(root.content[3].content[0].clone().style).to.be.instanceof(CSSStyleDeclaration);
                });

                it('root.content[3].content[2].clone() has a valid class property', function() {
                    expect(root.content[3].content[2].clone().class).to.be.instanceof(CSSClassList);
                });

            });

            describe('isElem()', function() {

                it('svg should have property "isElem"', function() {
                    expect(root.content[3]).to.have.property('isElem');
                });

                it('svg.isElem() should be true', function() {
                    expect(root.content[3].isElem()).to.be.true;
                });

                it('svg.isElem("svg") should be true', function() {
                    expect(root.content[3].isElem('svg')).to.be.true;
                });

                it('svg.isElem("trololo") should be false', function() {
                    expect(root.content[3].isElem('trololo')).to.be.false;
                });

                it('svg.isElem(["svg", "trololo"]) should be true', function() {
                    expect(root.content[3].isElem(['svg', 'trololo'])).to.be.true;
                });

            });

            describe('isEmpty()', function() {

                it('svg should have property "isEmpty"', function() {
                    expect(root.content[3]).to.have.property('isEmpty');
                });

                it('svg.isEmpty() should be false', function() {
                    expect(root.content[3].isEmpty()).to.be.false;
                });

                it('svg.content[0].content[0].isEmpty() should be true', function() {
                    expect(root.content[3].content[0].content[0].isEmpty()).to.be.true;
                });

            });

            describe('hasAttr()', function() {

                it('svg should have property "hasAttr"', function() {
                    expect(root.content[3]).to.have.property('hasAttr');
                });

                it('svg.hasAttr() should be true', function() {
                    expect(root.content[3].hasAttr()).to.be.true;
                });

                it('svg.hasAttr("xmlns") should be true', function() {
                    expect(root.content[3].hasAttr('xmlns')).to.be.true;
                });

                it('svg.hasAttr("xmlns", "http://www.w3.org/2000/svg") should be true', function() {
                    expect(root.content[3].hasAttr('xmlns', 'http://www.w3.org/2000/svg')).to.be.true;
                });

                it('svg.hasAttr("xmlns", "trololo") should be false', function() {
                    expect(root.content[3].hasAttr('xmlns', 'trololo')).to.be.false;
                });

                it('svg.hasAttr("trololo") should be false', function() {
                    expect(root.content[3].hasAttr('trololo')).to.be.false;
                });

                it('svg.content[1].hasAttr() should be false', function() {
                    expect(root.content[3].content[1].hasAttr()).to.be.false;
                });

            });

            describe('attr()', function() {

                it('svg should have property "attr"', function() {
                    expect(root.content[3]).to.have.property('attr');
                });

                it('svg.attr("xmlns") should be an instance of Object', function() {
                    expect(root.content[3].attr('xmlns')).to.be.an.instanceOf(Object);
                });

                it('svg.attr("xmlns", "http://www.w3.org/2000/svg") should be an instance of Object', function() {
                    expect(root.content[3].attr('xmlns', 'http://www.w3.org/2000/svg')).to.be.an.instanceOf(Object);
                });

                it('svg.attr("xmlns", "trololo") should be an undefined', function() {
                    expect(root.content[3].attr('xmlns', 'trololo')).to.not.exist;
                });

                it('svg.attr("trololo") should be an undefined', function() {
                    expect(root.content[3].attr('trololo')).to.not.exist;
                });

                it('svg.attr() should be undefined', function() {
                    expect(root.content[3].attr()).to.not.exist;
                });

            });

            describe('removeAttr()', function() {

                it('svg should have property "removeAttr"', function() {
                    expect(root.content[3]).to.have.property('removeAttr');
                });

                it('svg.removeAttr("width") should be true', function() {
                    expect(root.content[3].removeAttr('width')).to.be.true;

                    expect(root.content[3].hasAttr('width')).to.be.false;
                });

                it('svg.removeAttr("height", "120px") should be true', function() {
                    expect(root.content[3].removeAttr('height', '120px')).to.be.true;

                    expect(root.content[3].hasAttr('height')).to.be.false;
                });

                it('svg.removeAttr("x", "1px") should be false', function() {
                    expect(root.content[3].removeAttr('x', '1px')).to.be.false;

                    expect(root.content[3].hasAttr('x')).to.be.true;
                });

                it('svg.removeAttr("z") should be false', function() {
                    expect(root.content[3].removeAttr('z')).to.be.false;
                });

                it('svg.removeAttr() should be false', function() {
                    expect(root.content[3].removeAttr()).to.be.false;
                });

            });

            describe('addAttr()', function() {

                var attr = {
                    name: 'test',
                    value: 3,
                    prefix: '',
                    local: 'test'
                };

                it('svg should have property "addAttr"', function() {
                    expect(root.content[3]).to.have.property('addAttr');
                });

                it('svg.addAttr(attr) should be an instance of Object', function() {
                    expect(root.content[3].addAttr(attr)).to.be.an.instanceOf(Object);
                });

                it('svg.content[1].content[0].addAttr(attr) should be an instance of Object', function() {
                    expect(root.content[3].content[1].content[0].addAttr(attr)).to.be.an.instanceOf(Object);
                });

                it('svg.addAttr({ name: "trololo" }) should be false', function() {
                    expect(root.content[3].addAttr({ name: 'trololo' })).to.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3 }) should be false', function() {
                    expect(root.content[3].addAttr({ name: 'trololo', value: 3 })).to.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3, prefix: "" }) should be false', function() {
                    expect(root.content[3].addAttr({ name: 'trololo', value: 3, prefix: '' })).to.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3, local: "trololo" }) should be false', function() {
                    expect(root.content[3].addAttr({ name: 'trololo', value: 3, local: 'trololo' })).to.be.false;
                });

                it('svg.addAttr() should be false', function() {
                    expect(root.content[3].addAttr()).to.be.false;
                });

            });

            describe('eachAttr()', function() {

                it('svg should have property "eachAttr"', function() {
                    expect(root.content[3]).to.have.property('eachAttr');
                });

                it('svg.content[0].eachAttr(function() {}) should be true', function() {
                    expect(root.content[3].content[0].eachAttr(function(attr) {
                        attr.test = 1;
                    })).to.be.true;

                    expect(root.content[3].content[0].attr('type').test).to.equal(1);
                });

                it('svg.content[1].eachAttr(function() {}) should be false', function() {
                    expect(root.content[3].content[1].eachAttr()).to.be.false;
                });

            });

        });

    });

    describe('malformed svg', function() {

        var filepath = PATH.resolve(__dirname, './test.bad.svg'),
            root,
            error;

        before(function(done) {

            FS.readFile(filepath, 'utf8', function(err, data) {
                if (err) {
                    throw err;
                }

                try {
                    root = SVG2JS(data)
                } catch (e) {
                    error = e;
                }

                done();
            });

        });

        describe('root', function() {

            it('should have property "error"', function() {
                expect(root).to.have.property('error');
            });

        });

        describe('root.error', function() {
            it('should be "Error in parsing SVG: Unexpected close tag"', function() {
                expect(root.error).to.equal('Error in parsing SVG: Unexpected close tag\nLine: 10\nColumn: 15\nChar: >');
            });

        });

        describe('error', function() {

            it('should not be thrown', function() {
                expect(error).to.not.exist;
            });

        });

    });

    describe('entities', function() {
        var filepath = PATH.resolve(__dirname, './test.entities.svg'),
            root;

        before(function(done) {
            FS.readFile(filepath, 'utf8', function(err, data) {
                if (err) throw err;

                root = SVG2JS(data);
                done();
            });
        });

        describe('root', function() {
            it('should exist', function() {
                expect(root).to.exist;
            });

            it('should have correctly parsed entities', function() {
                var attrs = root.content[root.content.length - 1].attrs;

                expect(attrs['xmlns:x'].value).to.be.equal('http://ns.adobe.com/Extensibility/1.0/');
                expect(attrs['xmlns:graph'].value).to.be.equal('http://ns.adobe.com/Graphs/1.0/');
            });
        });
    });

});
