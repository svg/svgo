'use strict';

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const EOL = require('os').EOL;
const regEOL = new RegExp(EOL, 'g');
const regFilename = /^(.*)_(\d+)\.svg$/;
const { validate } = require('../../lib/svgo.js');

describe('pluginsValidate tests', function () {
  fs.readdirSync(__dirname).forEach(function (file) {
    const match = file.match(regFilename);
    let index, name;

    if (match) {
      name = match[1];
      index = match[2];

      const filePath = path.resolve(__dirname, file);

      it(name + '_' + index, function () {
        return readFile(filePath).then(function (data) {
          // remove description
          const items = normalize(data).split(/\s*===\s*/);
          const test = items.length === 2 ? items[1] : items[0];
          // extract test case
          let [original, should, params] = test.split(/\s*@@@\s*/);
          // change string to boolean
          should = should === 'true';

          if (name === 'is_snake_case') {
            name = 'isSnakeCase';
          } else if (name === 'sme_isPrefixPresent') {
            name = 'isPrefixPresent';
          } else if (name === 'hasNoDiącritićCharacters') {
            name = 'hasNoDiacriticCharacters';
          } else if (name === 'pl' || name === 'polska') {
            if (name === 'pl') {
              file = 'pl.svg';
            }
            name = 'isISO3166_1Alpha2';
          }

          const plugin = {
            name: name,
            params: params ? JSON.parse(params) : {},
          };
          const result = validate(original, file, null, {
            path: filePath,
            plugins: [plugin],
            js2svg: { pretty: true },
          });

          expect(result).to.deep.equal({ [name]: should });
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
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
