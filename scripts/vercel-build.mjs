import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (result.status) process.exit(result.status ?? 1);
}

run(process.execPath, [join(root, 'apps/api/scripts/bundle-vercel.mjs')], root);
run('npm', ['run', 'build', '--prefix', join(root, 'packages/shared')], root);

const vite = [
  join(root, 'apps/web/node_modules/vite/bin/vite.js'),
  join(root, 'node_modules/vite/bin/vite.js'),
].find(existsSync);

if (!vite) {
  console.error('vite not found. Run npm install from the repo root.');
  process.exit(1);
}

run(process.execPath, [vite, 'build'], join(root, 'apps/web'));
