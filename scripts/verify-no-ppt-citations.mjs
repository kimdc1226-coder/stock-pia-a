import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// 공개되는 모든 HTML 페이지(홈, 하위 페이지, 404)와 공통 스크립트·스타일·데이터를 검사한다.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const publicHtml = walk(path.join(root, 'public'))
  .filter(file => file.endsWith('.html'))
  .map(file => path.relative(root, file).split(path.sep).join('/'))
  .sort();
assert.ok(publicHtml.length >= 8, `검사할 공개 HTML 페이지가 8개 이상이어야 한다 (현재 ${publicHtml.length})`);
const publicSources = [...publicHtml, 'public/app.js', 'public/fx.js', 'public/styles.css', 'public/data/site-content.js'];
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
