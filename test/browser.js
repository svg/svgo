const fs = require('fs');
const http = require('http');
const assert = require('assert');
const { chromium } = require('playwright');

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
import { optimize } from '/svgo.browser.js';
const result = optimize(${JSON.stringify(fixture)}, {
  plugins : [],
  js2svg  : { pretty: true, indent: 2 }
});
globalThis.result = result.data;
</script>
`;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(content);
  }
  if (req.url === '/svgo.browser.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(fs.readFileSync('./dist/svgo.browser.js'));
  }
  res.end()
});

const runTest = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5000');
  const actual = await page.evaluate(() => globalThis.result);
  assert.equal(actual, expected);
  await browser.close()
}

server.listen(5000, async () => {
  try {
    await runTest();
    server.close()
  } catch (error) {
    server.close();
    console.error(error.toString());
    process.exit(1);
  }
});
