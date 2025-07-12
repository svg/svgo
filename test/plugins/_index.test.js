import fs from 'fs/promises';
import path from 'path';
import { EOL } from 'os';
import { fileURLToPath } from 'url';
import { optimize } from '../../lib/svgo.js';

const regFilename = /^(.*)\.(\d+)\.svg\.txt$/;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = await fs.readdir(__dirname);

describe('plugins tests', function () {
  for (let file of files) {
    const match = file.match(regFilename);
    let index;
    /** @type {any} */
    let name;

    if (match) {
      name = match[1];
      index = match[2];

      file = path.resolve(__dirname, file);

      it(name + '.' + index, () => {
        return readFile(file).then(function (data) {
          // remove description
          const items = normalize(data).split(/\s*===\s*/);
          const test = items.length === 2 ? items[1] : items[0];
          // extract test case
          const [original, should, params] = test.split(/\s*@@@\s*/);
          /** @type {Exclude<import('../../lib/types.js').PluginConfig, import('../../lib/types.js').CustomPlugin>} */
          const plugin = {
            name,
            params: params ? JSON.parse(params) : {},
          };
          let lastResultData = original;
          // test plugins idempotence
          const exclude = ['addAttributesToSVGElement', 'convertTransform'];
          const multipass = exclude.includes(name) ? 1 : 2;
          for (let i = 0; i < multipass; i += 1) {
            const result = optimize(lastResultData, {
              path: file,
              plugins: [plugin],
              js2svg: { pretty: true },
            });
            lastResultData = result.data;
            //FIXME: results.data has a '\n' at the end while it should not
            expect(normalize(result.data)).toStrictEqual(should);
          }
        });
      });
    }
  }
});

/**
 * @param {string} file
 * @returns {string}
 */
function normalize(file) {
  return file.trim().replaceAll(EOL, '\n');
}

/**
 * @param {string} file
 * @returns {Promise<string>}
 */
function readFile(file) {
  return fs.readFile(file, 'utf-8');
}
