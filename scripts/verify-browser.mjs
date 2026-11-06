// 브라우저 동작 검사 (npm run check:browser). Chrome 또는 Edge를 헤드리스로 띄워 CDP로 제어한다. 추가 패키지 없음(Node 22+).
// - public/_headers의 CSP를 그대로 붙여 서빙해 CSP 위반도 콘솔 오류로 잡는다.
// - 메인 첫 화면이 브라우저 100%에서 한 화면에 들어오는지(1366×768, 1440×900, 1920×1080)
// - 사칭 금융사기 주의 팝업: 최초 표시, 닫기, 오늘 하루 숨김, 다음 날 재표시, 저장소 차단 시에도 정상 동작
// - 모든 페이지 × PC·태블릿·모바일: 콘솔 오류·CSP 차단·깨진 이미지·가로 넘침
// 사용: node scripts/verify-browser.mjs [스크린샷 저장 폴더(선택, public/ 밖)]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 이 검사만 Node.js 22 이상이 필요하다(내장 WebSocket·fetch 사용). npm run dev / npm run check는 기존 조건(Node 18+) 그대로.
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 22 || typeof WebSocket !== 'function') {
  console.error(`npm run check:browser에는 Node.js 22 이상이 필요합니다 (현재 ${process.version}). Chrome 또는 Edge도 설치되어 있어야 합니다.\nnpm run dev / npm run check는 현재 버전에서도 실행할 수 있습니다.`);
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = path.join(root, 'public');
const shotDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shotDir) { assert.ok(!shotDir.startsWith(pub), '스크린샷은 public/ 밖에 저장한다'); fs.mkdirSync(shotDir, { recursive: true }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 정적 서버 (실제 CSP 적용, HTTPS 전용 지시어만 제외) ---------- */
const csp = fs.readFileSync(path.join(pub, '_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/)[1].replace(/;\s*upgrade-insecure-requests/, '').trim();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.resolve(pub, '.' + p);
    if (!file.startsWith(pub)) throw 0;
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = fs.readFileSync(file);
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Security-Policy': csp };
    const range = req.headers.range && /bytes=(\d+)-(\d*)/.exec(req.headers.range);
    if (range) { const s = +range[1], e = range[2] ? +range[2] : body.length - 1; res.writeHead(206, { ...headers, 'Content-Range': `bytes ${s}-${e}/${body.length}`, 'Content-Length': e - s + 1 }); res.end(body.subarray(s, e + 1)); return; }
    res.writeHead(200, headers); res.end(body);
  } catch { res.writeHead(404, { 'Content-Security-Policy': csp }); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

/* ---------- 브라우저 + CDP ---------- */
const browser = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && fs.existsSync(p));
assert.ok(browser, 'Chrome 또는 Edge가 필요하다 (CHROME_PATH로 지정 가능)');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-check-'));
const port = 9500 + Math.floor(Math.random() * 400);
const proc = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(250); }
assert.ok(wsUrl, '브라우저 디버깅 연결 실패');
const ws = new WebSocket(wsUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map(); const listeners = new Set();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else listeners.forEach(fn => fn(m)); });
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
let issues = [];
listeners.add(m => {
  if (m.method === 'Runtime.exceptionThrown') issues.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') issues.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/fonts\.(googleapis|gstatic)\.com|ERR_ABORTED/.test(m.params.entry.text + (m.params.entry.url || ''))) issues.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
for (const d of ['Page', 'Runtime', 'Log']) await send(`${d}.enable`);
const js = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
let initScript;
const open = async (url, { width = 1440, height = 900, mobile = false, init = '', settle = 700, reduced = true } = {}) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  if (initScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  initScript = (await send('Page.addScriptToEvaluateOnNewDocument', { source: init })).identifier;
  issues = [];
  const loaded = new Promise(r => { const fn = m => { if (m.method === 'Page.loadEventFired') { listeners.delete(fn); r(); } }; listeners.add(fn); });
  await send('Page.navigate', { url: base + url });
  await Promise.race([loaded, sleep(15000)]); await sleep(settle);
};
const shot = async name => { if (!shotDir) return; const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(shotDir, name + '.png'), Buffer.from(r.data, 'base64')); };
const key = async k => { const codes = { Escape: 27, Tab: 9 }; for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: codes[k] }); await sleep(200); };
const report = [];
const ok = (cond, label, detail) => { report.push({ ok: !!cond, label, ...(detail !== undefined ? { detail } : {}) }); };
const noticeOpen = () => js(`!!document.getElementById('scam-notice')?.open`);
const KEY = 'gs-scam-notice-hidden-date';
const kstToday = `new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())`;
// 팝업을 오늘 숨긴 상태로 시작 (첫 화면·다른 페이지 검사용)
const hideToday = `try{localStorage.setItem('${KEY}', ${kstToday})}catch(e){}`;

try {
  /* ---------- 1. 사칭 주의 팝업 ---------- */
  await send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
  await open('/', { init: '' });
  ok(await noticeOpen(), '팝업: 최초 진입 시 표시');
  ok(await js(`document.activeElement?.id`) === 'scam-notice-close', '팝업: 열리면 닫기 버튼에 포커스');
  ok(await js(`getComputedStyle(document.querySelector('.sn-alert')).color`) === 'rgb(200, 30, 30)', '팝업: 카카오톡·SNS 경고 강조(빨강)');
  await shot('popup-1440x900');
  await js(`document.getElementById('scam-notice-close').click()`); await sleep(200);
  ok(!(await noticeOpen()) && !(await js(`document.body.classList.contains('modal-open')`)), '팝업: 닫기 버튼으로 닫힘(스크롤 잠금 해제)');
  await open('/');
  ok(await noticeOpen(), '팝업: 체크하지 않고 닫으면 다음 진입 시 다시 표시');
  await key('Escape');
  ok(!(await noticeOpen()), '팝업: Esc로 닫힘');
  await open('/');
  await js(`document.getElementById('scam-notice-today').click(); document.getElementById('scam-notice-close').click()`); await sleep(200);
  ok(await js(`localStorage.getItem('${KEY}') === ${kstToday}`), "팝업: '오늘 하루 보지 않기' → 한국시간 오늘 날짜 저장");
  await open('/');
  ok(!(await noticeOpen()), "팝업: '오늘 하루 보지 않기' 후 같은 날 재진입 시 숨김");
  // 다음 날: 브라우저 시계를 하루(+24시간) 앞당긴다
  await open('/', { init: `(()=>{const R=Date,o=86400000;class D extends R{constructor(...a){super(...(a.length?a:[R.now()+o]))}static now(){return R.now()+o}};globalThis.Date=D})()` });
  ok(await noticeOpen(), '팝업: 다음 날(한국시간)에는 다시 표시');
  // 한국시간 경계: UTC 15:00 = KST 다음날 00:00
  ok(await js(`new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date('2026-11-06T14:59:00Z'))`) === '2026-11-06'
    && await js(`new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date('2026-11-06T15:00:00Z'))`) === '2026-11-07', '팝업: 날짜 기준은 한국시간(UTC 15:00에 날짜 변경)');
  // localStorage 접근 차단
  await open('/', { init: `Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})` });
  const blockedIssues = issues.slice();
  ok(await noticeOpen(), '팝업: 저장소 차단 시에도 표시');
  await js(`document.getElementById('scam-notice-today').click(); document.getElementById('scam-notice-close').click()`); await sleep(200);
  ok(!(await noticeOpen()) && blockedIssues.length === 0 && issues.length === 0 && await js(`!!document.querySelector('.site-header')`), '팝업: 저장소 차단 시에도 오류 없이 닫힘·사이트 정상', issues);
  // 다른 모달과 충돌 없음: 팝업을 닫은 뒤 푸터 정책 안내 열기/닫기
  await open('/', { init: '' });
  await js(`document.getElementById('scam-notice-close').click()`); await sleep(150);
  await js(`document.querySelector('[data-info="privacy"]').click()`); await sleep(250);
  const policyOpen = await js(`document.getElementById('detail-dialog').open && document.getElementById('dialog-title').textContent`);
  await key('Escape');
  ok(policyOpen === '개인정보처리방침' && !(await js(`document.getElementById('detail-dialog').open || document.body.classList.contains('modal-open')`)), '팝업: 기존 정책 모달과 충돌 없음');
  // 모바일: 처음 열릴 때 제목·첫 문장이 보이고(내부 scrollTop 0), 아래 내용·닫기 버튼은 내부 스크롤로 접근
  for (const [w, h] of [[390, 844], [320, 568]]) {
    await send('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
    await open('/', { width: w, height: h, mobile: true, init: '' });
    const first = await js(`(()=>{const d=document.getElementById('scam-notice').getBoundingClientRect(),i=document.querySelector('.sn-inner'),v=i.getBoundingClientRect();
      const inView=el=>{const r=el.getBoundingClientRect();return r.top>=Math.max(v.top,0)-1&&r.bottom<=Math.min(v.bottom,innerHeight)+1&&r.left>=v.left-1&&r.right<=v.right+1};
      return {box:{top:d.top,bottom:d.bottom,left:d.left,right:d.right},overflowY:getComputedStyle(i).overflowY,scrollTop:i.scrollTop,scrollable:i.scrollHeight>i.clientHeight,
        titleVisible:inView(document.getElementById('scam-notice-title')),firstSentenceVisible:inView(document.querySelector('.sn-body p')),focus:document.activeElement?.id}})()`);
    ok(first.box.top >= 0 && first.box.bottom <= h && first.box.left >= 0 && first.box.right <= w && first.overflowY === 'auto', `팝업: 모바일 ${w}×${h} 외곽이 화면 안에 표시`, first.box);
    ok(first.scrollTop === 0, `팝업: 모바일 ${w}×${h} 최초 표시 시 내부 scrollTop 0`, first.scrollTop);
    ok(first.titleVisible && first.firstSentenceVisible, `팝업: 모바일 ${w}×${h} 제목·첫 문장이 팝업 표시 영역 안에 보임`, first);
    ok(first.focus === 'scam-notice-close', `팝업: 모바일 ${w}×${h} 키보드 포커스는 닫기 버튼(화면 이동 없음)`, first.focus);
    await shot(`popup-mobile-${w}x${h}-first`);
    const bottom = await js(`(async()=>{const i=document.querySelector('.sn-inner');i.scrollTop=i.scrollHeight;await new Promise(r=>setTimeout(r,150));const v=i.getBoundingClientRect();
      const inView=el=>{const r=el.getBoundingClientRect();return r.top>=Math.max(v.top,0)-1&&r.bottom<=Math.min(v.bottom,innerHeight)+1};
      return {scrollTop:i.scrollTop,closeVisible:inView(document.getElementById('scam-notice-close')),todayVisible:inView(document.getElementById('scam-notice-today')),reportVisible:inView(document.querySelector('.sn-report p'))}})()`);
    ok(bottom.closeVisible && bottom.todayVisible && (bottom.reportVisible || !first.scrollable), `팝업: 모바일 ${w}×${h} 내부 스크롤로 신고 안내·오늘 하루 보지 않기·닫기 버튼 접근 가능`, bottom);
    await shot(`popup-mobile-${w}x${h}-scrolled`);
    await js(`document.getElementById('scam-notice-close').click()`); await sleep(150);
    ok(!(await noticeOpen()) && !(await js(`document.body.classList.contains('modal-open')`)), `팝업: 모바일 ${w}×${h} 닫기 후 스크롤 잠금 해제`);
  }

  /* ---------- 2. 메인 첫 화면 (브라우저 100%) ---------- */
  for (const [w, h] of [[1366, 768], [1440, 900], [1920, 1080], [1280, 720], [1024, 768], [768, 1024], [390, 844], [360, 740]]) {
    await open('/', { width: w, height: h, mobile: w < 800, init: hideToday });
    const fit = await js(`(()=>{const hb=document.getElementById('header').getBoundingClientRect().bottom;const sel=['#hero-title','.hero-description','.hero-actions .button-white','.hero-actions .button-ghost','.chip-a','.chip-b','#motion-toggle'];
      const rs=sel.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),visible:getComputedStyle(document.querySelector(s)).visibility!=='hidden'&&r.width>0}});
      const boxes=rs.filter(r=>r.s!=='#hero-title');const overlap=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)overlap.push(a.s+' × '+b.s)}
      return {hb,rs,overlap,fontSize:getComputedStyle(document.getElementById('hero-title')).fontSize}})()`);
    const out = fit.rs.filter(r => !r.visible || r.top < fit.hb - 1 || r.bottom > h || r.left < 0 || r.right > w).map(r => r.s);
    ok(out.length === 0 && fit.overlap.length === 0, `첫 화면 ${w}×${h}: 슬로건·설명·버튼 2개·칩 2개·모션 버튼이 화면 안에 겹치지 않고 표시 (h1 ${fit.fontSize})`, out.length || fit.overlap.length ? { out, overlap: fit.overlap } : undefined);
    if ([1366, 1440, 1920, 390].includes(w)) await shot(`home-first-screen-${w}x${h}`);
  }
  ok(!/zoom\s*:|transform\s*:\s*scale\(/.test(fs.readFileSync(path.join(pub, 'styles.css'), 'utf8').match(/\/\* Home hero: [\s\S]*?\/\* Home highlights/)[0]), '첫 화면 맞춤에 zoom/scale을 쓰지 않음');

  /* ---------- 3. 모든 페이지 × 화면 크기: 콘솔 오류·CSP·깨진 이미지·가로 넘침 ---------- */
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
  const urls = walk(pub).filter(f => f.endsWith('.html')).map(f => '/' + path.relative(pub, f).split(path.sep).join('/').replace(/index\.html$/, '')).sort();
  for (const url of urls) {
    for (const [w, h, mobile] of [[1440, 900, false], [1024, 768, false], [768, 1024, true], [390, 844, true], [320, 640, true]]) {
      await open(url, { width: w, height: h, mobile, init: hideToday, settle: 500 });
      const st = await js(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}scrollTo(0,0);await new Promise(r=>setTimeout(r,200));return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}})()`);
      ok(st.sw <= st.cw && st.broken.length === 0 && issues.length === 0, `${url} ${w}×${h}: 가로 넘침·깨진 이미지·콘솔 오류·CSP 차단 없음`, st.sw > st.cw || st.broken.length || issues.length ? { scrollWidth: st.sw, clientWidth: st.cw, broken: st.broken, issues } : undefined);
    }
  }
  // 줄바꿈: 함께 읽혀야 하는 표현(.nb)이 갈라지지 않고, 주요 설명문 끝에 짧은 단어 하나만 남지 않는다
  const wrapProbe = `(sel=>{const out={split:[],orphan:[]};
    for(const nb of document.querySelectorAll(sel.split(',').map(x=>x.trim()+' .nb').join(','))){const r=document.createRange();r.selectNodeContents(nb);if(new Set([...r.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top/4))).size>1)out.split.push(nb.textContent)}
    for(const el of document.querySelectorAll(sel)){if(el.offsetParent===null)continue;const toks=[];const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;
      while(n=w.nextNode()){const re=/\\S+/g;let m;while(m=re.exec(n.nodeValue)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);const rc=[...r.getClientRects()].filter(x=>x.width>0);if(rc.length)toks.push({t:m[0],top:Math.round(rc[rc.length-1].top/4)})}}
      if(!toks.length)continue;const lastTop=Math.max(...toks.map(t=>t.top)),firstTop=Math.min(...toks.map(t=>t.top));if(lastTop===firstTop)continue;
      const last=toks.filter(t=>t.top===lastTop).map(t=>t.t);if(last.length===1&&last[0].replace(/[.,·]/g,'').length<=4)out.orphan.push(el.textContent.trim().slice(0,30)+' … '+last[0])}
    return out})`;
  const wrapAreas = [['/contact/', '.page-hero p, #contact-title ~ p'], ['/', '.cta-band p, #tiles-strategy p, #tiles-pef p'], ['/fund/', '#pef-ai .pc-copy p'], ['/philosophy/', '.step-stack p'], ['/strategy/', '#strategy-buyout .pc-funds p, #value-up p']];
  for (const [w, h, mobile] of [[1440, 900, false], [1024, 768, false], [390, 844, true], [320, 640, true]]) {
    const bad = [];
    for (const [url, sel] of wrapAreas) { await open(url, { width: w, height: h, mobile, init: hideToday }); const r = await js(`${wrapProbe}(${JSON.stringify(sel)})`); bad.push(...r.split.map(x => `${url} 분리: ${x}`), ...r.orphan.map(x => `${url} 끝 단독: ${x}`)); }
    ok(bad.length === 0, `줄바꿈 ${w}×${h}: 묶음 표현 분리·설명문 끝 짧은 단독 단어 없음`, bad);
  }
  // 모바일 메뉴 열기/닫기
  await open('/about/', { width: 390, height: 844, mobile: true, init: hideToday });
  await js(`document.querySelector('.menu-toggle').click()`); await sleep(200);
  const menu = await js(`(()=>{const g=document.querySelector('.gnb');return {open:document.getElementById('header').classList.contains('menu-open'),visible:getComputedStyle(g).display!=='none',labels:[...g.querySelectorAll('.sub a')].map(a=>a.textContent)}})()`);
  ok(menu.open && menu.visible && menu.labels.includes('CEO 인사말') && menu.labels.includes('AUM 성장 목표'), '모바일 메뉴: 열림, CEO 인사말·AUM 성장 목표 메뉴 표시', menu.open && menu.visible ? undefined : menu);
  await shot('mobile-menu-390x844');
  // 기존 주요 앵커 주소
  for (const [url, id] of [['/about/#leadership', 'leadership'], ['/about/#organization', 'organization'], ['/fund/#pef-ai', 'pef-ai'], ['/fund/#portfolio', 'portfolio'], ['/strategy/#value-up', 'value-up'], ['/philosophy/#risk', 'risk'], ['/disclosure/#management', 'disclosure-board']]) {
    await open(url, { init: hideToday, settle: 1200 });
    const top = await js(`(()=>{const el=document.getElementById('${id}');return el?Math.round(el.getBoundingClientRect().top):null})()`);
    ok(top !== null && top >= -10 && top < 400, `앵커 ${url}: 해당 위치로 이동`, top);
  }
  // 공시: 준비 중 예시 3개('자료 준비 중'), 분류·검색·초기화, 클릭 시 준비 중 안내(파일 링크 없음)
  const rowsJs = sel => `[...document.querySelectorAll('${sel} .disclosure-row')].map(r=>[...r.children].map(c=>c.textContent.trim()).join('|'))`;
  const samples = ['경영공시|영업보고서 및 결산 공고|자료 준비 중|↗', '펀드공시|펀드 운용보고서 및 수시 공시|자료 준비 중|↗', '리서치|시장 전망 및 투자 인사이트|자료 준비 중|↗'];
  await open('/disclosure/', { init: hideToday });
  const dis = await js(`(async()=>{const rows=()=>${rowsJs('#disclosure-list')};const a=rows();document.querySelector('#disclosure-filters [data-filter="fund"]').click();const b=rows();const pressed=document.querySelector('#disclosure-filters [data-filter="fund"]').getAttribute('aria-pressed');
    const i=document.getElementById('search-input');i.value='없는자료';i.dispatchEvent(new Event('input'));const c=document.getElementById('disclosure-list').textContent.trim();document.getElementById('reset-search')?.click();const d=rows();
    i.value='인사이트';i.dispatchEvent(new Event('input'));const e=rows();i.value='';i.dispatchEvent(new Event('input'));
    return {a,b,pressed,c,d,e,status:document.getElementById('disclosure-status').textContent,links:document.querySelectorAll('#disclosure-list a[href]').length}})()`);
  ok(JSON.stringify(dis.a) === JSON.stringify(samples) && JSON.stringify(dis.d) === JSON.stringify(samples) && dis.status === '3개 항목 · 자료 준비 중' && dis.links === 0, "공시 페이지: 준비 중 예시 3개·'자료 준비 중' 표시, 파일 링크 없음", dis);
  ok(JSON.stringify(dis.b) === JSON.stringify([samples[1]]) && dis.pressed === 'true' && dis.c.startsWith('검색 조건에 맞는 자료가 없습니다.') && JSON.stringify(dis.e) === JSON.stringify([samples[2]]), '공시 페이지: 분류·검색·초기화 동작', dis);
  await js(`document.querySelector('#disclosure-list [data-disclosure="management"]').click()`); await sleep(250);
  const pend = await js(`({open:document.getElementById('detail-dialog').open,title:document.getElementById('dialog-title').textContent,body:document.getElementById('dialog-body').textContent,links:document.querySelectorAll('#dialog-body a').length})`);
  await key('Escape');
  ok(pend.open && pend.title === '영업보고서 및 결산 공고' && pend.body.includes('자료 준비 중입니다.') && pend.links === 0 && !(await js(`document.getElementById('detail-dialog').open`)), "공시 페이지: 예시 클릭 시 '자료 준비 중' 안내(다운로드 없음), Esc로 닫힘", pend);
  await open('/', { init: hideToday });
  ok(JSON.stringify(await js(rowsJs('#disclosure-feed'))) === JSON.stringify(samples), "메인 공시 요약: 준비 중 예시 3개·'자료 준비 중' 표시");
  await shot('home-notices-1440x900');
  // Value-Up 카드: 라벨·제목·설명 시작 높이 동일 / Physical AI 테마 제목 한 줄, 다른 테마 크기 유지
  for (const [w, h, mobile] of [[1920, 1080, false], [1440, 900, false], [1366, 768, false], [390, 844, true], [320, 640, true]]) {
    await open('/strategy/', { width: w, height: h, mobile, init: hideToday });
    const vu = await js(`[...document.querySelectorAll('.value-up-grid article')].map(a=>['span','h4','p'].map(s=>Math.round(a.querySelector(s).getBoundingClientRect().top)))`);
    const same = i => new Set(vu.map(c => c[i])).size === 1;
    if (!mobile) ok(same(0) && same(1) && same(2), `Value-Up ${w}×${h}: 라벨·제목·설명 시작 높이 동일`, vu);
    else { const gaps = vu.map(([s, t]) => t - s); ok(gaps.every(g => g === gaps[0] && g < 80), `Value-Up ${w}×${h}(세로 배치): 라벨→제목 간격 동일·큰 빈 공간 없음`, gaps); }
    await open('/fund/', { width: w, height: h, mobile, init: hideToday });
    const ai = await js(`(()=>{const t=document.getElementById('pc-ai'),r=document.createRange();r.selectNodeContents(t);const lines=new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size;const box=t.closest('.pc-hero').getBoundingClientRect(),tb=t.getBoundingClientRect();
      const other=parseFloat(getComputedStyle(document.getElementById('pc-energy')).fontSize);return {text:t.textContent,lines,fontSize:parseFloat(getComputedStyle(t).fontSize),other,inside:tb.left>=box.left&&tb.right<=box.right,overflow:t.scrollWidth>t.clientWidth,ellipsis:getComputedStyle(t).textOverflow}})()`);
    ok(ai.text === 'Physical AI 파워 인프라' && ai.lines === 1 && ai.inside && !ai.overflow && ai.ellipsis !== 'ellipsis' && ai.fontSize <= ai.other && ai.fontSize >= 24, `Physical AI 제목 ${w}×${h}: 한 줄 표시, 잘림·넘침 없음 (${ai.fontSize.toFixed(1)}px, 다른 테마 ${ai.other.toFixed(1)}px)`, ai);
  }
} finally {
  ws.close(); proc.kill(); server.close();
  await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
const failed = report.filter(r => !r.ok);
for (const r of report) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}${r.detail !== undefined && !r.ok ? '  ' + JSON.stringify(r.detail) : ''}`);
console.log(JSON.stringify({ result: failed.length ? 'FAIL' : 'PASS', checks: report.length, failed: failed.length, browser: path.basename(browser) }));
if (failed.length) process.exitCode = 1;
