# STOCK PIA 자산운용 웹사이트 프로토타입

제공 PPT 22장과 TIMEFOLIO·DS ASSET 직접 리서치를 반영한 한국어 반응형 웹 초안입니다. 딥네이비·브라스 브랜드 인트로, 투자 철학, 4대 투자전략, 목표 포트폴리오, 운용/리스크/ESG, 경영진, 공시 및 파트너십을 포함합니다.

## 배포 구조 (보안)

- Netlify는 `netlify.toml`의 `publish = "public"` 설정에 따라 **`public/` 폴더만** 배포합니다. 루트의 PPT, `docs/`, `scripts/`, `data/ppt-extracted.*` 등은 공개되지 않습니다.
- 사이트 파일(`index.html`, `styles.css`, `app.js`, `fx.js`, `assets/`, `data/site-content.js`)은 모두 `public/` 안에서 수정합니다.
- 보안 헤더(CSP 등)는 `netlify.toml`에서 관리합니다.
- 정식 런칭 시 `public/index.html`의 `noindex` 메타 태그를 반드시 삭제하세요.

## 프로젝트 및 공개 현황

- **소스 저장소:** [GitHub - kimdc1226-coder/stock-pia](https://github.com/kimdc1226-coder/stock-pia)
- **기본 브랜치:** `main`
- **외부 공개:** Netlify 배포 완료
- **Netlify 공개 URL:** [https://stock-pia.netlify.app/](https://stock-pia.netlify.app/)
- **배포 형태:** 별도 빌드가 필요 없는 정적 HTML/CSS/JavaScript 사이트

이 프로젝트는 GitHub에 소스를 보관하고 Netlify에서 외부에 공유할 수 있도록 배포한 상태입니다. 향후 외부 개발자가 수정할 때는 GitHub 저장소를 기준 원본으로 사용하고, 수정 내용을 `main` 브랜치에 반영한 뒤 Netlify의 Production deploy가 성공했는지 확인해야 합니다.

> Netlify가 GitHub 저장소와 연동된 경우 `main` 브랜치에 반영된 변경사항이 자동 배포될 수 있습니다. 현재 저장소에는 Netlify 사이트 ID나 관리자 계정 정보가 포함되어 있지 않으므로, 실제 연동 방식과 접근 권한은 Netlify 관리자 화면에서 확인해야 합니다.

## 이번 작업 내용

- `STOCK PIA자산운용사.pptx` 22장의 텍스트, 표, 수치, 삽입 이미지를 추출하고 웹 섹션에 연결
- TIMEFOLIO와 DS자산운용 웹사이트의 정보 구조와 화면 흐름을 직접 조사
- 딥네이비·브라스 기반의 반응형 자산운용사 웹 디자인 제작
- 회사소개, 비전·핵심가치, 연혁, 경영진, 조직, 투자철학, 4대 투자전략, 투자 프로세스, 리스크 관리, Value-Up, ESG, 목표 포트폴리오, 공시, Contact 구성
- 모바일 메뉴, 전략 상세 모달, 자산군 필터, 공시 분류·검색, 검색 결과 없음 상태 구현
- 실제 자료가 없는 AUM·수익률·트랙레코드·공시 문서는 임의 생성하지 않고 `자료 준비 중`으로 표시
- 대표자명, 전화번호, 법인정보 등 PPT의 임시값은 확정 정보와 구분
- Unsplash 시안 이미지와 로컬 백업 이미지 적용
- 320px~1440px 반응형 화면, 주요 상호작용과 포트폴리오 합계 검증
- GitHub 저장소 업로드 및 Netlify 외부 공개 배포

## 실행

**가장 간단한 방법:** 이 폴더의 `index.html`을 Chrome 또는 Edge로 엽니다. 폴더 구조를 유지하세요. JavaScript 모듈/fetch 없이 동작하므로 빌드가 필요 없습니다.

**로컬 서버:** Node.js 18 이상에서 다음 명령을 실행합니다. 패키지 설치는 필요 없습니다.

```powershell
Set-Location -LiteralPath 'C:\codex\STOCK-PIA-B'
npm.cmd run dev
```

접속: **http://127.0.0.1:4173**

일반 터미널에서는 `npm run dev`도 가능합니다. Windows PowerShell의 `npm.ps1` 실행 정책을 바꾸지 않고 실행하려면 위처럼 `npm.cmd`를 사용하세요. 서버는 로컬 컴퓨터에서만 접근할 수 있도록 127.0.0.1에 바인딩됩니다. 중지는 `Ctrl+C`입니다. 포트를 사용 중이면 `$env:PORT=4174; npm.cmd run dev`처럼 다른 포트를 지정할 수 있습니다.

## 요청 산출물

1. [벤치마킹 분석 및 IA](docs/benchmark-and-ia.md)
2. [PPT 전체 추출 요약](docs/ppt-summary.md), [구조화 JSON](data/ppt-extracted.json), [원문 텍스트](data/ppt-extracted.txt)
3. 실행 가능한 전체 소스: `index.html`, `styles.css`, `app.js`, `data/`, `assets/`, `scripts/`
4. [고객사 텍스트·에셋 수급 체크리스트](docs/client-checklist.md)
5. [검증 기록](docs/validation.md), [설계 및 구현 계획](docs/design-and-plan.md)

## 동작하는 기능

- 반응형 GNB/모바일 메뉴, 섹션 이동, 고정 헤더, 모션 제어
- 4개 투자전략 상세 모달, Escape 닫기 및 포커스 복원
- 자산군별 목표 포트폴리오 필터와 합계
- 공시 분류·제목 검색·검색 결과 없음·초기화·준비 상태 안내
- 정책/문의/이미지 출처 안내, 표 가로 스크롤, 모션 저감 설정 지원

## 데이터 구분

**실적을 만들어 넣지 않았습니다.** AUM 6,000억/1조/1.6조는 2027/2028/2029 목표이며, IRR도 목표입니다. 실제 AUM·기준가·수익률·트랙레코드는 ‘자료 준비 중’입니다. 3개 연도의 자산군별 AUM 합계는 PPT 전체 목표와 일치합니다.

원본의 OOO 인물명·000 전화번호는 임시값으로 표시했습니다. 이메일과 웹 도메인 차이, 주소의 층수 표기는 고객사 확인이 필요합니다. 공시 PDF, 개인정보처리방침 전문, 준법감시인 심사필은 제공되지 않았으므로 승인받은 문서처럼 만들지 않았습니다. 문의 폼 전송이나 상품 가입 기능은 없습니다.

Hero 카피는 디자인 제안 문구입니다. 현재 DS 홈페이지의 실제 주색은 밝은 계열로 관찰되었으며, 네이비 무드는 사용자 요청에 따른 재해석입니다.

## 수정할 파일

| 대상 | 파일 |
|---|---|
| 본문/페이지 구조/연락처/에셋 주석 | `index.html` |
| 색상, 글꼴, 간격, 모바일 | `styles.css` |
| 전략 상세/포트폴리오/공시 예시 | `data/site-content.js` |
| 메뉴·필터·모달 | `app.js` |
| 메인·ESG 이미지 로컬 백업 | `assets/images/` |
| 전체 PPT 추출 보관 자료 | `data/ppt-extracted.json`, `data/ppt-extracted.txt` |

이미지는 Unsplash URL을 사용하고 실패하면 로컬 백업으로 대체됩니다. 오프라인에서는 외부 요청 타임아웃 후 로컬 이미지가 표시될 수 있습니다. 폰트 실패 시 시스템 폰트로 대체됩니다. 실제 회사 사진은 `[ASSET NEEDED]` 위치에 교체합니다.

## 외부 개발자 업데이트 절차

### 1. 저장소 받기

```powershell
git clone https://github.com/kimdc1226-coder/stock-pia.git
Set-Location -LiteralPath '.\stock-pia'
```

기존 작업 폴더를 사용하는 경우 먼저 원격 변경사항을 확인합니다.

```powershell
git status
git pull origin main
```

작업 전 별도 브랜치를 만드는 것을 권장합니다.

```powershell
git switch -c update/작업명
```

### 2. 로컬에서 확인

```powershell
npm.cmd run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 패키지 설치나 빌드 과정은 필요하지 않습니다.

### 3. 수정 및 검증

- 일반 본문, 연락처, 페이지 구조: `index.html`
- 색상, 배치, 모바일 화면: `styles.css`
- 전략·포트폴리오·공시 데이터: `data/site-content.js`
- 메뉴, 필터, 모달 동작: `app.js`
- 이미지: `assets/images/`

수정 후 다음 검사를 실행합니다.

```powershell
npm.cmd run check
```

PPT 자체가 교체된 경우에만 추출 스크립트를 먼저 실행합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\extract-ppt.ps1
npm.cmd run check
```

### 4. GitHub 반영

```powershell
git status
git add 수정한파일
git commit -m "docs: update stock pia website content"
git push origin update/작업명
```

검토가 끝나면 Pull Request로 `main` 브랜치에 병합합니다. 긴급한 경우에도 변경 전후 화면과 `npm.cmd run check` 결과를 남기는 것이 좋습니다.

### 5. Netlify 배포 확인

GitHub 연동 자동 배포를 사용한다면 `main` 반영 후 Netlify 관리자 화면의 **Deploys**에서 아래 항목을 확인합니다.

1. 최신 Production deploy가 성공했는지 확인
2. 배포 커밋이 GitHub의 최신 `main` 커밋과 같은지 확인
3. 공개 URL에서 데스크톱과 모바일 화면 확인
4. 메뉴, 전략 상세, 포트폴리오 필터, 공시 검색, 이미지 표시 확인
5. 문제가 있으면 Netlify에서 이전 정상 배포로 롤백하고 GitHub에서 수정

Netlify를 수동 업로드 방식으로 운영 중이라면 GitHub 변경만으로는 사이트가 갱신되지 않습니다. 저장소 루트 전체를 다시 배포하고 `index.html`이 Publish directory의 최상위에 있는지 확인해야 합니다.

## 외주 인수인계 시 전달할 정보

저장소에 비밀번호, API 키, Netlify 토큰을 기록하지 마세요. 다음 정보는 별도의 안전한 방법으로 담당자에게 전달해야 합니다.

- GitHub 저장소 접근 권한과 Pull Request 승인 담당자
- Netlify 사이트 관리자 권한 또는 초대 정보
- 실제 Netlify 공개 URL과 연결된 사용자 도메인
- GitHub 자동 배포 여부, Production branch, Publish directory
- 도메인·DNS 관리자와 갱신 담당자
- 최종 로고, 인물 사진, 회사 정보, 공시 PDF 원본
- 개인정보처리방침, 이용약관, 금융소비자보호 문서 및 준법감시인 심사필
- 실제 AUM·기준가·수익률 데이터의 담당자, 기준일과 갱신 주기
- 배포 전 최종 승인자와 장애 발생 시 연락처

외부 담당자는 먼저 [고객사 텍스트·에셋 수급 체크리스트](docs/client-checklist.md)와 [검증 기록](docs/validation.md)을 읽어야 합니다. 특히 목표 AUM·IRR를 실제 실적으로 바꾸거나 임시 연락처를 공개 정보로 확정하지 않도록 주의해야 합니다.

## 재추출 및 내용 검증

```powershell
Set-Location -LiteralPath 'C:\codex\STOCK-PIA-B'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\extract-ppt.ps1
npm.cmd run check
```

추출은 원본 PPT를 수정하지 않습니다. `npm.cmd run check`는 원본 해시, 표 수치/IRR 일치, 합계, 링크, 에셋, JS 문법 및 화면의 출처·페이지 인용 제거 상태를 검사합니다. PPT 내용이 바뀌면 편집 본문 및 `data/site-content.js`도 새 내용과 맞춰야 합니다.

현재 GitHub에 업로드되어 있고 Netlify를 통해 외부 공유가 가능한 상태입니다. 다만 콘텐츠는 여전히 검토용 프로토타입을 기준으로 하며, 정식 운영 전에는 수급 체크리스트에 따라 회사 정보·인물·공시·법정 문구·준법감시인 심사필을 확정해야 합니다.

## 스크립트 수정 후 터미널 명령

```powershell
git add .
git commit -m "fix: remove ppt page references"
git push origin main
```
