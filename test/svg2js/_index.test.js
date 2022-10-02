'use strict';

const FS = require('fs');
const PATH = require('path');
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
  });
});
