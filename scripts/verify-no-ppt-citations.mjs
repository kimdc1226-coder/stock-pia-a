import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicSources = ['index.html', 'app.js', 'styles.css', 'data/site-content.js'];
const forbidden = [
  /PPT/i,
  /소개자료/,
  /원문/,
  /data-source-slides/,
  /PPT_SOURCE/,
  /slideTitles/,
  /source-credit/,
  /\bsource\s*:/,
];

const violations = [];
for (const file of publicSources) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (forbidden.some(pattern => pattern.test(line))) {
      violations.push(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
}

assert.deepEqual(
  violations,
  [],
  `PPT source/page citations or related metadata remain:\n${violations.join('\n')}`,
);

console.log(JSON.stringify({ result: 'PASS', checkedFiles: publicSources, violations: 0 }, null, 2));
