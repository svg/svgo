'use strict';

const FS = require('fs');
const PATH = require('path');
const JSAPI = require('../../lib/svgo/jsAPI');
const CSSClassList = require('../../lib/svgo/css-class-list');
const CSSStyleDeclaration = require('../../lib/svgo/css-style-declaration');
const { parseSvg } = require('../../lib/parser.js');

describe('svg2js', function () {
  describe('working svg', function () {
    var filepath = PATH.resolve(__dirname, './test.svg'),
      root;

    beforeAll(function (done) {
      FS.readFile(filepath, 'utf8', function (err, data) {
        if (err) {
          throw err;
        }

        root = parseSvg(data);
        done();
      });
    });

    describe('root', function () {
      it('should exist', function () {
        expect(root).toEqual(expect.anything());
      });

      it('should be an instance of Object', function () {
        expect(root).toBeInstanceOf(Object);
      });

      it('should have property "children"', function () {
        expect(root).toHaveProperty('children');
      });
    });

    describe('root.children', function () {
      it('should be an instance of Array', function () {
        expect(root.children).toBeInstanceOf(Array);
      });

      it('should have length 4', function () {
        expect(root.children).toHaveLength(4);
      });
    });

    it('the first node should be instruction', () => {
      expect(root.children[0]).toEqual({
        type: 'instruction',
        name: 'xml',
        value: 'version="1.0" encoding="utf-8"',
      });
    });

    it('the second node should be comment', () => {
      expect(root.children[1]).toEqual({
        type: 'comment',
        value:
          'Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)',
      });
    });

    it('the third node should be doctype', () => {
      expect(root.children[2]).toEqual({
        type: 'doctype',
        name: 'svg',
        data: {
          doctype:
            ' svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"',
        },
      });
    });

    describe('name', function () {
      it('should have property name: "svg"', function () {
        expect(root.children[3]).toEqual(
          expect.objectContaining({
            name: 'svg',
          })
        );
      });
    });

    describe('attributes', function () {
      describe('root.children[3].attrs', function () {
        it('should exist', function () {
          expect(root.children[3].attrs).toEqual(expect.anything());
        });

        it('should be an instance of Object', function () {
          expect(root.children[3].attrs).toBeInstanceOf(Object);
        });
      });

      describe('root.children[3].attrs.version', function () {
        it('should exist', function () {
          expect(root.children[3].attrs.version).toEqual(expect.anything());
        });

        it('should be an instance of Object', function () {
          expect(root.children[3].attrs.version).toBeInstanceOf(Object);
        });

        it('should have property name: "version"', function () {
          expect(root.children[3].attrs.version).toHaveProperty(
            'name',
            'version'
          );
        });

        it('should have property value: "1.1"', function () {
          expect(root.children[3].attrs.version).toHaveProperty('value', '1.1');
        });
      });
    });

    describe('children', function () {
      it('should exist', function () {
        expect(root.children[3].children).toEqual(expect.anything());
      });

      it('should be an instance of Array', function () {
        expect(root.children[3].children).toBeInstanceOf(Array);
      });

      it('should eventually have length 3', function () {
        expect(root.children[3].children).toHaveLength(3);
      });
    });

    describe('text nodes', function () {
      it('should contain preserved whitespace', function () {
        const textNode = root.children[3].children[1].children[0].children[1];
        expect(textNode.children[0].value).toEqual('  test  ');
      });
    });

    describe('API', function () {
      describe('clone()', function () {
        it('svg should have property "clone"', function () {
          expect(root.children[3]).toHaveProperty('clone');
        });

        it('svg.clone() should be an instance of JSAPI', function () {
          expect(root.children[3].clone()).toBeInstanceOf(JSAPI);
        });

        it('root.children[3].children[0].clone() has a valid style property', function () {
          expect(root.children[3].children[0].clone().style).toBeInstanceOf(
            CSSStyleDeclaration
          );
        });

        it('root.children[3].children[2].clone() has a valid class property', function () {
          expect(root.children[3].children[2].clone().class).toBeInstanceOf(
            CSSClassList
          );
        });
      });

      describe('isElem()', function () {
        it('svg should have property "isElem"', function () {
          expect(root.children[3]).toHaveProperty('isElem');
        });

        it('svg.isElem() should be true', function () {
          expect(root.children[3].isElem()).toEqual(true);
        });

        it('svg.isElem("svg") should be true', function () {
          expect(root.children[3].isElem('svg')).toEqual(true);
        });

        it('svg.isElem("trololo") should be false', function () {
          expect(root.children[3].isElem('trololo')).toEqual(false);
        });

        it('svg.isElem(["svg", "trololo"]) should be true', function () {
          expect(root.children[3].isElem(['svg', 'trololo'])).toEqual(true);
        });
      });

      describe('isEmpty()', function () {
        it('svg should have property "isEmpty"', function () {
          expect(root.children[3]).toHaveProperty('isEmpty');
        });

        it('svg.isEmpty() should be false', function () {
          expect(root.children[3].isEmpty()).toEqual(false);
        });

        it('svg.children[0].children[0].isEmpty() should be true', function () {
          expect(root.children[3].children[0].children[0].isEmpty()).toEqual(
            true
          );
        });
      });

      describe('hasAttr()', function () {
        it('svg should have property "hasAttr"', function () {
          expect(root.children[3]).toHaveProperty('hasAttr');
        });

        it('svg.hasAttr() should be true', function () {
          expect(root.children[3].hasAttr()).toEqual(true);
        });

        it('svg.hasAttr("xmlns") should be true', function () {
          expect(root.children[3].hasAttr('xmlns')).toEqual(true);
        });

        it('svg.hasAttr("xmlns", "http://www.w3.org/2000/svg") should be true', function () {
          expect(
            root.children[3].hasAttr('xmlns', 'http://www.w3.org/2000/svg')
          ).toEqual(true);
        });

        it('svg.hasAttr("xmlns", "trololo") should be false', function () {
          expect(root.children[3].hasAttr('xmlns', 'trololo')).toEqual(false);
        });

        it('svg.hasAttr("trololo") should be false', function () {
          expect(root.children[3].hasAttr('trololo')).toEqual(false);
        });

        it('svg.children[1].hasAttr() should be false', function () {
          expect(root.children[3].children[1].hasAttr()).toEqual(false);
        });
      });

      describe('attr()', function () {
        it('svg should have property "attr"', function () {
          expect(root.children[3]).toHaveProperty('attr');
        });

        it('svg.attr("xmlns") should be an instance of Object', function () {
          expect(root.children[3].attr('xmlns')).toBeInstanceOf(Object);
        });

        it('svg.attr("xmlns", "http://www.w3.org/2000/svg") should be an instance of Object', function () {
          expect(
            root.children[3].attr('xmlns', 'http://www.w3.org/2000/svg')
          ).toBeInstanceOf(Object);
        });

        it('svg.attr("xmlns", "trololo") should be an undefined', function () {
          expect(root.children[3].attr('xmlns', 'trololo')).not.toEqual(
            expect.anything()
          );
        });

        it('svg.attr("trololo") should be an undefined', function () {
          expect(root.children[3].attr('trololo')).not.toEqual(
            expect.anything()
          );
        });

        it('svg.attr() should be undefined', function () {
          expect(root.children[3].attr()).not.toEqual(expect.anything());
        });
      });

      describe('removeAttr()', function () {
        it('svg should have property "removeAttr"', function () {
          expect(root.children[3]).toHaveProperty('removeAttr');
        });

        it('svg.removeAttr("width") should be true', function () {
          expect(root.children[3].removeAttr('width')).toEqual(true);

          expect(root.children[3].hasAttr('width')).toEqual(false);
        });

        it('svg.removeAttr("height", "120px") should be true', function () {
          expect(root.children[3].removeAttr('height', '120px')).toEqual(true);

          expect(root.children[3].hasAttr('height')).toEqual(false);
        });

        it('svg.removeAttr("x", "1px") should be false', function () {
          expect(root.children[3].removeAttr('x', '1px')).toEqual(false);

          expect(root.children[3].hasAttr('x')).toEqual(true);
        });

        it('svg.removeAttr("z") should be false', function () {
          expect(root.children[3].removeAttr('z')).toEqual(false);
        });

        it('svg.removeAttr() should be false', function () {
          expect(root.children[3].removeAttr()).toEqual(false);
        });
      });

      describe('addAttr()', function () {
        var attr = {
          name: 'test',
          value: 3,
        };

        it('svg should have property "addAttr"', function () {
          expect(root.children[3]).toHaveProperty('addAttr');
        });

        it('svg.addAttr(attr) should be an instance of Object', function () {
          expect(root.children[3].addAttr(attr)).toBeInstanceOf(Object);
        });

        it('svg.children[1].children[0].addAttr(attr) should be an instance of Object', function () {
          expect(
            root.children[3].children[1].children[0].addAttr(attr)
          ).toBeInstanceOf(Object);
        });

        it('svg.addAttr() should be false', function () {
          expect(root.children[3].addAttr()).toEqual(false);
        });
      });

      describe('eachAttr()', function () {
        it('svg should have property "eachAttr"', function () {
          expect(root.children[3]).toHaveProperty('eachAttr');
        });

        it('svg.children[0].eachAttr(function() {}) should be true', function () {
          expect(
            root.children[3].children[0].eachAttr(function (attr) {
              attr.value = '1';
            })
          ).toEqual(true);

          expect(root.children[3].children[0].attr('type').value).toEqual('1');
        });

        it('svg.children[1].eachAttr(function() {}) should be false', function () {
          expect(root.children[3].children[1].eachAttr()).toEqual(false);
        });
      });
    });
  });
});
