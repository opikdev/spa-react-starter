import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const initialScripts = [...html.matchAll(/(?:src|href)="\/([^"]+\.js)"/g)].map(
  (match) => `dist/${match[1]}`,
);

export default [
  { name: 'Initial JavaScript', path: initialScripts, gzip: true, limit: '144 kB' },
  { name: 'CSS', path: 'dist/assets/*.css', gzip: true, limit: '8 kB' },
];
