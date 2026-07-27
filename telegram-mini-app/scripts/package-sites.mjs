import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, relative, sep } from 'node:path';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'server' || entry.name === '.openai') continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }
  return files;
}

const assets = [];
for (const file of await collectFiles('dist')) {
  const route = `/${relative('dist', file).split(sep).join('/')}`;
  const body = (await readFile(file)).toString('base64');
  assets.push([route, [body, contentTypes[extname(file).toLowerCase()] || 'application/octet-stream']]);
}

await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
const workerTemplate = await readFile('server/worker-template.js', 'utf8');
await writeFile(
  'dist/server/index.js',
  workerTemplate.replace('globalThis.__TANKUA_ASSET_MANIFEST__ || []', JSON.stringify(assets)),
);

await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
