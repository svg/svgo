import assert from 'assert';
import fs from 'node:fs/promises';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '../package.json');
const { version } = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

const fixture = `<svg xmlns="http://www.w3.org/2000/svg">
    <g attr1="val1">
        <g attr2="val2">
            <path attr2="val3" d="..."/>
        </g>
        <path d="..."/>
    </g>
</svg>`;

const expected = `<svg xmlns="http://www.w3.org/2000/svg">
  <g attr1="val1">
    <g attr2="val2">
      <path attr2="val3" d="..."/>
    </g>
    <path d="..."/>
  </g>
</svg>
`;

const content = `
<script type="module">
import { VERSION, optimize, builtinPlugins } from '/svgo.browser.js';
const result = optimize(${JSON.stringify(fixture)}, {
  plugins : [],
  js2svg  : { pretty: true, indent: 2 }
});
globalThis.version = VERSION;
globalThis.builtinPlugins = builtinPlugins;
globalThis.result = result.data;
</script>
`;

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(content);
  }
  if (req.url === '/svgo.browser.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(await fs.readFile('./dist/svgo.browser.js'));
  }
  res.end();
});

const runTest = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5000');

  const actual = await page.evaluate(() => ({
    version: globalThis.version,
    builtinPlugins: globalThis.builtinPlugins,
    result: globalThis.result,
  }));

  assert.strictEqual(actual.version, version);
  assert.notEqual(actual.builtinPlugins, undefined);
  assert.equal(actual.result, expected);

  await browser.close();
};

server.listen(5000, async () => {
  try {
    await runTest();
    console.info('Tested successfully');
    server.close();
  } catch (error) {
    server.close();
    console.error(error.toString());
    process.exit(1);
  }
});
