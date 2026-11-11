import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { constants, gzipSync } from 'node:zlib';

const dist = 'dist';
const compressible = /\.(?:css|html|js|json|svg|txt)$/;

for (const file of await readdir(dist, { recursive: true })) {
  if (!compressible.test(file)) continue;
  const path = join(dist, file);
  const gzipped = gzipSync(await readFile(path), { level: constants.Z_BEST_COMPRESSION });
  await writeFile(`${path}.gz`, gzipped);
}
