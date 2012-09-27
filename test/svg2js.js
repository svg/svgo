var should = require('should'),
    svg2js = require('../lib/svg2js');

describe('svg2json\n\n  | <svg xmlns="http://www.w3.org/2000/svg">\n  |   <g>123</g>\n  | </svg>\n', function() {

    var svg = '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>',
        result;

    before(function(done) {
        svg2js(svg).then(function(data) {
            result = data;
            done();
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

        it('content should have length 1', function() {
            result.content.should.have.length(1);
        });

        it('content[0] should have property "elem" with value "svg"', function() {
            result.content[0].should.have.property('elem', 'svg');
        });

        it('svg should have properties "prefix" and "local', function() {
            result.content[0].should.have.property('prefix');
            result.content[0].should.have.property('local');
        });

    });

    describe('attributes', function() {

        it('svg should have property "attrs" with instance of Object', function() {
            result.content[0].should.have.property('attrs').with.instanceOf(Object);
        });

        it('svg.attrs should have property "xmlns" with instance of Object', function() {
            result.content[0].attrs.should.have.property('xmlns').with.instanceOf(Object);
        });

        it('svg.attrs.xmlns should have properties "name", "value", "prefix", "local" and "uri"', function() {
            result.content[0].attrs.xmlns.should.have.property('name');
            result.content[0].attrs.xmlns.should.have.property('prefix');
            result.content[0].attrs.xmlns.should.have.property('local');
        });

        it('svg.attrs.xmlns.name shoud be equal "xmlns"', function() {
            result.content[0].attrs.xmlns.name.should.equal('xmlns');
        });

        it('svg.attrs.xmlns.value shoud be equal "http://www.w3.org/2000/svg"', function() {
            result.content[0].attrs.xmlns.value.should.equal('http://www.w3.org/2000/svg');
        });

        it('svg.attrs.xmlns.prefix shoud be equal "xmlns"', function() {
            result.content[0].attrs.xmlns.prefix.should.equal('xmlns');
        });

        it('svg.attrs.xmlns.local shoud be empty ""', function() {
            result.content[0].attrs.xmlns.local.should.be.empty;
        });

    });

    describe('content', function() {

        it('svg should have property "content" with instance of Array', function() {
            result.content[0].should.have.property('content').with.instanceOf(Array);
        });

        it('svg.content should have length 1', function() {
            result.content[0].content.should.have.length(1);
        });

    });

    describe('API', function() {

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

});
