'use strict';

var SHOULD = require('should'),
    FS = require('fs'),
    PATH = require('path'),
    JSAPI = require(process.env.COVERAGE ?
                     '../../lib-cov/svgo/jsAPI' :
                     '../../lib/svgo/jsAPI'),
    CSSClassList = require(process.env.COVERAGE ?
                     '../../lib-cov/svgo/css-class-list' :
                     '../../lib/svgo/css-class-list'),
    CSSStyleDeclaration = require(process.env.COVERAGE ?
                     '../../lib-cov/svgo/css-style-declaration' :
                     '../../lib/svgo/css-style-declaration'),
    SVG2JS = require(process.env.COVERAGE ?
                     '../../lib-cov/svgo/svg2js' :
                     '../../lib/svgo/svg2js');

describe('svg2js', function() {

    describe('working svg', function() {

        var filepath = PATH.resolve(__dirname, './test.svg'),
            root;

        before(function(done) {

            FS.readFile(filepath, 'utf8', function(err, data) {
                if (err) {
                    throw err;
                }

                SVG2JS(data, function(result) {
                    root = result;
                    done();
                });
            });

        });

        describe('root', function() {

            it('should exist', function() {
                return root.should.exist;
            });

            it('should be an instance of Object', function() {
                return root.should.be.an.instanceOf(Object);
            });

            it('should have property "content"', function() {
                return root.should.have.property('content');
            });

        });

        describe('root.content', function() {

            it('should be an instance of Array', function() {
                return root.content.should.be.an.instanceOf(Array);
            });

            it('should have length 4', function() {
                return root.content.should.have.lengthOf(4);
            });

        });

        describe('root.content[0].processinginstruction', function() {

            it('should exist', function() {
                return root.content[0].processinginstruction.should.exist;
            });

            it('should be an instance of Object', function() {
                return root.content[0].processinginstruction.should.be.an.instanceOf(Object);
            });

            it('should have property "name" with value "xml"', function() {
                return root.content[0].processinginstruction.should.have.property('name', 'xml');
            });

            it('should have property "body" with value "version=\"1.0\" encoding=\"utf-8\""', function() {
                return root.content[0].processinginstruction.should.have.property('body', 'version=\"1.0\" encoding=\"utf-8\"');
            });

        });

        describe('root.content[1].comment', function() {

            it('should exist', function() {
                return root.content[1].comment.should.exist;
            });

            it('should equal "Generator: Adobe Illustrator…"', function() {
                return root.content[1].comment.should.equal('Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');
            });

        });

        describe('root.content[2].doctype', function() {

            it('should exist', function() {
                return root.content[2].doctype.should.exist;
            });

            it('should eventually equal " svg PUBLIC…"', function() {
                return root.content[2].doctype.should.equal(' svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"');
            });

        });

        describe('elem', function() {

            it('should have property elem: "svg"', function() {
                return root.content[3].should.have.property('elem', 'svg');
            });

            it('should have property prefix: ""', function() {
                return root.content[3].should.have.property('prefix', '');
            });

            it('should have property local: "svg"', function() {
                return root.content[3].should.have.property('local', 'svg');
            });

        });

        describe('attributes', function() {

            describe('root.content[3].attrs', function() {

                it('should exist', function() {
                    return root.content[3].attrs.should.exist;
                });

                it('should be an instance of Object', function() {
                    return root.content[3].attrs.should.be.an.instanceOf(Object);
                });

            });

            describe('root.content[3].attrs.version', function() {

                it('should exist', function() {
                    return root.content[3].attrs.version.should.exist;
                });

                it('should be an instance of Object', function() {
                    return root.content[3].attrs.version.should.be.an.instanceOf(Object);
                });

                it('should have property name: "version"', function() {
                    return root.content[3].attrs.version.should.have.property('name', 'version');
                });

                it('should have property value: "1.1"', function() {
                    return root.content[3].attrs.version.should.have.property('value', '1.1');
                });

                it('should have property prefix: ""', function() {
                    return root.content[3].attrs.version.should.have.property('prefix', '');
                });

                it('should have property local: "version"', function() {
                    return root.content[3].attrs.version.should.have.property('local', 'version');
                });

            });

        });

        describe('content', function() {

            it('should exist', function() {
                return root.content[3].content.should.exist;
            });

            it('should be an instance of Array', function() {
                return root.content[3].content.should.be.an.instanceOf(Array);
            });

            it('should eventually have length 3', function() {
                return root.content[3].content.should.have.lengthOf(3);
            });

        });

        describe('API', function() {

            describe('clone()', function() {

                it('svg should have property "clone"', function() {
                    return root.content[3].should.have.property('clone');
                });

                it('svg.clone() should be an instance of JSAPI', function() {
                    return root.content[3].clone().should.be.instanceOf(JSAPI);
                });

                it('root.content[3].content[0].clone() has a valid style property', function() {
                    return root.content[3].content[0].clone().style.should.be.instanceof(CSSStyleDeclaration);
                });

                it('root.content[3].content[2].clone() has a valid class property', function() {
                    return root.content[3].content[2].clone().class.should.be.instanceof(CSSClassList);
                });

            });

            describe('isElem()', function() {

                it('svg should have property "isElem"', function() {
                    return root.content[3].should.have.property('isElem');
                });

                it('svg.isElem() should be true', function() {
                    return root.content[3].isElem().should.be.true;
                });

                it('svg.isElem("svg") should be true', function() {
                    return root.content[3].isElem('svg').should.be.true;
                });

                it('svg.isElem("trololo") should be false', function() {
                    return root.content[3].isElem('trololo').should.be.false;
                });

                it('svg.isElem(["svg", "trololo"]) should be true', function() {
                    return root.content[3].isElem(['svg', 'trololo']).should.be.true;
                });

            });

            describe('isEmpty()', function() {

                it('svg should have property "isEmpty"', function() {
                    return root.content[3].should.have.property('isEmpty');
                });

                it('svg.isEmpty() should be false', function() {
                    return root.content[3].isEmpty().should.be.false;
                });

                it('svg.content[0].content[0].isEmpty() should be true', function() {
                    return root.content[3].content[0].content[0].isEmpty().should.be.true;
                });

            });

            describe('hasAttr()', function() {

                it('svg should have property "hasAttr"', function() {
                    return root.content[3].should.have.property('hasAttr');
                });

                it('svg.hasAttr() should be true', function() {
                    return root.content[3].hasAttr().should.be.true;
                });

                it('svg.hasAttr("xmlns") should be true', function() {
                    return root.content[3].hasAttr('xmlns').should.be.true;
                });

                it('svg.hasAttr("xmlns", "http://www.w3.org/2000/svg") should be true', function() {
                    return root.content[3].hasAttr('xmlns', 'http://www.w3.org/2000/svg').should.be.true;
                });

                it('svg.hasAttr("xmlns", "trololo") should be false', function() {
                    return root.content[3].hasAttr('xmlns', 'trololo').should.be.false;
                });

                it('svg.hasAttr("trololo") should be false', function() {
                    return root.content[3].hasAttr('trololo').should.be.false;
                });

                it('svg.content[1].hasAttr() should be false', function() {
                    return root.content[3].content[1].hasAttr().should.be.false;
                });

            });

            describe('attr()', function() {

                it('svg should have property "attr"', function() {
                    return root.content[3].should.have.property('attr');
                });

                it('svg.attr("xmlns") should be an instance of Object', function() {
                    return root.content[3].attr('xmlns').should.be.an.instanceOf(Object);
                });

                it('svg.attr("xmlns", "http://www.w3.org/2000/svg") should be an instance of Object', function() {
                    return root.content[3].attr('xmlns', 'http://www.w3.org/2000/svg').should.be.an.instanceOf(Object);
                });

                it('svg.attr("xmlns", "trololo") should be an undefined', function() {
                    return SHOULD.not.exist(root.content[3].attr('xmlns', 'trololo'));
                });

                it('svg.attr("trololo") should be an undefined', function() {
                    return SHOULD.not.exist(root.content[3].attr('trololo'));
                });

                it('svg.attr() should be undefined', function() {
                    return SHOULD.not.exist(root.content[3].attr());
                });

            });

            describe('removeAttr()', function() {

                it('svg should have property "removeAttr"', function() {
                    return root.content[3].should.have.property('removeAttr');
                });

                it('svg.removeAttr("width") should be true', function() {
                    root.content[3].removeAttr('width').should.be.true;

                    return root.content[3].hasAttr('width').should.be.false;
                });

                it('svg.removeAttr("height", "120px") should be true', function() {
                    root.content[3].removeAttr('height', '120px').should.be.true;

                    return root.content[3].hasAttr('height').should.be.false;
                });

                it('svg.removeAttr("x", "1px") should be false', function() {
                    root.content[3].removeAttr('x', '1px').should.be.false;

                    return root.content[3].hasAttr('x').should.be.true;
                });

                it('svg.removeAttr("z") should be false', function() {
                    return root.content[3].removeAttr('z').should.be.false;
                });

                it('svg.removeAttr() should be false', function() {
                    return root.content[3].removeAttr().should.be.false;
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
                    return root.content[3].should.have.property('addAttr');
                });

                it('svg.addAttr(attr) should be an instance of Object', function() {
                    return root.content[3].addAttr(attr).should.be.an.instanceOf(Object);
                });

                it('svg.content[1].content[0].addAttr(attr) should be an instance of Object', function() {
                    return root.content[3].content[1].content[0].addAttr(attr).should.be.an.instanceOf(Object);
                });

                it('svg.addAttr({ name: "trololo" }) should be false', function() {
                    return root.content[3].addAttr({ name: 'trololo' }).should.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3 }) should be false', function() {
                    return root.content[3].addAttr({ name: 'trololo', value: 3 }).should.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3, prefix: "" }) should be false', function() {
                    return root.content[3].addAttr({ name: 'trololo', value: 3, prefix: '' }).should.be.false;
                });

                it('svg.addAttr({ name: "trololo", value: 3, local: "trololo" }) should be false', function() {
                    return root.content[3].addAttr({ name: 'trololo', value: 3, local: 'trololo' }).should.be.false;
                });

                it('svg.addAttr() should be false', function() {
                    return root.content[3].addAttr().should.be.false;
                });

            });

            describe('eachAttr()', function() {

                it('svg should have property "eachAttr"', function() {
                    return root.content[3].should.have.property('eachAttr');
                });

                it('svg.content[0].eachAttr(function() {}) should be true', function() {
                    root.content[3].content[0].eachAttr(function(attr) {
                        attr.test = 1;
                    }).should.be.true;

                    return root.content[3].content[0].attr('type').test.should.equal(1);
                });

                it('svg.content[1].eachAttr(function() {}) should be false', function() {
                    return root.content[3].content[1].eachAttr().should.be.false;
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
                    SVG2JS(data, function(result) {
                        root = result;
                    });
                } catch (e) {
                    error = e;
                }

                done();
            });

        });

        describe('root', function() {

            it('should have property "error"', function() {
                return root.should.have.property('error');
            });

        });

        describe('root.error', function() {

            it('should be an instance of String', function() {
                return root.error.should.an.instanceOf(String);
            });

            it('should be "Error in parsing SVG: Unexpected close tag"', function() {
                return root.error.should.equal('Error in parsing SVG: Unexpected close tag\nLine: 10\nColumn: 15\nChar: >');
            });

        });

        describe('error', function() {

            it('should not be thrown', function() {
                return SHOULD.not.exist(error);
            });

        });

    });

    describe('entities', function() {
        var filepath = PATH.resolve(__dirname, './test.entities.svg'),
            root;

        before(function(done) {
            FS.readFile(filepath, 'utf8', function(err, data) {
                if (err) throw err;

                SVG2JS(data, function(result) {
                    root = result;
                });
                done();
            });
        });

        describe('root', function() {
            it('should exist', function() {
                return root.should.exist;
            });

            it('should have correctly parsed entities', function() {
                var attrs = root.content[root.content.length - 1].attrs;

                attrs['xmlns:x'].value.should.be.equal('http://ns.adobe.com/Extensibility/1.0/');
                attrs['xmlns:graph'].value.should.be.equal('http://ns.adobe.com/Graphs/1.0/');
            });
        });
    });

});
