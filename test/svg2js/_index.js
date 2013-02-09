'use strict';

var CHAI = require('chai'),
    QFS = require('q-fs'),
    PATH = require('path'),
    assert = CHAI.assert,
    cover = process.argv[3] === 'mocha-istanbul',
    svg2js = require(cover ? '../../lib-cov/svgo/svg2js' : '../../lib/svgo/svg2js'),
    config = {
        strict: true,
        trim: true,
        normalize: true,
        lowercase: true,
        xmlns: true,
        position: false
    };

require('mocha-as-promised')(require('mocha'));
CHAI.use(require('chai-as-promised'));
CHAI.should();

describe('svg2js', function() {

    describe('working svg', function() {

        var path = PATH.resolve(__dirname, './test.svg'),
            root = QFS.read(path).then(function(data) {
                return svg2js(data.toString(), config);
            });

        describe('nodes', function() {

            describe('root', function() {

                it('should be fulfiled', function() {
                    return root.should.be.fulfiled;
                });

                it('should eventually exist', function() {
                    return root.should.eventually.exist;
                });

                it('should eventually be an instance of Object', function() {
                    return root.should.eventually.be.an.instanceOf(Object);
                });

                it('should eventually have property "content"', function() {
                    return root.should.eventually.have.property('content');
                });

            });

            describe('root.content', function() {

                var content = root.then(function(data) {
                    return data.content;
                });

                it('should eventually exist', function() {
                    return content.should.eventually.exist;
                });

                it('should eventually be an instance of Array', function() {
                    return content.should.eventually.be.an.instanceOf(Array);
                });

                it('should eventually have length 4', function() {
                    return content.should.eventually.have.lengthOf(4);
                });

            });

            describe('root.content[0].processinginstruction', function() {

                var processinginstruction = root.then(function(data) {
                    return data.content[0].processinginstruction;
                });

                it('should eventually exist', function() {
                    return processinginstruction.should.eventually.exist;
                });

                it('should eventually be an instance of Object', function() {
                    return processinginstruction.should.eventually.be.an.instanceOf(Object);
                });

                it('should eventually have property "name" with value "xml"', function() {
                    return processinginstruction.should.eventually.have.property('name', 'xml');
                });

                it('should eventually have property "body" with value "version=\"1.0\" encoding=\"utf-8\""', function() {
                    return processinginstruction.should.eventually.have.property('body', 'version=\"1.0\" encoding=\"utf-8\"');
                });

            });

            describe('root.content[1].comment', function() {

                var comment = root.then(function(data) {
                    return data.content[1].comment;
                });

                it('should eventually exist', function() {
                    return comment.should.eventually.exist;
                });

                it('should eventually equal "Generator: Adobe Illustrator…"', function() {
                    return comment.should.eventually.equal('Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');
                });

            });

            describe('root.content[2].doctype', function() {

                var doctype = root.then(function(data) {
                    return data.content[2].doctype;
                });

                it('should eventually exist', function() {
                    return doctype.should.eventually.exist;
                });

                it('should eventually equal " svg PUBLIC…"', function() {
                    return doctype.should.eventually.equal(' svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"');
                });

            });

            describe('root.content[3]', function() {

                var elem = root.then(function(data) {
                    return data.content[3];
                });

                it('should eventually have property elem: "svg"', function() {
                    return elem.should.eventually.have.property('elem', 'svg');
                });

                it('should eventually have property prefix: ""', function() {
                    return elem.should.eventually.have.property('prefix', '');
                });

                it('should eventually have property local: "svg"', function() {
                    return elem.should.eventually.have.property('local', 'svg');
                });

            });

        });

        describe('attributes', function() {

            describe('root.content[3].attrs', function() {

                var attrs = root.then(function(data) {
                    return data.content[3].attrs;
                });

                it('should eventually exist', function() {
                    return attrs.should.eventually.exist;
                });

                it('should eventually be an instance of Object', function() {
                    return attrs.should.be.an.instanceOf(Object);
                });

            });

            describe('root.content[3].attrs.version', function() {

                var version = root.then(function(data) {
                    return data.content[3].attrs.version;
                });

                it('should eventually exist', function() {
                    return version.should.eventually.exist;
                });

                it('should eventually be an instance of Object', function() {
                    return version.should.eventually.be.an.instanceOf(Object);
                });

                it('should eventually have property name: "version"', function() {
                    return version.should.eventually.have.property('name', 'version');
                });

                it('should eventually have property value: "1.1"', function() {
                    return version.should.eventually.have.property('value', '1.1');
                });

                it('should eventually have property prefix: ""', function() {
                    return version.should.eventually.have.property('prefix', '');
                });

                it('should eventually have property local: "version"', function() {
                    return version.should.eventually.have.property('local', 'version');
                });

            });

        });

        describe('content', function() {

            var content = root.then(function(data) {
                return data.content[3].content;
            });

            it('should eventually exist', function() {
                return content.should.eventually.exist;
            });

            it('should eventually be an instance of Array', function() {
                return content.should.eventually.be.an.instanceOf(Array);
            });

            it('should eventually have length 3', function() {
                return content.should.eventually.have.lengthOf(3);
            });

        });

        describe('API', function() {

            var svg = root.then(function(data) {
                return data.content[3];
            });

            describe('isElem()', function() {

                it('svg should eventually have property "isElem"', function() {
                    return svg.should.eventually.have.property('isElem');
                });

                it('svg.isElem() should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.isElem().should.be.true;
                    });
                });

                it('svg.isElem("svg") should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.isElem('svg').should.be.true;
                    });
                });

                it('svg.isElem("trololo") should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.isElem('trololo').should.be.false;
                    });
                });

                it('svg.isElem(["svg", "trololo"]) should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.isElem(['svg', 'trololo']).should.be.true;
                    });
                });

            });

            describe('isEmpty()', function() {

                it('svg should eventually have property "isEmpty"', function() {
                    return svg.should.eventually.have.property('isEmpty');
                });

                it('svg.isEmpty() should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.isEmpty().should.be.false;
                    });
                });

                it('svg.content[0].content[0].isEmpty() should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.content[0].content[0].isEmpty().should.be.true;
                    });
                });

            });

            describe('hasAttr()', function() {

                it('svg should eventually have property "hasAttr"', function() {
                    return svg.should.eventually.have.property('hasAttr');
                });

                it('svg.hasAttr() should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.hasAttr().should.be.true;
                    });
                });

                it('svg.hasAttr("xmlns") should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.hasAttr('xmlns').should.be.true;
                    });
                });

                it('svg.hasAttr("xmlns", "http://www.w3.org/2000/svg") should be true', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.hasAttr('xmlns', 'http://www.w3.org/2000/svg').should.be.true;
                    });
                });

                it('svg.hasAttr("xmlns", "trololo") should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.hasAttr('xmlns', 'trololo').should.be.false;
                    });
                });

                it('svg.hasAttr("trololo") should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.hasAttr('trololo').should.be.false;
                    });
                });

                it('svg.content[1].hasAttr() should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.content[1].hasAttr().should.be.false;
                    });
                });

            });

            describe('attr()', function() {

                it('svg should eventually have property "attr"', function() {
                    return svg.should.eventually.have.property('attr');
                });

                it('svg.attr("xmlns") should be an Object', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.attr('xmlns').should.be.an('object');
                    });
                });

                it('svg.attr("xmlns", "http://www.w3.org/2000/svg") should be an Object', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.attr('xmlns', 'http://www.w3.org/2000/svg').should.be.an('object');
                    });
                });

                it('svg.attr("xmlns", "trololo") should be an undefined', function() {
                    return svg.then(function(svgElem) {
                        return assert.strictEqual(svgElem.attr('xmlns', 'trololo'), undefined);
                    });
                });

                it('svg.attr("trololo") should be an undefined', function() {
                    return svg.then(function(svgElem) {
                        return assert.strictEqual(svgElem.attr('trololo'), undefined);
                    });
                });

                it('svg.attr() should be undefined', function() {
                    return svg.then(function(svgElem) {
                        return assert.strictEqual(svgElem.attr(), undefined);
                    });
                });

            });

            describe('removeAttr()', function() {

                it('svg should eventually have property "removeAttr"', function() {
                    return svg.should.eventually.have.property('removeAttr');
                });

                it('svg.removeAttr("width") should be true', function() {
                    return svg.then(function(svgElem) {
                        svgElem.removeAttr('width').should.be.true;

                        return svgElem.hasAttr('width').should.be.false;
                    });
                });

                it('svg.removeAttr("height", "120px") should be true', function() {
                    return svg.then(function(svgElem) {
                        svgElem.removeAttr('height', '120px').should.be.true;

                        return svgElem.hasAttr('height').should.be.false;
                    });
                });

                it('svg.removeAttr("x", "1px") should be false', function() {
                    return svg.then(function(svgElem) {
                        svgElem.removeAttr('x', '1px').should.be.false;

                        return svgElem.hasAttr('x').should.be.true;
                    });
                });

                it('svg.removeAttr("z") should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.removeAttr('z').should.be.false;
                    });
                });

                it('svg.removeAttr() should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.removeAttr().should.be.false;
                    });
                });

                it('svg.content[2].removeAttr("style") should be true', function() {
                    return svg.then(function(svgElem) {
                        svgElem.content[2].removeAttr('style').should.be.true;

                        return svgElem.content[2].hasAttr().should.be.false;
                    });
                });

            });

            describe('addAttr()', function() {

                var attr = {
                    name: 'test',
                    value: 3,
                    prefix: '',
                    local: 'test'
                };

                it('svg should eventually have property "addAttr"', function() {
                    return svg.should.eventually.have.property('addAttr');
                });

                it('svg.addAttr(attr) should be an Object', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr(attr).should.be.an('object');
                    });
                });

                it('svg.content[1].content[0].addAttr(attr) should be an Object', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.content[1].content[0].addAttr(attr).should.be.an('object');
                    });
                });

                it('svg.addAttr({ name: "trololo" }) should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr({ name: 'trololo' }).should.be.false;
                    });
                });

                it('svg.addAttr({ name: "trololo", value: 3 }) should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr({ name: 'trololo', value: 3 }).should.be.false;
                    });
                });

                it('svg.addAttr({ name: "trololo", value: 3, prefix: "" }) should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr({ name: 'trololo', value: 3, prefix: '' }).should.be.false;
                    });
                });

                it('svg.addAttr({ name: "trololo", value: 3, local: "trololo" }) should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr({ name: 'trololo', value: 3, local: 'trololo' }).should.be.false;
                    });
                });

                it('svg.addAttr() should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.addAttr().should.be.false;
                    });
                });

            });

            describe('eachAttr()', function() {

                it('svg should eventually have property "eachAttr"', function() {
                    return svg.should.eventually.have.property('eachAttr');
                });

                it('svg.content[0].eachAttr(function() {}) should be true', function() {
                    return svg.then(function(svgElem) {
                        svgElem.content[0].eachAttr(function(attr) {
                            attr.test = 1;
                        }).should.be.true;

                        return svgElem.content[0].attr('type').test.should.equal(1);
                    });
                });

                it('svg.content[1].eachAttr(function() {}) should be false', function() {
                    return svg.then(function(svgElem) {
                        return svgElem.content[1].eachAttr(function() {}).should.be.false;
                    });
                });

            });

        });

    });

    describe('bad svg', function() {

        var path = PATH.resolve(__dirname, './test.bad.svg'),
            promise = QFS.read(path).then(function(data) {
                return svg2js(data.toString(), config);
            });

        it('should be rejected with "svg2js: Unexpected close tag"', function() {
            return promise.should.be.rejected.with('svg2js: Unexpected close tag');
        });

    });

});
