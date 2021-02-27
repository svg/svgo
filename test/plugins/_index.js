'use strict';

const { expect } = require('chai');
const FS = require('fs');
const PATH = require('path');
const EOL = require('os').EOL;
const regEOL = new RegExp(EOL, 'g');
const regFilename = /^(.*)\.(\d+)\.svg$/;
const { optimize } = require('../../lib/svgo.js');

describe('plugins tests', function () {
  FS.readdirSync(__dirname).forEach(function (file) {
    var match = file.match(regFilename),
      index,
      name;

    if (match) {
      name = match[1];
      index = match[2];

      file = PATH.resolve(__dirname, file);

      it(name + '.' + index, function () {
        return readFile(file).then(function (data) {
          var splitted = normalize(data).split(/\s*@@@\s*/),
            orig = splitted[0],
            should = splitted[1],
            params = splitted[2];
          const plugin = {
            name,
            params: params ? JSON.parse(params) : {},
          };
          const result = optimize(orig, {
            path: file,
            plugins: [plugin],
            js2svg: { pretty: true },
          });
          //FIXME: results.data has a '\n' at the end while it should not
          expect(normalize(result.data)).to.equal(should);
        });
      });
    }
  });
});

function normalize(file) {
  return file.trim().replace(regEOL, '\n');
}

function readFile(file) {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, 'utf8', function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
