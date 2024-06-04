import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '../package.json');
const { version } = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

await fs.writeFile(
  './lib/version.js',
  `/** Version of SVGO. */\nexport const VERSION = '${version}';\n`,
);
