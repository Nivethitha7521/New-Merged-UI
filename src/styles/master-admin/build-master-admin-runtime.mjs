import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(here, 'masterAdmin.css');
const runtimePath = path.join(here, 'masterAdmin.runtime.css');

const manifest = await readFile(manifestPath, 'utf8');
const imports = [...manifest.matchAll(/@import\s+["']([^"']+)["'];/g)].map((m) => m[1]);

if (imports.length === 0) {
  throw new Error('No @import entries found in masterAdmin.css');
}

const parts = [];
for (const rel of imports) {
  const filePath = path.resolve(here, rel);
  parts.push(await readFile(filePath, 'utf8'));
}

await writeFile(runtimePath, parts.join(''), 'utf8');
console.log(`Generated ${runtimePath} from ${imports.length} modular CSS files.`);
