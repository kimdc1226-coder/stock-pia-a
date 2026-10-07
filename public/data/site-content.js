window.SITE_CONTENT = {
  strategies: [
    { id: 'buyout', number: '01', eyebrow: 'PRIVATE EQUITY', title: '바이아웃 & 성장자본', subtitle: '기업의 본질적인 가치에 투자합니다.',
      description: '기업 경영권 인수와 오퍼레이션 개선을 통해 기업가치를 높이고, 성장자본 투자와 Value-Up을 지원합니다.',
      details: [
        ['핵심 타겟 산업', 'IT·소프트웨어, 첨단 제조업, 바이오 헬스케어, 차세대 모빌리티'],
        ['투자 규모 및 방식', '건당 100억~1,000억 원 규모의 단독 바이아웃 및 공동 투자(Co-investment)를 지향합니다.'],
        ['회수 전략', '전략적 투자자(SI) 매각, 상장(IPO), 글로벌 PEF Secondary 매각']
      ], note: '제시된 투자 규모는 전략 범위이며 실제 집행 실적이 아닙니다.' },
    { id: 'realestate', number: '02', eyebrow: 'REAL ASSETS', title: '부동산 & 인프라', subtitle: '실물자산의 가능성을 발견합니다.',
      description: 'Core / Value-add 부동산과 NPL을 검토하고, 프라임 오피스·물류센터·데이터센터의 가치 향상을 추구합니다.',
      details: [
        ['Core / Value-add 부동산', '서울 주요 권역 프라임 오피스의 리모델링과 임대율 극대화, 캡레이트 관리 전략'],
        ['물류 & 인프라 파이프라인', '수도권 거점 저온·상온 복합 물류센터 및 Data Center'],
        ['배당 현금흐름', '제시 배당 수익률: 연 6~8% 수준. 배당 현금흐름과 매각 차익을 추구합니다.']
      ], note: '연 6~8%는 제시치입니다. 산정 기준과 실적 여부가 확인되지 않았으며 확정·보장 수익률이 아닙니다.' },
    { id: 'credit', number: '03', eyebrow: 'PRIVATE CREDIT', title: '사모채권 & 메자닌', subtitle: '정교한 구조로 기회를 설계합니다.',
      description: '담보부 회사채, 메자닌 및 기업·부동산 NPL을 활용해 이자 수익과 추가 수익 기회를 검토합니다.',
      details: [
        ['담보부 회사채', '담보권을 기반으로 시장 하방에 대응하는 구조를 설계합니다.'],
        ['Mezzanine', '전환사채(CB)·신주인수권부사채(BW)의 이자 수익 및 주가 상승 시 추가 업사이드'],
        ['기업 또는 부동산 NPL', '네트워크를 통한 NPL 물건 확보, 리스크 및 수익성 분석에 기반한 투자']
      ], note: '담보와 구조화 설계는 원금 보전을 보장하지 않습니다.' },
    { id: 'special', number: '04', eyebrow: 'SPECIAL SITUATIONS', title: '스페셜 시츄에이션', subtitle: '변화의 순간에서 가치를 찾습니다.',
      description: '구조조정·지배구조 재편·분할 등 구조적 기회와 AI·신재생에너지 등 신성장 산업에 주목합니다.',
      details: [
        ['Project별 Mixing 투자전략', '철저한 사업분석을 바탕으로 프로젝트 특성에 맞는 지분투자·Mezzanine·대출 등 다양한 투자방안을 조합합니다.'],
        ['혁신 산업 집중 투자', 'AI·신재생에너지 등 신성장 산업의 기업 및 프로젝트에 대한 선제적 투자 기회를 발굴합니다.'],
        ['투자 목적', '프로젝트에 적합한 투자전략의 조합으로 리스크 관리와 수익 극대화를 추구합니다.']
      ], note: '전략 설명은 투자 방향에 관한 것으로 개별 상품의 청약 권유가 아닙니다.' }
  ],
  portfolio: [
    { category: 'equity', name: '주식형 펀드', detail: '상장·비상장사 지분투자, 공모주 투자', aum: [500,1500,2500], irr: '16~20% +' },
    { category: 'realestate', name: '부동산·NPL 펀드', detail: '실물부동산, NPL 투자', aum: [500,2000,3000], irr: '12% ~ 15%' },
    { category: 'credit', name: '사모채권 & 메자닌 펀드', detail: '투자대상 기업의 회사채, 메자닌 투자', aum: [1500,2500,3500], irr: '9% ~ 12%' },
    { category: 'special', name: '스페셜 시츄에이션 혼합형 펀드', detail: '신재생에너지 Project 및 기업 Mixing 투자', aum: [3500,4000,7000], irr: '16% +' }
  ],
  pefThemes: [
    { id: 'ai', number: '01', eyebrow: 'PEF PIPELINE · THEME 01', title: 'AI 파워 인프라', subtitle: 'AI & Power Infrastructure',
      summary: '차세대 데이터센터(IDC), 반도체 소부장, 스마트 AI 물류 인프라 조성',
      funds: [
        { name: 'OO IDC센터 펀드', business: '하이퍼스케일 IDC 설립 및 운영 프로젝트 투자', types: ['Equity', 'Mezzanine', '회사채/PF'] },
        { name: 'AI 테크 펀드', business: '메모리·비메모리 반도체 전·후공정 장비 소모성 핵심 부품 기업 투자', types: ['RCPS', 'Equity'] },
        { name: 'AI 디지털 솔루션 펀드', business: 'AI 물류센터 자동화 설비, WMS, 물류 지능화 장비 관련 기업 및 프로젝트 투자', types: ['Equity', 'Mezzanine', '회사채/PF'] }
      ] },
    { id: 'energy', number: '02', eyebrow: 'PEF PIPELINE · THEME 02', title: '신재생에너지 솔루션', subtitle: 'Renewable Energy Solutions',
      summary: '태양광, 풍력, 수소연료전지 발전 및 친환경 전력망 프로젝트',
      funds: [
        { name: '태양광 발전 펀드', business: '대규모 태양광 발전 사업 프로젝트 투자 및 자산 인수', types: ['Equity', 'Mezzanine', 'PF'] },
        { name: '풍력 발전 펀드', business: '해상·육상 풍력 발전 사업 단지 구축 및 프로젝트 지분 투자', types: ['Equity', 'Mezzanine', 'PF'] },
        { name: '수소연료전지 발전 펀드', business: '수소연료 발전 사업 프로젝트 (전력 생산 및 데이터센터 냉각 연계 시스템)', types: ['Equity', 'Mezzanine', 'PF'] }
      ] },
    { id: 'green', number: '03', eyebrow: 'PEF PIPELINE · THEME 03', title: '친환경 솔루션', subtitle: 'Eco & Circular Solutions',
      summary: '첨단 스마트팜 애그리컬처 및 글로벌 메탈 자원 순환 밸류체인',
      funds: [
        { name: '그린 스마트 애그리컬처 펀드', business: '스마트팜 설비 시공·운영 프로젝트, AI 생육 진단 및 수확 로봇 시스템 개발 기업 투자', types: ['Equity', 'PF'] },
        { name: '글로벌 메탈 리사이클링 펀드', business: '고순도 스크랩 수입 및 분리·가공 후 재수출하는 금속 재활용 특화 투자', types: ['Equity', 'PF'] }
      ] }
  ],
  disclosures: [
    { category: 'management', label: '경영공시', title: '영업보고서 및 결산 공고', description: '결산기, 공시 기준일 및 승인된 영업보고서·재무제표 원본을 수급한 뒤 등록합니다.' },
    { category: 'fund', label: '펀드공시', title: '펀드 운용보고서 및 수시 공시', description: '실제 운용 펀드명, 공시 유형, 기준일과 승인된 PDF를 수급한 뒤 등록합니다.' },
    { category: 'research', label: '리서치', title: '시장 전망 및 투자 인사이트', description: '발행일, 작성자, 준법 검토가 완료된 리서치 자료를 수급한 뒤 등록합니다.' }
  ]
};

SITE_CONTENT.nav = [
  { id: 'about', label: '회사소개', href: '/about/', desc: '탁월한 자산운용 역량과 기업가치 제고의 리더', children: [['회사 개요·비전', '/about/#overview'], ['연혁·로드맵', '/about/#history'], ['경영진', '/about/#leadership'], ['조직도', '/about/#organization']] },
  { id: 'philosophy', label: '투자철학', href: '/philosophy/', desc: '좋은 투자는 지켜야 할 원칙에서 시작됩니다.', children: [['투자 철학', '/philosophy/#philosophy'], ['투자 프로세스', '/philosophy/#process'], ['리스크 관리', '/philosophy/#risk']] },
  { id: 'strategy', label: '운용전략', href: '/strategy/', desc: '산업과 자산의 경계를 넘어 본질적인 가치를 발굴하는 4대 핵심 전략', children: [['4대 투자전략', '/strategy/#strategies'], ['Value-Up', '/strategy/#value-up'], ['ESG', '/strategy/#esg']] },
  { id: 'fund', label: 'PEF·펀드', href: '/fund/', desc: 'AI 인프라, 신재생에너지, 친환경 솔루션', children: [['PEF 파이프라인', '/fund/#pef'], ['목표 포트폴리오', '/fund/#portfolio']] },
  { id: 'disclosure', label: '공시·리서치', href: '/disclosure/', desc: '경영 현황과 운용 정보를 체계적으로 전달합니다.', children: [['경영공시', '/disclosure/#management'], ['펀드공시', '/disclosure/#fund'], ['리서치', '/disclosure/#research']] },
  { id: 'contact', label: 'Contact', href: '/contact/', cta: true }
];
SITE_CONTENT.cards = {
  buyout: { title: '바이아웃 &\n성장자본', text: '경영권 인수와 오퍼레이션 개선을 통한 기업가치 제고', img: '/assets/images/pexels-2256178-poster.jpg', fb: '/assets/images/hero.jpg' },
  realestate: { title: '부동산 &\n인프라', text: '프라임 오피스, 물류센터, 데이터센터와 NPL 투자', img: '/assets/images/pexels-2254324-poster.jpg', fb: '/assets/images/hero.jpg' },
  credit: { title: '사모채권 &\n메자닌', text: '담보부 회사채, CB·BW 및 NPL의 구조화 투자', img: '/assets/images/unsplash-photo-1486406146926-c627a92ad1ab.jpg', fb: '/assets/images/hero.jpg' },
  special: { title: '스페셜\n시츄에이션', text: 'AI·신재생에너지 및 프로젝트별 Mixing 투자전략', img: '/assets/images/unsplash-photo-1473341304170-971dccb5ac1e.jpg', fb: '/assets/images/esg.jpg' },
  ai: { title: 'AI 파워 인프라', text: '차세대 데이터센터(IDC), 반도체 소부장,\n스마트 AI 물류 인프라 조성', img: '/assets/images/pef-ai.jpg' },
  energy: { title: '신재생에너지\n솔루션', text: '태양광, 풍력, 수소연료전지 발전 및\n친환경 전력망 프로젝트', img: '/assets/images/pef-energy.jpg' },
  green: { title: '친환경 솔루션', text: '첨단 스마트팜 애그리컬처 및\n글로벌 메탈 자원 순환 밸류체인', img: '/assets/images/pef-green.jpg' }
};
