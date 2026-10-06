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
  disclosures: [
    { category: 'management', label: '경영공시', title: '영업보고서 및 결산 공고', description: '결산기, 공시 기준일 및 승인된 영업보고서·재무제표 원본을 수급한 뒤 등록합니다.' },
    { category: 'fund', label: '펀드공시', title: '펀드 운용보고서 및 수시 공시', description: '실제 운용 펀드명, 공시 유형, 기준일과 승인된 PDF를 수급한 뒤 등록합니다.' },
    { category: 'research', label: '리서치', title: '시장 전망 및 투자 인사이트', description: '발행일, 작성자, 준법 검토가 완료된 리서치 자료를 수급한 뒤 등록합니다.' }
  ]
};
