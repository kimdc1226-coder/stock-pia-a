import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = path.join(root, 'public');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = JSON.parse(read('data/ppt-extracted.json'));

/* 브라우저와 같은 전역 동작으로 데이터 파일을 실행한다.
   브라우저에서는 window가 전역 객체 자신이라서 `window.SITE_CONTENT = {...}` 뒤에 `SITE_CONTENT.nav = ...`처럼
   전역 이름으로 접근하는 코드가 동작한다. 검증 환경도 window === 전역 객체로 맞춘다. */
const context = {};
context.window = context;
vm.createContext(context);
vm.runInContext(read('public/data/site-content.js'), context);
const content = context.window.SITE_CONTENT;
assert.ok(content && content.nav && content.cards, 'SITE_CONTENT(nav, cards 포함)가 로드되어야 한다');

/* ---------- 원본 PPT 보존 및 수치 검증 (이번 변경과 무관하므로 유지) ---------- */
assert.equal(source.slideCount, 22);
assert.equal(source.media.length, 23);
assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, source.source))).digest('hex').toUpperCase(), source.sha256, 'Original PPT is unchanged');
const table = source.slides[17].shapes.flatMap(shape => shape.tables)[0];
const rawRows = table.rows.slice(2);
for (let i = 0; i < 4; i++) {
  const rawNumbers = rawRows[i].slice(2, 5).map(value => Number(value.replaceAll(',', '').trim()));
  assert.deepEqual([...content.portfolio[i].aum], rawNumbers, `Portfolio row ${i + 1} must match original`);
  assert.equal(content.portfolio[i].irr.replace(/\s/g, ''), rawRows[i][5].replace(/\s/g, ''));
}
const sums = [0, 1, 2].map(i => content.portfolio.reduce((sum, row) => sum + row.aum[i], 0));
assert.deepEqual(sums, [6000, 10000, 16000]);
assert.equal(content.strategies.length, 4);
for (const media of source.media) assert.ok(fs.existsSync(path.join(root, media.path)), media.path);

/* ---------- 멀티페이지 구조 검사: public/ 아래 모든 HTML ---------- */
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const pageFiles = walk(pub).filter(file => file.endsWith('.html')).sort();
const urlOf = file => '/' + path.relative(pub, file).split(path.sep).join('/').replace(/index\.html$/, '');
const pages = pageFiles.map(file => ({ file, url: urlOf(file), html: fs.readFileSync(file, 'utf8') }));
assert.ok(pages.length >= 8, `HTML 페이지가 8개 이상이어야 한다 (현재 ${pages.length})`);

// 브라우저에서 app.js가 만드는 앵커 id (정적 HTML에는 없음)
const generatedIds = [
  ...content.strategies.map(s => `strategy-${s.id}`),
  ...content.pefThemes.map(t => `pef-${t.id}`)
];
const staticIds = new Map(pages.map(p => [p.url, new Set([...p.html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))]));
const pageByUrl = new Map(pages.map(p => [p.url, p]));
// /disclosure/#management 같은 주소는 앵커가 아니라 공시 필터 이름이다 (app.js의 applyDisclosureHash가 해당 필터를 적용)
const disclosureFilters = [...pageByUrl.get('/disclosure/').html.matchAll(/data-filter="([a-z]+)"/g)].map(m => m[1]);
assert.ok(['management', 'fund', 'research'].every(key => disclosureFilters.includes(key)), '공시 필터(management, fund, research)가 있어야 한다');
for (const key of disclosureFilters) staticIds.get('/disclosure/').add(key);

const resolvePage = href => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  const candidate = clean.endsWith('/') ? clean : clean + '/';
  if (pageByUrl.has(candidate)) return candidate;
  return pageByUrl.has(clean) ? clean : null;
};
const assertLocalFile = (href, where) => {
  const clean = href.split('#')[0].split('?')[0];
  if (clean.endsWith('/') || clean.endsWith('.html')) {
    assert.ok(resolvePage(href) || fs.existsSync(path.join(pub, clean)), `${where}: 페이지가 없음 ${href}`);
  } else {
    assert.ok(fs.existsSync(path.join(pub, clean)), `${where}: 파일이 없음 ${href}`);
  }
};
const assertAnchor = (href, where, currentUrl) => {
  const hash = href.includes('#') ? href.split('#')[1] : '';
  if (!hash) return;
  const target = href.startsWith('#') ? currentUrl : resolvePage(href);
  const known = target ? staticIds.get(target) : null;
  assert.ok(known && (known.has(hash) || generatedIds.includes(hash)), `${where}: 앵커가 없음 ${href}`);
};

for (const page of pages) {
  const where = page.url;
  const html = page.html;
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${where}: id가 중복됨`);
  assert.ok(!html.includes('data-source-slides'), `${where}: Source slide metadata must not be rendered`);
  assert.ok(!html.includes('10,500') && !html.includes('500억 원 차이'), `${where}: No incorrect discrepancy warning`);
  assert.ok(/<meta name="robots" content="noindex, nofollow">/.test(html), `${where}: 출시 전이므로 noindex가 있어야 한다`);
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), `${where}: 인라인 스크립트는 CSP(script-src 'self')에 막힌다`);
  assert.ok(!/<(?:img|source|video)\b[^>]*(?:src|poster)="https?:/.test(html), `${where}: 외부 이미지·영상 주소 금지(CSP)`);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  assert.ok(title.includes('그랑스톤 자산운용'), `${where}: 제목에 공식 한글명이 있어야 한다 (${title})`);
  // 공유용 메타: og:url은 페이지 주소와 같고 이미지는 실제 파일
  const ogUrl = (html.match(/property="og:url" content="([^"]+)"/) || [])[1];
  assert.equal(ogUrl, `https://www.grandstone-am.com${page.url}`, `${where}: og:url`);
  for (const key of ['property="og:image"', 'name="twitter:image"']) {
    const value = (html.match(new RegExp(`${key} content="([^"]+)"`)) || [])[1];
    assert.ok(value && value.startsWith('https://www.grandstone-am.com/assets/'), `${where}: ${key} 주소`);
    assert.ok(fs.existsSync(path.join(pub, value.replace('https://www.grandstone-am.com', ''))), `${where}: ${key} 파일이 없음 ${value}`);
  }
  // 같은 페이지 앵커, 내부 링크와 앵커, 로컬 자산 경로
  for (const m of html.matchAll(/\b(?:href|src|poster|data-fallback)="([^"]*)"/g)) {
    const value = m[1];
    if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(value)) continue;
    if (value.startsWith('#')) { assertAnchor(value, where, page.url); continue; }
    assert.ok(value.startsWith('/'), `${where}: 상대 경로는 하위 폴더 페이지에서 깨진다 → ${value}`);
    assertLocalFile(value, where);
    assertAnchor(value, where, page.url);
  }
}

/* ---------- 필수 파일, 데이터·스크립트가 참조하는 자산, 메뉴 링크 ---------- */
for (const file of [
  'public/styles.css', 'public/app.js', 'public/fx.js', 'public/data/site-content.js', 'public/_headers',
  'public/assets/images/hero.jpg', 'public/assets/images/esg.jpg',
  'public/assets/logo-grandstone.png', 'public/assets/logo-grandstone-sm.png',
  'public/assets/favicon-32.png', 'public/assets/favicon-192.png', 'public/assets/apple-touch-icon.png', 'public/favicon.ico',
  'public/assets/og-image-grandstone.png'
]) assert.ok(fs.existsSync(path.join(root, file)), file);
for (const file of ['public/app.js', 'public/data/site-content.js', 'public/styles.css']) {
  for (const m of read(file).matchAll(/['"`(](\/assets\/[^'"`)\s?#]+)/g)) assert.ok(fs.existsSync(path.join(pub, m[1])), `${file}가 참조하는 자산이 없음: ${m[1]}`);
}
for (const item of content.nav) {
  assertLocalFile(item.href, `nav ${item.label}`);
  for (const [label, href] of item.children || []) { assertLocalFile(href, `nav ${item.label} > ${label}`); assertAnchor(href, `nav ${item.label} > ${label}`, null); }
}

/* ---------- 이번에 승인된 변경 내용 (원본 PPT와 달라지는 것이 정상) ---------- */
const appJs = read('public/app.js');
const siteData = read('public/data/site-content.js');
const publicText = pages.map(p => p.html).join('\n') + '\n' + appJs + '\n' + siteData;
// 1. 사명: 공식 한글명은 '그랑스톤 자산운용', 옛 사명과 '그랜드스톤'은 화면에 없어야 한다
assert.ok(!/stock[\s\-_.]*pia|스톡\s*피아|stockpia/i.test(publicText), '옛 사명(STOCK PIA)이 남아 있음');
assert.ok(!publicText.includes('그랜드스톤'), "공식 한글명은 '그랑스톤'이다");
assert.ok(appJs.includes('alt="그랑스톤 자산운용"') && appJs.includes('/assets/logo-grandstone-sm.png'), '헤더·푸터 공통 로고(GS 골드)가 적용되어야 한다');
assert.ok(!/brand-symbol|brand-type/.test(appJs), '옛 파란 막대 로고가 남아 있음');
// 2. 펀드명·투자 형태
const aiTheme = content.pefThemes.find(theme => theme.id === 'ai');
assert.equal(aiTheme.funds[1].name, 'Physical AI Tech 펀드');
assert.deepEqual([...aiTheme.funds[1].types], ['RCPS', 'Equity', 'Mezzanine']);
assert.ok(!publicText.includes('AI 테크 펀드'), '옛 펀드명이 남아 있음');
// 3. 조직도: 새 구조 10개 조직이 순서대로, 이미지가 아니라 HTML로
const about = pageByUrl.get('/about/').html;
const org = about.slice(about.indexOf('class="og"'), about.indexOf('class="og-legend"'));
assert.ok(org.length > 0 && !/<img\b/.test(org), '조직도는 이미지가 아니라 HTML이어야 한다');
let cursor = 0;
for (const name of ['이사회', '리스크관리위원회', '감사', '대표이사', '투자심의위원회', '준법감시인', '투자운용본부', 'T.I 투자부문', '주식·채권·메자닌', '대체투자부문', '에너지·AI·부동산', '경영관리본부', '경영지원부문', '기획관리·회계', '마케팅부문', '투자유치·금융주선']) {
  const at = org.indexOf(name, cursor);
  assert.ok(at >= 0, `조직도에 '${name}'가 순서대로 있어야 한다`);
  cursor = at;
}
for (const gone of ['PE 운용부문', 'Multi Asset 투자부문', '부동산 / 인프라 투자부문', '금융주선선']) assert.ok(!about.includes(gone), `옛 조직도 항목이 남아 있음: ${gone}`);
// 4. 대표자와 연락처
assert.ok(about.includes('김복기 대표이사'), '대표이사 성명이 반영되어야 한다');
const contactPage = pageByUrl.get('/contact/').html;
for (const link of ['tel:0234541202', 'tel:01077445547', 'mailto:kbk3333@gmail.com']) {
  assert.ok(contactPage.includes(link) && appJs.includes(link), `연락처 링크가 Contact 페이지와 문의 팝업에 있어야 한다: ${link}`);
}
for (const text of ['02-3454-1202', '010-7744-5547', 'kbk3333@gmail.com', '서울시 강남구 테헤란로 27길 8', '엠타워 13층']) assert.ok(contactPage.includes(text), `Contact에 ${text}가 있어야 한다`);
for (const gone of ['02-000-', 'ir@grandstone-am.com', '임시값', '사용 여부 확인 중', '층수 및 주소 확인 필요', 'IR 직통 준비 중', '대표전화 준비 중']) {
  assert.ok(!contactPage.includes(gone) && !appJs.includes(gone), `확정된 연락처에 옛 임시 문구가 남아 있음: ${gone}`);
}
// 5. 아직 확정되지 않은 법인 정보는 확정된 것처럼 표시하지 않는다
assert.ok(appJs.includes('대표자: 김복기') && appJs.includes('법인명·사업자등록번호: 확인 필요') && appJs.includes('금융투자업 등록정보: 확인 필요'), '미확정 법인정보는 확인 필요로 유지되어야 한다');

const paragraphs = source.slides.flatMap(slide => slide.shapes.filter(shape => !shape.tables.length).flatMap(shape => shape.paragraphs.filter(text => text.trim())));
const cells = source.slides.flatMap(slide => slide.shapes.flatMap(shape => shape.tables.flatMap(table => table.rows.flat())));
console.log(JSON.stringify({ result: 'PASS', pages: pages.map(p => p.url), slides: source.slideCount, sourceParagraphs: paragraphs.length, tableCells: cells.length, images: source.media.length, sourceHash: source.sha256, portfolioSums: sums, links: 'valid', approvedChanges: 'verified', originalPpt: 'unchanged' }, null, 2));
