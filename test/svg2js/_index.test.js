import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSvg } from '../../lib/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('svg2js', () => {
  describe('working svg', () => {
    const filepath = path.resolve(__dirname, './test.svg');
    /** @type {any} */
    let root;

    beforeAll((done) => {
      fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
          throw err;
        }

        root = parseSvg(data);
        done();
      });
    });

    describe('root', () => {
      it('should exist', () => {
        expect(root).toStrictEqual(expect.anything());
      });

      it('should be an instance of Object', () => {
        expect(root).toBeInstanceOf(Object);
      });

      it('should have property "children"', () => {
        expect(root).toHaveProperty('children');
      });
    });

    describe('root.children', () => {
      it('should be an instance of Array', () => {
        expect(root.children).toBeInstanceOf(Array);
      });

      it('should have length 4', () => {
        expect(root.children).toHaveLength(4);
      });
    });

    it('the first node should be instruction', () => {
      expect(root.children[0]).toStrictEqual({
        type: 'instruction',
        name: 'xml',
        value: 'version="1.0" encoding="utf-8"',
      });
    });

    it('the second node should be comment', () => {
      expect(root.children[1]).toStrictEqual({
        type: 'comment',
        value:
          'Generator: Adobe Illustrator 15.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)',
      });
    });

    it('the third node should be doctype', () => {
      expect(root.children[2]).toStrictEqual({
        type: 'doctype',
        name: 'svg',
        data: {
          doctype:
            ' svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"',
        },
      });
    });

    describe('name', () => {
      it('should have property name: "svg"', function () {
        expect(root.children[3]).toStrictEqual(
          expect.objectContaining({
            name: 'svg',
          }),
        );
      });
    });

    describe('children', () => {
      it('should exist', () => {
        expect(root.children[3].children).toStrictEqual(expect.anything());
      });

      it('should be an instance of Array', () => {
        expect(root.children[3].children).toBeInstanceOf(Array);
      });

      it('should eventually have length 3', () => {
        expect(root.children[3].children).toHaveLength(3);
      });
    });

    describe('text nodes', () => {
      it('should contain preserved whitespace', () => {
        const textNode = root.children[3].children[1].children[0].children[1];
        expect(textNode.children[0].value).toBe('  test  ');
      });
    });
  });
});
