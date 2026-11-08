import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = path.join(root, 'public');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
// 원본 PPT와 추출 자료는 저장소에 없는 로컬 전용 자료다. 없으면 준비 절차를 안내하고 끝낸다(README 5절).
const PPT_NAME = 'STOCK PIA자산운용사.pptx';
const missing = [PPT_NAME, 'data/ppt-extracted.json', 'assets/ppt'].filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`npm run check에 필요한 로컬 전용 자료가 없습니다: ${missing.join(', ')}\n준비 절차(README 5절):\n  1) 원본 '${PPT_NAME}'을 프로젝트 담당자에게 받아 프로젝트 루트에 저장\n  2) powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\extract-ppt.ps1 -Source ".\\${PPT_NAME}"\n  3) data\\ppt-extracted.json과 assets\\ppt\\ 이미지 23개 생성 확인 후 다시 실행`);
  process.exit(1);
}
const source = JSON.parse(read('data/ppt-extracted.json'));
assert.equal(source.source, PPT_NAME, `data/ppt-extracted.json은 원본 '${PPT_NAME}'에서 추출해야 한다(다른 PPT를 추출함: ${source.source}). README 5절의 재추출 명령으로 다시 추출`);

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
// 자산군별 표는 2026-11 수정요청으로 화면에서 삭제했다. 남은 연도별 AUM 그래프와 메인 수치가 PPT 표 합계와 같은지 검사한다.
const table = source.slides[17].shapes.flatMap(shape => shape.tables)[0];
const rawRows = table.rows.slice(2, 6);
const sums = [0, 1, 2].map(i => rawRows.reduce((sum, row) => sum + Number(row[2 + i].replaceAll(',', '').trim()), 0));
assert.deepEqual(sums, [6000, 10000, 16000], 'PPT 자산군별 AUM 합계(2027~2029)');
assert.ok(!('portfolio' in content), '삭제된 포트폴리오 표 데이터가 남아 있음');
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
  assert.equal((html.match(/property="og:site_name" content="([^"]+)"/) || [])[1], 'GRANDSTONE', `${where}: og:site_name은 영문 브랜드명 GRANDSTONE이어야 한다`);
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
// 영문 표기: 브랜드명 GRANDSTONE, 전체명 GRANDSTONE ASSET MANAGEMENT (로고·명함과 동일, 띄어쓴 'GRAND STONE'은 쓰지 않는다)
assert.ok(!/GRAND\s+STONE/i.test(publicText), "영문 브랜드명은 GRANDSTONE(붙여쓰기)이다");
assert.ok(appJs.includes('© 2026 GRANDSTONE ASSET MANAGEMENT.'), '푸터 카피라이트의 영문 전체명');
assert.ok(appJs.includes("openDialog('GRANDSTONE / INFORMATION'"), '팝업 상단의 영문 브랜드명');
assert.ok(pageByUrl.get('/').html.includes('<i></i>GRANDSTONE</span>'), '핵심 가치 그림 가운데의 영문 브랜드명');
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
// 4. 대표자와 연락처 (2026-11 수정: 문의 이메일·대표이사 직통 삭제, 대표전화 02-3454-1201)
assert.ok(about.includes('대표이사 <strong>김복기</strong>'), '대표이사 성명이 반영되어야 한다');
const contactPage = pageByUrl.get('/contact/').html;
assert.ok(contactPage.includes('tel:0234541201') && appJs.includes('tel:0234541201'), '새 대표전화 링크가 Contact 페이지와 문의 팝업에 있어야 한다');
for (const text of ['02-3454-1201', '서울시 강남구 테헤란로 27길 8', '엠타워 13층', 'www.grandstone-am.com']) assert.ok(contactPage.includes(text), `Contact에 ${text}가 있어야 한다`);
// 삭제한 개인 연락처는 공개 저장소에 다시 적지 않도록 값 대신 형식으로 막는다: 휴대전화 번호·이메일 주소·mailto, 대표전화 외 번호
assert.ok(!/\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b|tel:01[016789]/.test(publicText), '공개 페이지에 휴대전화 번호가 있음');
assert.ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(publicText), '공개 페이지에 이메일 주소가 있음');
assert.deepEqual([...new Set([...publicText.matchAll(/tel:(\d+)/g)].map(m => m[1]))], ['0234541201'], '전화 링크는 대표전화 하나');
assert.deepEqual([...new Set(publicText.match(/\b02-\d{3,4}-\d{4}\b/g))], ['02-3454-1201'], '표시되는 전화번호는 대표전화 하나');
for (const gone of ['mailto:', 'CEO DIRECT', '대표이사 직통', '문의 이메일', '02-000-', 'ir@grandstone-am.com', '임시값', '사용 여부 확인 중', '층수 및 주소 확인 필요', 'IR 직통 준비 중', '대표전화 준비 중']) {
  assert.ok(!publicText.includes(gone), `공개 페이지에 삭제된 연락처·옛 임시 문구가 남아 있음: ${gone}`);
}
// 5. 푸터 회사 정보 (확정값) — 준법감시인 심사필 항목은 삭제, 승인번호를 만들어 넣지 않는다
for (const text of ['그랑스톤 자산운용', '대표자: 김복기', '사업자등록번호: 374-88-02362', '금융투자업 등록정보: 일반 사모집합투자업 (2022-08-29)']) assert.ok(appJs.includes(text), `푸터 회사 정보: ${text}`);
for (const gone of ['법인명·사업자등록번호: 확인 필요', '금융투자업 등록정보: 확인 필요', '준법감시인 심사필', '승인번호 및 유효기간']) assert.ok(!appJs.includes(gone), `푸터 임시 안내가 남아 있음: ${gone}`);
// 6. 푸터 정책 메뉴는 2개(준비 안내 유지), 검토용 표기·이미지 출처 UI 삭제
const footerLinks = (appJs.match(/<div class="footer-links">(.*?)<\/div>/) || [])[1] || '';
assert.deepEqual([...footerLinks.matchAll(/data-info="([a-z]+)">([^<]+)</g)].map(m => `${m[1]}:${m[2]}`), ['privacy:개인정보처리방침', 'consumer:금융소비자보호'], '푸터 정책 메뉴는 개인정보처리방침·금융소비자보호 2개');
assert.ok(appJs.includes("privacy: ['개인정보처리방침'") && appJs.includes("consumer: ['금융소비자보호'"), '정책 메뉴 2개의 준비 안내가 있어야 한다');
for (const gone of ['이용약관', '스튜어드십', 'data-info="credits"', 'credits:', '이미지 출처', '검토용 프로토타입', '검토용 초안', 'Pexels License']) assert.ok(!publicText.includes(gone), `삭제 대상이 남아 있음: ${gone}`);
assert.ok(appJs.includes('<strong>투자유의사항</strong>') && appJs.includes('투자에는 원금 손실 가능성이 있습니다.'), '투자유의사항 제목·본문 유지');
assert.ok(!/href="[^"]*\.pdf"/.test(publicText), '확인된 정책·공시 PDF가 제공되기 전에는 PDF 링크를 만들지 않는다');
// 7. 핵심 가치 영어: 동반 성장 = Accompany (일반 '파트너십' 표현은 그대로 둔다)
const home = pageByUrl.get('/').html;
assert.equal((home.match(/<b>동반 성장<\/b><small>Accompany<\/small>/g) || []).length, 2, '메인 벤 다이어그램·목록의 Accompany');
assert.ok(about.includes('<h3>동반 성장</h3><span class="english">Accompany</span>'), '회사소개 핵심 가치의 Accompany');
assert.ok(!/(?:<small>|class="english">)Partnership</.test(publicText), '핵심 가치에 Partnership이 남아 있음');
for (const word of ['Professionalism', 'Integrity']) assert.ok(home.includes(word) && about.includes(word), `${word} 유지`);
assert.ok(home.includes('파트너십의 시작'), '일반 파트너십 표현은 유지');
// 8. 메인 핵심 지표
assert.ok(!home.includes('목표는 실적과 다릅니다') && !home.includes('미달성 목표'), '메인 핵심 지표의 삭제 문구');
assert.ok(home.includes('<p class="hl-note">달성 목표</p>'), "2029 AUM 목표 아래 '달성 목표'");
assert.deepEqual([...home.matchAll(/<ul class="hl-sublist"[^>]*>(.*?)<\/ul>/g)].flatMap(m => [...m[1].matchAll(/<li>([^<]+)<\/li>/g)].map(x => x[1].replace('&amp;', '&'))), ['바이아웃 & 성장자본', '부동산 & 인프라', '사모채권 & 메자닌', '스페셜 시츄에이션'], "'4가지' 옆 4대 전략 목록");
assert.ok(home.includes('2027 AUM 목표</span><strong class="hl-num"><span data-count="6000">6,000</span><small>억 원</small>') && home.includes('2029 AUM 목표</span><strong class="hl-num"><span data-count="1.6" data-dec="1">1.6</span><small>조 원</small>'), '메인 AUM 수치·연도 유지(PPT 합계 6,000억·1.6조)');
// 9. 연혁 일부 삭제, CEO 인사말 (경영진 카드·임시 인물 삭제, #leadership 주소 유지)
assert.ok(about.includes('<h4>자산운용사 설립</h4></li>') && !about.includes('이룸 사모자산운용'), "2022 '자산운용사 설립' 유지, 설립 등록 문구 삭제");
assert.ok(!about.includes('공식 법인명, 등록 내역'), '연혁 하단 확인 안내 삭제');
assert.ok(/<section[^>]+id="leadership"[^>]*>[\s\S]*?<h2 id="leadership-title">CEO 인사말<\/h2>/.test(about), '#leadership 자리에 CEO 인사말');
for (const text of ['새로운 도약과 신뢰를 향한 약속', '존경하는 투자자, 고객, 그리고 금융 파트너 여러분, 안녕하십니까?', '새롭게 출발하는 그랑스톤자산운용의 대표이사 김복기입니다.', '사모 대체투자 시장의 새로운 표준을 제시하고자 힘찬 첫걸음을 내딛습니다.', '최선을 다할 것을 약속드리겠습니다.', '그랑스톤자산운용 대표이사 <strong>김복기</strong>']) assert.ok(about.includes(text), `CEO 인사말: ${text}`);
// 2026-11 결정: CEO 사진 없이 인사말만 구성 — 사진 영역(자리표시·장식 K·사진 아래 중복 소개) 제거, 인사말·서명·앵커는 보존
{
  const ceoCss = read('public/styles.css');
  const leadership = (about.match(/<section[^>]+id="leadership"[\s\S]*?<\/section>/) || [''])[0];
  assert.ok(leadership.includes('<p class="ceo-sign">그랑스톤자산운용 대표이사 <strong>김복기</strong></p>'), 'CEO 인사말 하단 서명 유지');
  for (const gone of ['portrait-placeholder', 'ceo-photo', '<figure', '<figcaption', '<img', '대표이사 사진', '김복기 대표이사', '>K<']) assert.ok(!leadership.includes(gone), `CEO 인사말 영역에 사진 관련 요소가 남아 있음: ${gone}`);
  assert.ok(!about.includes('portrait-placeholder') && !ceoCss.includes('portrait-placeholder') && !ceoCss.includes('.ceo-photo'), '사진 자리표시·ceo-photo 스타일이 남아 있지 않아야 한다');
  assert.ok(/\.ceo\{[^}]*max-width:\d+px[^}]*margin-inline:auto/.test(ceoCss) && !/\.ceo\{[^}]*grid-template-columns/.test(ceoCss), 'CEO 인사말은 1열·가운데 배치·최대 너비 제한');
  assert.ok(/#leadership \.section-heading\{[^}]*max-width:780px[^}]*margin-inline:auto/.test(ceoCss), 'CEO 인사말 제목 영역도 본문과 같은 최대 너비·가운데 배치(#leadership 안으로 한정)');
}
for (const gone of ['전문성으로 연결된 팀', 'people-grid', 'OOO', 'OO자산운용', 'OO회계법인', '성명 확인 중', '경력 확인 중', 'PROFILE IMAGE NEEDED']) assert.ok(!about.includes(gone), `삭제된 경영진 카드·임시 인물 정보가 남아 있음: ${gone}`);
assert.ok(content.nav.find(item => item.id === 'about').children.some(([label, href]) => label === 'CEO 인사말' && href === '/about/#leadership'), "메뉴 'CEO 인사말' → /about/#leadership");
// 10. 투자철학·운용전략 문구
assert.ok(pageByUrl.get('/philosophy/').html.includes('<p>1차 리스크 요인 검토 및 가이드라인 파악</p>') && !publicText.includes('독립 리스크팀'), '딜 발굴 및 사전 심사 문구');
const realestate = content.strategies.find(s => s.id === 'realestate');
assert.ok(realestate.details.some(([title, text]) => title === '배당 현금흐름' && text.startsWith('배당수익률: 연 6~8% 수준.')) && !siteData.includes('제시 배당 수익률'), '배당수익률 문구');
const strategyPage = pageByUrl.get('/strategy/').html;
assert.ok(strategyPage.includes('<h4>글로벌 대체투자 확대</h4><p>글로벌 대체 투자를 넓혀 안정적인 수익을 전합니다.</p>') && !strategyPage.includes('글로벌 판로 개척'), 'Value-Up 세 번째 항목');
// 11. PEF AI 테마: Physical AI (테마 id·주소 유지, 하위 펀드 유지)
assert.equal(aiTheme.title, 'Physical AI 파워 인프라');
assert.equal(aiTheme.subtitle, 'Physical AI & POWER INFRASTRUCTURE');
assert.equal(aiTheme.summary, '차세대 데이터센터(IDC), Physical AI, 스마트 AI 물류 인프라 조성');
assert.equal(content.cards.ai.title, 'Physical AI 파워 인프라');
assert.equal(content.cards.ai.text.replace('\n', ' '), aiTheme.summary);
assert.deepEqual([...aiTheme.funds.map(f => f.name)], ['OO IDC센터 펀드', 'Physical AI Tech 펀드', 'AI 디지털 솔루션 펀드'], 'AI 테마 하위 펀드 3개 유지');
assert.ok(!/Physhical|반도체 소부장|'AI 파워 인프라'/.test(publicText), '옛 AI 테마 표기·오타가 남아 있음');
// 12. PEF 예상 포트폴리오 표 삭제, 연도별 AUM 그래프 유지
const fund = pageByUrl.get('/fund/').html;
for (const gone of ['portfolio-body', 'portfolio-filters', 'portfolio-total', 'portfolio-status', 'table-hint', 'data-table', '자산군별 예상 포트폴리오', '목표 IRR', 'actual-data', '자료 준비 중', '검증된 트랙레코드']) assert.ok(!fund.includes(gone), `/fund/에 삭제 대상이 남아 있음: ${gone}`);
assert.ok(!/portfolio-body|portfolio-filters|table-scroll/.test(appJs + read('public/fx.js')), '삭제된 표를 찾는 스크립트가 남아 있음');
const bars = [...fund.matchAll(/<i data-count="([\d.]+)" data-dec="1">/g)].map(m => Math.round(Number(m[1]) * 10000));
assert.deepEqual(bars, sums, '연도별 AUM 그래프(0.6·1.0·1.6조)가 PPT 합계와 같아야 한다');
assert.ok(/id="portfolio"/.test(fund) && content.nav.find(item => item.id === 'fund').children.some(([label, href]) => label === 'AUM 성장 목표' && href === '/fund/#portfolio'), "메뉴 'AUM 성장 목표' → /fund/#portfolio");
// 13. 공시: 실제 자료(disclosures)가 없으면 준비 중 예시 3개(disclosureSamples)를 '자료 준비 중'으로 표시 (2026-11-07 요청으로 복원)
assert.ok(!publicText.includes('구성 예시') && !publicText.includes('플레이스홀더'), "삭제한 '구성 예시' 안내 문장이 다시 들어감");
assert.deepEqual([...content.disclosureSamples.map(item => `${item.category}|${item.label}|${item.title}`)], ['management|경영공시|영업보고서 및 결산 공고', 'fund|펀드공시|펀드 운용보고서 및 수시 공시', 'research|리서치|시장 전망 및 투자 인사이트'], '공시 준비 중 예시 3개');
for (const item of content.disclosureSamples) assert.ok(!('date' in item) && !('file' in item), `예시에는 게시일·파일을 넣지 않는다: ${item.title}`);
assert.ok(appJs.includes('const disclosureSamplesOnly = !content.disclosures.length;') && appJs.includes('disclosureSamplesOnly ? content.disclosureSamples || [] : content.disclosures'), '실제 자료가 등록되면 예시는 표시하지 않는다(중복 금지)');
assert.ok(appJs.includes('<span class="disclosure-status">자료 준비 중</span>') && appJs.includes('자료 준비 중입니다. 현재 등록된 공시 문서나 다운로드 파일은 없습니다.'), "예시 행의 '자료 준비 중' 표시와 클릭 안내");
assert.ok(appJs.includes('등록된 공시자료가 없습니다.'), '공시 빈 상태 문구');
for (const item of content.disclosures) {
  assert.ok(['management', 'fund', 'research'].includes(item.category) && item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.date || ''), `공시 항목 형식: ${item.title}`);
  if (item.file) assert.ok(fs.existsSync(path.join(pub, item.file)), `공시 첨부파일이 없음: ${item.file}`);
}
// 13-1. 줄바꿈: 함께 읽혀야 하는 표현만 묶고(.nb), PC용 강제 줄바꿈은 desktop-only로 모바일에서 해제
const css = read('public/styles.css');
assert.ok(/\.nb\{white-space:nowrap\}/.test(css) && /br\.desktop-only\{display:none\}/.test(css) && /min-width:961px\)\{br\.desktop-only\{display:inline\}/.test(css), '줄바꿈 CSS(.nb, br.desktop-only)');
assert.ok(!/(?:^|\})\s*(?:p|main|body|li|dd)\s*\{[^}]*white-space:\s*nowrap/m.test(css), '문단 전체에 white-space: nowrap을 적용하지 않는다');
assert.equal((contactPage.match(/<span class="nb">공동 투자\(Co-investment\)<\/span>/g) || []).length, 2, 'Contact 상단·본문의 공동 투자(Co-investment) 묶음');
assert.ok(contactPage.includes('<br class="desktop-only"> <span class="nb">공동 투자(Co-investment)</span>') && home.includes('<br class="desktop-only"> <span class="nb">공동 투자(Co-investment)</span>'), '문의 문구의 PC용 줄바꿈은 desktop-only, Co-investment 묶음');
assert.ok(!/프로젝트 펀드 조성,<br>/.test(contactPage + home), '문의 문구에 모바일에서도 강제되는 br이 남아 있음');
assert.ok(pageByUrl.get('/philosophy/').html.includes('<span class="nb">검토 및 결정</span>'), "'검토 및 결정' 묶음");
for (const phrase of ['Co-investment', '구조화 투자', 'Physical AI']) assert.ok(appJs.includes(phrase), `app.js KEEP 표현: ${phrase}`);
// 14. 메인 사칭 금융사기 주의 팝업 (HTML 텍스트, 오늘 하루 보지 않기, CSP를 지키는 외부 스크립트로 동작)
const notice = (home.match(/<dialog class="scam-notice"[\s\S]*?<\/dialog>/) || [])[0] || '';
assert.ok(notice.includes('id="scam-notice"') && !/<img\b/.test(notice), '사칭 주의 팝업은 이미지가 아니라 HTML 텍스트');
for (const text of ['당사 사칭 금융사기 주의 안내', '최근 당사 명칭·로고·임직원 정보 등을 도용하여 투자 권유, 해외펀드 가입, 비공개 상품 제공 등을 빙자한 사칭 금융사기 사례가 발생하고 있습니다.', '당사는 일반 개인에게 투자 권유를 하지 않으며', '<strong class="sn-alert">카카오톡·SNS 등 비공식 채널을 통한 상담·링크전송·입금 요청을 절대 하지 않습니다.</strong>', '또한 개인·제3자 명의 계좌로 투자금을 받지 않습니다.', '위 행위는 모두 당사와 무관하오니 각별히 주의하시기 바랍니다.', '불법 금융 신고', '금융감독원(www.fss.or.kr)', '경찰청 112', 'id="scam-notice-today"', '오늘 하루 보지 않기', 'id="scam-notice-close"']) assert.ok(notice.includes(text), `사칭 주의 팝업: ${text}`);
assert.ok(!/\son[a-z]+=/i.test(notice), '팝업에 인라인 이벤트 속성 금지(CSP)');
assert.ok(appJs.includes("timeZone: 'Asia/Seoul'") && /try \{ return window\.localStorage\.getItem/.test(appJs) && /try \{ window\.localStorage\.setItem/.test(appJs), '팝업 숨김은 한국시간 날짜 기준, 저장소 접근 실패에도 동작');
for (const page of pages.filter(p => p.url !== '/')) assert.ok(!page.html.includes('scam-notice'), `${page.url}: 사칭 주의 팝업은 메인에만 표시`);
// 15. 없는 주소: Cloudflare가 public/404.html을 HTTP 404로 제공 (로컬 서버 두 곳도 같은 규칙 사용)
const wrangler = JSON.parse(read('wrangler.jsonc').split(/\r?\n/).filter(line => !/^\s*\/\//.test(line)).join('\n'));
assert.equal(wrangler.assets.directory, './public', '배포 대상은 public/ 폴더');
assert.equal(wrangler.assets.not_found_handling, '404-page', 'wrangler.jsonc assets.not_found_handling = "404-page"');
assert.ok(fs.existsSync(path.join(pub, '404.html')) && pageByUrl.get('/404.html').html.includes('<body data-page="404">'), 'public/404.html');
for (const href of ['href="/styles.css"', 'src="/app.js"', 'src="/data/site-content.js"', 'href="/"', 'href="/contact/"']) assert.ok(pageByUrl.get('/404.html').html.includes(href), `404.html은 하위 주소에서도 동작하도록 절대 경로 사용: ${href}`);
for (const file of ['scripts/server.mjs', 'scripts/verify-browser.mjs']) assert.ok(read(file).includes("from './not-found.mjs'"), `${file}: 운영과 같은 404 처리(not-found.mjs) 사용`);
// 16. 잘못된 해시(#% 등): URIError만 처리하고, 해시를 선택자 문자열에 넣지 않는다
assert.ok(/try \{ return decodeURIComponent\(raw\); \} catch \(error\) \{ if \(error instanceof URIError\) return raw; throw error; \}/.test(appJs), '해시 해석은 URIError만 잡는다');
assert.ok(!/decodeURIComponent\(location\.hash/.test(appJs) && !/\[data-filter="\$\{/.test(appJs), '해시를 그대로 decode하거나 선택자에 넣는 코드가 남아 있음');
// 17. 개인정보처리방침 준비 안내: 실제 구성(이미지·영상 내부 제공, 외부는 Google Fonts)과 일치
const privacyText = (appJs.match(/privacy: \['개인정보처리방침', '([^']+)'\]/) || [])[1] || '';
assert.ok(privacyText && !/Unsplash/i.test(privacyText) && privacyText.includes('Google Fonts') && privacyText.includes('고객사 확인 후 게시할 예정'), '개인정보처리방침 준비 안내 문구');
assert.ok(!/<(?:img|video|source)\b[^>]*\bsrc="(?:https?:)?\/\//.test(publicText) && !/img: '(?:https?:)?\/\//.test(siteData), '이미지·영상은 모두 사이트 내부 파일');

const paragraphs = source.slides.flatMap(slide => slide.shapes.filter(shape => !shape.tables.length).flatMap(shape => shape.paragraphs.filter(text => text.trim())));
const cells = source.slides.flatMap(slide => slide.shapes.flatMap(shape => shape.tables.flatMap(table => table.rows.flat())));
console.log(JSON.stringify({ result: 'PASS', pages: pages.map(p => p.url), slides: source.slideCount, sourceParagraphs: paragraphs.length, tableCells: cells.length, images: source.media.length, sourceHash: source.sha256, portfolioSums: sums, links: 'valid', approvedChanges: 'verified', originalPpt: 'unchanged' }, null, 2));
