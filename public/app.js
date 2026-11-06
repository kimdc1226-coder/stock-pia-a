/* GRANDSTONE — shared layout (header/footer/dialog) + per-page features.
   All financial figures are goals or projections. No live/real performance is implied. */
(() => {
  'use strict';
  const content = window.SITE_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const br = value => esc(value).replace(/\n/g, '<br>');
  const flat = value => esc(value).replace(/\n/g, ' ');
  const path = location.pathname.replace(/index\.html$/, '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 961px)');
  const svg = d => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    buyout: svg('<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>'),
    realestate: svg('<path d="M4 20V6l8-3 8 3v14"/><path d="M9 20v-5h6v5M8 9h.01M12 9h.01M16 9h.01"/>'),
    credit: svg('<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    special: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'),
    ai: svg('<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>'),
    energy: svg('<circle cx="12" cy="9" r="1.6"/><path d="M12 7.4V2.5M10.6 9.8 6.3 12.3M13.4 9.8l4.3 2.5M12 10.6V21M8.5 21h7"/>'),
    green: svg('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c2.5-4 5-6.5 9-8.5"/>')
  };
  const brand = `<a class="brand" href="/" aria-label="그랑스톤 자산운용 홈"><img class="brand-logo" src="/assets/logo-grandstone-sm.png" alt="그랑스톤 자산운용" width="460" height="240" decoding="async"></a>`;
  const current = content.nav.find(item => item.href !== '/' && path.startsWith(item.href));

  /* ---------- Shared header ---------- */
  const chevron = '<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4.5 4 4 4-4"/></svg>';
  const navItems = content.nav.map(item => {
    const cur = current === item ? ' aria-current="page"' : '';
    if (item.cta) return `<li class="gnb-cta-li"><a class="gnb-cta" href="${item.href}"${cur}>${esc(item.label)} <span aria-hidden="true">↗</span></a></li>`;
    const id = `sub-${item.id}`;
    return `<li class="has-sub"><div class="gnb-row"><a class="gnb-link" href="${item.href}"${cur}>${esc(item.label)}</a><button class="sub-toggle" type="button" aria-expanded="false" aria-controls="${id}" aria-label="${esc(item.label)} 하위 메뉴 열기">${chevron}</button></div><div class="sub" id="${id}"><p class="sub-desc">${esc(item.desc)}</p><ul>${item.children.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul></div></li>`;
  }).join('');
  const headerHost = $('#site-header');
  if (headerHost) headerHost.outerHTML = `<header class="site-header" id="header"><div class="hd-inner">${brand}<nav class="gnb" id="main-nav" aria-label="주 메뉴"><ul>${navItems}</ul></nav><button class="menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="메뉴 열기"><span></span><span></span></button></div></header>`;

  /* ---------- Shared footer + dialog ---------- */
  const footerHost = $('#site-footer');
  if (footerHost) footerHost.outerHTML = `<footer class="site-footer"><div class="wrap">
    <div class="ft-top">${brand}<div class="footer-links"><button type="button" data-info="privacy">개인정보처리방침</button><button type="button" data-info="consumer">금융소비자보호</button></div><a class="top-link" href="#main" aria-label="맨 위로">↑</a></div>
    <nav class="ft-map" aria-label="사이트맵">${content.nav.map(item => `<div><a class="ft-parent" href="${item.href}">${esc(item.label)}</a>${item.children ? `<ul>${item.children.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>` : ''}</div>`).join('')}</nav>
    <p class="business-info">그랑스톤 자산운용 <span>대표자: 김복기</span><span>사업자등록번호: 374-88-02362</span><br>금융투자업 등록정보: 일반 사모집합투자업 (2022-08-29)</p>
    <div class="investment-notice"><strong>투자유의사항</strong><p>투자에는 원금 손실 가능성이 있습니다. 과거 실적과 목표 수익률은 미래 성과를 보장하지 않습니다. 투자 전 상품설명서 및 약관을 확인하시기 바랍니다. 본 사이트의 목표 AUM·IRR·예상 수익률은 사업계획으로, 확정된 실적이나 수익 보장을 의미하지 않습니다.</p><p>본 자료는 정보 제공 목적으로만 작성되었으며, 특정 금융 상품의 매수 또는 매도를 권유하는 문서가 아닙니다. 본 자료에 수록된 정보는 엄격한 기준에 의해 작성되었으나 그 정확성과 완전성을 보장하지 않습니다.</p></div>
    <div class="footer-bottom"><span>© 2026 GRANDSTONE ASSET MANAGEMENT.</span></div>
  </div></footer>`;
  document.body.insertAdjacentHTML('beforeend', '<dialog id="detail-dialog" aria-labelledby="dialog-title"><div class="dialog-inner"><button type="button" class="dialog-close" aria-label="닫기">×</button><p class="eyebrow" id="dialog-eyebrow"></p><h2 id="dialog-title"></h2><div id="dialog-body"></div></div></dialog>');

  /* ---------- Header behaviour: hover / focus / tap, Esc, mobile accordion ---------- */
  const header = $('#header');
  const menuButton = $('.menu-toggle');
  const subItems = $$('.has-sub', header);
  const setSub = (li, open) => {
    li.classList.toggle('open', open);
    const toggle = $('.sub-toggle', li);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', toggle.getAttribute('aria-label').replace(open ? '열기' : '닫기', open ? '닫기' : '열기'));
  };
  const closeSubs = except => subItems.forEach(li => { if (li !== except) setSub(li, false); });
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (!open) closeSubs();
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  subItems.forEach(li => {
    $('.sub-toggle', li).addEventListener('click', () => { const open = !li.classList.contains('open'); closeSubs(li); setSub(li, open); });
    li.addEventListener('mouseenter', () => { if (desktop.matches) { closeSubs(li); setSub(li, true); } });
    li.addEventListener('mouseleave', () => { if (desktop.matches && !li.contains(document.activeElement)) setSub(li, false); });
    li.addEventListener('focusin', () => { if (desktop.matches) { closeSubs(li); setSub(li, true); } });
    li.addEventListener('focusout', event => { if (desktop.matches && !li.contains(event.relatedTarget)) setSub(li, false); });
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = subItems.find(li => li.classList.contains('open'));
    if (open) { const hadFocus = open.contains(document.activeElement); setSub(open, false); if (hadFocus) $('.sub-toggle', open).focus(); event.stopPropagation(); }
    else if (header.classList.contains('menu-open')) { setMenu(false); menuButton.focus(); }
  });
  $$('.sub a, .gnb-link, .gnb-cta', header).forEach(link => link.addEventListener('click', () => { if (!desktop.matches) setMenu(false); else closeSubs(); }));
  document.addEventListener('click', event => { if (!header.contains(event.target)) { closeSubs(); if (!desktop.matches) setMenu(false); } });
  desktop.addEventListener('change', () => setMenu(false));
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Motion toggle (home hero) ---------- */
  const motionButton = $('#motion-toggle');
  const setMotion = paused => {
    document.body.classList.toggle('motion-paused', paused);
    if (!motionButton) return;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? '배경 모션 재생' : '배경 모션 일시정지');
    motionButton.textContent = paused ? '▷' : 'Ⅱ';
  };
  setMotion(reducedMotion.matches);
  motionButton?.addEventListener('click', () => setMotion(motionButton.getAttribute('aria-pressed') !== 'true'));
  reducedMotion.addEventListener('change', event => setMotion(event.matches));

  /* ---------- Dialog ---------- */
  const dialog = $('#detail-dialog');
  let dialogOpener;
  const openDialog = (eyebrow, title, html, opener) => {
    dialogOpener = opener || document.activeElement;
    $('#dialog-eyebrow').textContent = eyebrow;
    $('#dialog-title').textContent = title;
    $('#dialog-body').innerHTML = html;
    dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
    $('.dialog-close').focus();
  };
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { dialog.classList.remove('pef-dialog'); document.body.classList.remove('modal-open'); dialogOpener?.focus(); });

  /* ---------- Cards rendered from data ---------- */
  const cardImg = card => `<img class="sc-media" src="${card.img}"${card.fb ? ` data-fallback="${card.fb}"` : ''} alt="" loading="lazy">`;
  const tint = ['tint-ice', 'tint-mint', 'tint-peach', 'tint-lilac'];
  const strategyHost = $('#strategy-cards');
  if (strategyHost) {
    strategyHost.classList.add('pef-chapters');
    strategyHost.innerHTML = '<nav class="pef-nav" aria-label="투자전략">' + content.strategies.map(s => `<a href="#strategy-${s.id}" data-chap="strategy-${s.id}"><b>${s.number}</b>${flat(content.cards[s.id].title)}</a>`).join('') + '</nav>' + content.strategies.map(s => { const c = content.cards[s.id]; return `<article class="pef-chapter" id="strategy-${s.id}" aria-labelledby="sc-${s.id}"><div class="pc-hero"><img class="pc-img" data-parallax="0.1" src="${c.img}"${c.fb ? ` data-fallback="${c.fb}"` : ''} alt="" loading="lazy"><i class="pc-shade" aria-hidden="true"></i><span class="pc-num" aria-hidden="true">${s.number}</span><div class="pc-copy"><span class="pc-sub">${esc(s.eyebrow)}</span><h3 id="sc-${s.id}">${flat(c.title)}</h3><p class="pc-lead">${esc(s.subtitle)}</p><p>${esc(s.description)}</p></div></div><div class="pc-funds pc-details">${s.details.map(([t, d2], i) => `<article class="pef-fund"><span class="pef-fund-no">${String(i + 1).padStart(2, '0')}</span><h4>${esc(t)}</h4><p>${esc(d2)}</p></article>`).join('')}</div><p class="dialog-note pef-note">${esc(s.note)}</p></article>`; }).join('');
    const goHash = () => { const el = location.hash && document.getElementById(location.hash.slice(1)); if (el && el.classList.contains('pef-chapter')) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 150, behavior: 'auto' }); };
    setTimeout(goHash, 60); addEventListener('hashchange', goHash);
    if ('IntersectionObserver' in window) {
      const links = $$('.pef-nav a'); const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.dataset.chap === en.target.id)); }), { rootMargin: '-35% 0px -55% 0px' });
      $$('.pef-chapter').forEach(c => io.observe(c));
    }
  }
  const pefHost = $('#pef-cards');
  if (pefHost) {
    pefHost.classList.add('pef-chapters');
    pefHost.innerHTML = '<nav class="pef-nav" aria-label="PEF 테마">' + content.pefThemes.map(t => `<a href="#pef-${t.id}" data-chap="pef-${t.id}"><b>${t.number}</b>${flat(content.cards[t.id].title)}</a>`).join('') + '</nav>' + content.pefThemes.map(t => { const c = content.cards[t.id]; return `<article class="pef-chapter" id="pef-${t.id}" aria-labelledby="pc-${t.id}"><div class="pc-hero"><img class="pc-img" data-parallax="0.1" src="${c.img}"${c.fb ? ` data-fallback="${c.fb}"` : ''} alt="" loading="lazy"><i class="pc-shade" aria-hidden="true"></i><span class="pc-num" aria-hidden="true">${t.number}</span><div class="pc-copy"><span class="pc-sub">${esc(t.subtitle)}</span><h3 id="pc-${t.id}">${flat(c.title)}</h3><p>${esc(t.summary)}</p></div></div><div class="pc-funds">${t.funds.map((f, i) => `<article class="pef-fund"><span class="pef-fund-no">${String(i + 1).padStart(2, '0')}</span><h4>${esc(f.name)}</h4><p>${esc(f.business)}</p><ul class="pef-types" aria-label="펀드 형태">${f.types.map(x => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div></article>`; }).join('') + '<p class="dialog-note pef-note">조성 계획 단계의 펀드 구성안이며, 실제 펀드명·투자 구조·규모는 확정되지 않았습니다.</p>';
    const goHash = () => { const el = location.hash && document.getElementById(location.hash.slice(1)); if (el && el.classList.contains('pef-chapter')) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 150, behavior: 'auto' }); };
    setTimeout(goHash, 60); addEventListener('hashchange', goHash);
    if ('IntersectionObserver' in window) {
      const links = $$('.pef-nav a'); const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.dataset.chap === en.target.id)); }), { rootMargin: '-35% 0px -55% 0px' });
      $$('.pef-chapter').forEach(c => io.observe(c));
    }
  }
  const tileImg = c => `<img class="tile-img" src="${c.img}"${c.fb ? ` data-fallback="${c.fb}"` : ''} alt="" loading="lazy"><i class="tile-shade" aria-hidden="true"></i>`;
  const tile = (href, id, label, num) => { const c = content.cards[id]; return `<a class="tile tile-media" href="${href}">${tileImg(c)}<span class="tile-num" aria-hidden="true">${num}</span><span class="tile-icon" aria-hidden="true">${ICONS[id]}</span><h3>${br(c.title)}</h3><p>${flat(c.text)}</p><span class="tile-more">${label} <span aria-hidden="true">↗</span></span></a>`; };
  const panel = (href, id, label, num) => { const c = content.cards[id]; return `<a class="pf-panel" href="${href}">${tileImg(c)}<span class="pf-num" aria-hidden="true">${num}</span><span class="pf-body"><span class="tile-icon" aria-hidden="true">${ICONS[id]}</span><h3>${flat(c.title)}</h3><p>${flat(c.text)}</p><span class="tile-more">${label} <span aria-hidden="true">↗</span></span></span></a>`; };
  const tilesS = $('#tiles-strategy');
  if (tilesS) tilesS.innerHTML = content.strategies.map(s => tile(`/strategy/#strategy-${s.id}`, s.id, '자세히 보기', s.number)).join('');
  const tilesP = $('#tiles-pef');
  if (tilesP) tilesP.innerHTML = content.pefThemes.map(t => panel(`/fund/#pef-${t.id}`, t.id, '자세히 보기', t.number)).join('');
  // Disclosures: only real, approved documents go into content.disclosures ({ category, label, title, date, file }).
  const emptyDisclosures = '<div class="empty-state"><p>등록된 공시자료가 없습니다.</p></div>';
  const disclosureHref = item => item.file || `/disclosure/#${item.category}`;
  const fileAttrs = item => item.file ? ' target="_blank" rel="noopener"' : '';
  const feed = $('#disclosure-feed');
  if (feed) feed.innerHTML = content.disclosures.length ? content.disclosures.slice(0, 3).map(item => `<a class="disclosure-row" href="${esc(disclosureHref(item))}"${fileAttrs(item)}><span>${esc(item.label)}</span><span class="dr-title">${esc(item.title)}</span><span class="disclosure-status">${esc(item.date || '')}</span><span aria-hidden="true">↗</span></a>`).join('') : emptyDisclosures;

  // Network images retain the requested Unsplash URL; local copies provide a reliable fallback.
  $$('img[data-fallback]').forEach(img => {
    const fallback = () => { if (!img.dataset.fallback) return; const p = img.dataset.fallback; delete img.dataset.fallback; img.src = p; };
    img.addEventListener('error', fallback, { once: true });
    if (img.complete && !img.naturalWidth) fallback();
  });

  /* ---------- Strategy / PEF modals ---------- */
  $$('[data-strategy]').forEach(button => button.addEventListener('click', () => {
    const strategy = content.strategies.find(item => item.id === button.dataset.strategy);
    const html = `<p>${esc(strategy.description)}</p><dl>${strategy.details.map(([title, description]) => `<dt>${esc(title)}</dt><dd>${esc(description)}</dd>`).join('')}</dl><p class="dialog-note">${esc(strategy.note)}</p>`;
    openDialog(`STRATEGY ${strategy.number} / ${strategy.eyebrow}`, strategy.title, html, button);
  }));
  $$('[data-pef]').forEach(button => button.addEventListener('click', () => {
    const theme = content.pefThemes.find(item => item.id === button.dataset.pef);
    const funds = theme.funds.map((fund, i) => `<article class="pef-fund"><span class="pef-fund-no">${String(i + 1).padStart(2, '0')}</span><h3>${esc(fund.name)}</h3><p>${esc(fund.business)}</p><ul class="pef-types" aria-label="펀드 형태">${fund.types.map(type => `<li>${esc(type)}</li>`).join('')}</ul></article>`).join('');
    dialog.classList.add('pef-dialog');
    openDialog(theme.eyebrow, theme.title, `<p>${esc(theme.summary)}</p><div class="pef-funds">${funds}</div><p class="dialog-note">조성 계획 단계의 펀드 구성안이며, 실제 펀드명·투자 구조·규모는 확정되지 않았습니다.</p>`, button);
  }));

  /* ---------- Filter buttons (disclosure board) ---------- */
  const activateFilter = (group, selected) => $$('button[data-filter]', group).forEach(button => {
    const active = button === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  /* ---------- Disclosure board ---------- */
  let applyDisclosureHash = () => {};
  if ($('#disclosure-list')) {
    let disclosureFilter = 'all';
    const normalize = text => text.toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
    const renderDisclosures = () => {
      const term = normalize($('#search-input').value);
      const rows = content.disclosures.filter(item => (disclosureFilter === 'all' || item.category === disclosureFilter) && normalize(item.title + item.label).includes(term));
      $('#disclosure-list').innerHTML = rows.length ? rows.map(item => `<div class="disclosure-row"><span>${esc(item.label)}</span>${item.file ? `<a class="dr-title" href="${esc(item.file)}" target="_blank" rel="noopener">${esc(item.title)}</a>` : `<span class="dr-title">${esc(item.title)}</span>`}<span class="disclosure-status">${esc(item.date || '')}</span><span aria-hidden="true">↗</span></div>`).join('')
        : term ? '<div class="empty-state"><p>검색 조건에 맞는 자료가 없습니다.</p><button type="button" id="reset-search">검색 조건 초기화</button></div>' : emptyDisclosures;
      $('#disclosure-status').textContent = `등록된 자료 ${rows.length}건`;
      $('#reset-search')?.addEventListener('click', () => {
        $('#search-input').value = '';
        disclosureFilter = 'all';
        activateFilter($('#disclosure-filters'), $('#disclosure-filters [data-filter="all"]'));
        renderDisclosures();
        $('#search-input').focus();
      });
    };
    $$('#disclosure-filters button').forEach(button => button.addEventListener('click', () => {
      disclosureFilter = button.dataset.filter;
      activateFilter($('#disclosure-filters'), button);
      renderDisclosures();
    }));
    $('#disclosure-search').addEventListener('submit', event => { event.preventDefault(); renderDisclosures(); });
    $('#search-input').addEventListener('input', renderDisclosures);
    renderDisclosures();
    applyDisclosureHash = () => {
      const key = location.hash.slice(1);
      const button = $(`#disclosure-filters [data-filter="${key}"]`);
      if (!button || key === 'all') return false;
      disclosureFilter = key;
      $('#search-input').value = '';
      activateFilter($('#disclosure-filters'), button);
      renderDisclosures();
      return true;
    };
  }

  /* ---------- Footer / contact info dialogs ---------- */
  const info = {
    privacy: ['개인정보처리방침', '개인정보처리방침은 고객사 확인 후 게시할 예정입니다. 이 프로토타입에는 개인정보 입력·전송 폼, 쿠키 분석 도구, 회원 기능이 없습니다. 외부 폰트와 Unsplash 이미지 요청은 발생할 수 있습니다. 운영 시 개인정보 처리 목적, 항목, 보유기간, 위탁·제3자 제공 여부, 이용자 권리, 보호책임자와 시행일을 확정해야 합니다.'],
    consumer: ['금융소비자보호', '금융소비자보호 기준, 민원 접수 채널과 담당자 정보는 확인 후 게시할 예정입니다. 금융투자업 등록 형태와 판매 구조에 맞는 최종 안내가 필요합니다.'],
    contact: ['투자·제휴 문의 안내', 'LP 출자, 프로젝트 펀드, 공동 투자 및 매각 자문 문의는 아래 대표전화로 연락해 주시기 바랍니다. 이 사이트에는 문의 내용을 전송하거나 저장하는 기능이 없습니다.']
  };
  const contactLinks = '<ul><li><a href="tel:0234541201">대표전화 02-3454-1201</a></li><li>서울시 강남구 테헤란로 27길 8, 엠타워 13층</li></ul>';
  $$('[data-info]').forEach(button => button.addEventListener('click', () => {
    const [title, description] = info[button.dataset.info];
    openDialog('GRANDSTONE / INFORMATION', title, `<p>${esc(description)}</p>${button.dataset.info === 'contact' ? contactLinks : ''}`, button);
  }));

  /* ---------- Home: impersonation-fraud notice (hidden for the rest of the KST day when chosen) ---------- */
  const scamNotice = $('#scam-notice');
  if (scamNotice && typeof scamNotice.showModal === 'function') {
    const hideKey = 'gs-scam-notice-hidden-date';
    const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const store = {
      get: () => { try { return window.localStorage.getItem(hideKey); } catch { return null; } },
      set: value => { try { window.localStorage.setItem(hideKey, value); } catch { /* storage blocked: show again next visit */ } }
    };
    const todayBox = $('#scam-notice-today');
    $('#scam-notice-close').addEventListener('click', () => scamNotice.close());
    scamNotice.addEventListener('close', () => {
      if (todayBox.checked) store.set(today());
      if (!dialog.open) document.body.classList.remove('modal-open');
    });
    if (store.get() !== today()) {
      // showModal()의 자동 포커스와 닫기 버튼 포커스가 내부를 아래로 스크롤하지 않도록, 포커스 후 제목이 보이게 맨 위로 맞춘다
      const noticeInner = scamNotice.querySelector('.sn-inner');
      scamNotice.showModal();
      document.body.classList.add('modal-open');
      $('#scam-notice-close').focus({ preventScroll: true });
      noticeInner.scrollTop = 0;
      requestAnimationFrame(() => { noticeInner.scrollTop = 0; });
    }
  }

  /* ---------- In-page sub navigation (same data as the header) ---------- */
  const subnav = $('[data-subnav]');
  if (subnav && current?.children) {
    subnav.innerHTML = `<ul>${current.children.map(([label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul>`;
    const links = $$('a', subnav);
    const targets = links.map(link => document.getElementById(new URL(link.href).hash.slice(1)));
    if ('IntersectionObserver' in window) {
      const seen = new Set();
      const mark = () => {
        const idx = targets.findIndex(el => el && seen.has(el));
        links.forEach((link, i) => { if (i === idx) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      };
      const io = new IntersectionObserver(entries => { entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); mark(); }, { rootMargin: '-35% 0px -55% 0px' });
      targets.forEach(el => el && io.observe(el));
    }
  }

  /* ---------- Hash targets (cards are rendered by JS, so scroll after render) ---------- */
  const goHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const filtered = applyDisclosureHash();
    const el = document.getElementById(filtered ? 'disclosure-board' : id) || (filtered ? null : null);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - (header.offsetHeight + (subnav ? subnav.offsetHeight : 0) + 12);
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };
  goHash();
  window.addEventListener('load', () => { if (location.hash) goHash(); });
  window.addEventListener('hashchange', goHash);
})();
