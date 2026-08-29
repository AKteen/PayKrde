import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(apiRoot, '..', '..');

const shared = {
  entryPoints: [join(apiRoot, 'src/vercel-entry.ts')],
  absWorkingDir: apiRoot,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  legalComments: 'none',
  logLevel: 'info',
  footer: {
    js: 'module.exports = module.exports.default || module.exports;',
  },
};

const outfiles = [join(repoRoot, 'api', '_app.cjs'), join(apiRoot, 'api', '_app.cjs')];

await Promise.all(outfiles.map((outfile) => build({ ...shared, outfile })));
