/* All financial figures are goals or projections. No live/real performance is implied. */
(() => {
  'use strict';
  const content = window.SITE_CONTENT;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const format = value => new Intl.NumberFormat('ko-KR').format(value);

  // Network images retain the requested Unsplash URL; local copies provide a reliable fallback.
  $$('img[data-fallback]').forEach(img => {
    const fallback = () => {
      if (!img.dataset.fallback) return;
      const path = img.dataset.fallback;
      delete img.dataset.fallback;
      img.src = path;
    };
    img.addEventListener('error', fallback, { once: true });
    if (img.complete && !img.naturalWidth) fallback();
  });

  const header = $('#header');
  const menuButton = $('.menu-toggle');
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  $$('#main-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuButton.focus(); }
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) setMenu(false); });
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('#motion-toggle');
  const setMotion = paused => {
    document.body.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? '배경 모션 재생' : '배경 모션 일시정지');
    motionButton.textContent = paused ? '▷' : 'Ⅱ';
  };
  setMotion(reducedMotion.matches);
  motionButton.addEventListener('click', () => setMotion(motionButton.getAttribute('aria-pressed') !== 'true'));
  reducedMotion.addEventListener('change', event => setMotion(event.matches));

  // Native dialog: Escape dismissal, focus trapping and focus restoration are supported by the browser.
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
  dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); dialogOpener?.focus(); });
  $$('[data-strategy]').forEach(button => button.addEventListener('click', () => {
    const strategy = content.strategies.find(item => item.id === button.dataset.strategy);
    const html = `<p>${escape(strategy.description)}</p><dl>${strategy.details.map(([title, description]) => `<dt>${escape(title)}</dt><dd>${escape(description)}</dd>`).join('')}</dl><p class="dialog-note">${escape(strategy.note)}</p>`;
    openDialog(`STRATEGY ${strategy.number} / ${strategy.eyebrow}`, strategy.title, html, button);
  }));

  // Filter only the proposed allocation. Column headers always retain their target labels.
  let portfolioFilter = 'all';
  function renderPortfolio() {
    const items = content.portfolio.filter(row => portfolioFilter === 'all' || row.category === portfolioFilter);
    $('#portfolio-body').innerHTML = items.map(row => `<tr><td>${escape(row.name)}<small>${escape(row.detail)}</small></td>${row.aum.map(number => `<td class="number">${format(number)}</td>`).join('')}<td class="number">${escape(row.irr)}</td></tr>`).join('');
    const sums = [0,1,2].map(index => items.reduce((total, row) => total + row.aum[index], 0));
    $('#portfolio-total').innerHTML = `<tr><td>${portfolioFilter === 'all' ? '자산군 계획 합계' : '선택 자산군 합계'}</td>${sums.map(sum => `<td class="number">${format(sum)}</td>`).join('')}<td class="number">—</td></tr>`;
    $('#portfolio-status').textContent = `${items.length}개 자산군 표시. 2027년 ${format(sums[0])}억, 2028년 ${format(sums[1])}억, 2029년 ${format(sums[2])}억 원 목표.`;
  }
  const activateFilter = (group, selected) => $$('button[data-filter]', group).forEach(button => {
    const active = button === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('#portfolio-filters button').forEach(button => button.addEventListener('click', () => {
    portfolioFilter = button.dataset.filter;
    activateFilter($('#portfolio-filters'), button);
    renderPortfolio();
  }));
  renderPortfolio();

  let disclosureFilter = 'all';
  const normalize = text => text.toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
  function renderDisclosures() {
    const term = normalize($('#search-input').value);
    const rows = content.disclosures.filter(item => (disclosureFilter === 'all' || item.category === disclosureFilter) && normalize(item.title + item.label).includes(term));
    $('#disclosure-list').innerHTML = rows.length ? rows.map(item => `<div class="disclosure-row"><span>${escape(item.label)}</span><button type="button" data-disclosure="${escape(item.category)}">${escape(item.title)}</button><span class="disclosure-status">자료 준비 중</span><span aria-hidden="true">↗</span></div>`).join('') : '<div class="empty-state"><p>검색 조건에 맞는 자료가 없습니다.</p><button type="button" id="reset-search">검색 조건 초기화</button></div>';
    $('#disclosure-status').textContent = `${rows.length}개 구성 예시 · 실제 게시일 및 첨부파일은 자료 수급 후 등록됩니다.`;
    $$('[data-disclosure]').forEach(button => button.addEventListener('click', () => {
      const item = content.disclosures.find(row => row.category === button.dataset.disclosure);
      openDialog(`${item.label} / CONTENT PENDING`, item.title, `<p>${escape(item.description)}</p><p class="dialog-note" style="margin-top:24px">이 항목은 공시 정보 구조를 보여주는 플레이스홀더입니다. 현재 등록된 공시 문서나 다운로드 파일은 없습니다.</p>`, button);
    }));
    $('#reset-search')?.addEventListener('click', () => {
      $('#search-input').value = '';
      disclosureFilter = 'all';
      activateFilter($('#disclosure-filters'), $('#disclosure-filters [data-filter="all"]'));
      renderDisclosures();
      $('#search-input').focus();
    });
  }
  $$('#disclosure-filters button').forEach(button => button.addEventListener('click', () => {
    disclosureFilter = button.dataset.filter;
    activateFilter($('#disclosure-filters'), button);
    renderDisclosures();
  }));
  $('#disclosure-search').addEventListener('submit', event => { event.preventDefault(); renderDisclosures(); });
  $('#search-input').addEventListener('input', renderDisclosures);
  renderDisclosures();

  const info = {
    privacy: ['개인정보처리방침', '개인정보처리방침은 고객사 확인 후 게시할 예정입니다. 이 프로토타입에는 개인정보 입력·전송 폼, 쿠키 분석 도구, 회원 기능이 없습니다. 외부 폰트와 Unsplash 이미지 요청은 발생할 수 있습니다. 운영 시 개인정보 처리 목적, 항목, 보유기간, 위탁·제3자 제공 여부, 이용자 권리, 보호책임자와 시행일을 확정해야 합니다.'],
    terms: ['이용약관', '고객사의 승인된 서비스 이용약관이 준비되면 이 위치에 전문과 시행일을 게시합니다. 현재 문구는 약관이 아닌 준비 상태 안내입니다.'],
    consumer: ['금융소비자보호', '금융소비자보호 기준, 민원 접수 채널과 담당자 정보는 확인 후 게시할 예정입니다. 금융투자업 등록 형태와 판매 구조에 맞는 최종 안내가 필요합니다.'],
    stewardship: ['스튜어드십코드', '스튜어드십코드 참여 여부와 수탁자 책임정책은 자료 수급 후 확정합니다. 현재 참여 또는 이행 실적을 표시하지 않습니다.'],
    contact: ['투자·제휴 문의 안내', 'LP 출자, 프로젝트 펀드, 공동 투자 및 매각 자문을 위한 IR 연락처를 준비하고 있습니다. ir@stockpia.co.kr은 사용 여부 확인 전이며 대표전화와 IR 전화는 임시값입니다. 연락처 확정 후 이메일·전화 연결을 제공합니다. 현재 문의 정보가 전송되거나 저장되지는 않습니다.'],
    credits: ['이미지 출처', '메인 건축 이미지와 ESG 인프라 이미지는 Unsplash 사진을 사용한 디자인 시안입니다. 실제 회사 사옥 또는 투자자산 사진이 아닙니다. 대표이사와 운용진 사진은 고객사 수급 대기 상태입니다.']
  };
  $$('[data-info]').forEach(button => button.addEventListener('click', () => {
    const [title, description] = info[button.dataset.info];
    let extra = '';
    if (button.dataset.info === 'credits') extra = '<ul><li><a href="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab" target="_blank" rel="noopener noreferrer">건축 사진 / Unsplash 원본</a></li><li><a href="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e" target="_blank" rel="noopener noreferrer">에너지 인프라 사진 / Unsplash 원본</a></li><li><a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License</a></li></ul>';
    openDialog('STOCK PIA / INFORMATION', title, `<p>${escape(description)}</p>${extra}`, button);
  }));

  if ('IntersectionObserver' in window) {
    const navLinks = $$('#main-nav a');
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-20% 0px -55% 0px' });
    ['intro','about','philosophy','strategies','disclosure','contact'].forEach(id => navObserver.observe(document.getElementById(id)));
    if (!reducedMotion.matches) {
      const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveal.unobserve(entry.target); }
      }), { threshold: 0.08 });
      $$('.section-heading,.about-grid,.principles,.strategy-grid,.process-grid,.values-grid').forEach(element => {
        element.classList.add('reveal-ready'); reveal.observe(element);
      });
    }
  }
})();
