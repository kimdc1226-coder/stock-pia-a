# 그랑스톤 자산운용(GRANDSTONE) 웹사이트

그랑스톤 자산운용 소개용 한국어 반응형 정적 웹사이트입니다(HTML·CSS·JavaScript, 빌드·패키지 설치 없음). 정식 출시 전이며, 모든 페이지에 검색 노출 차단(`noindex`)이 걸려 있습니다.

- **운영 주소:** https://www.grandstone-am.com/
- **저장소:** https://github.com/kimdc1226-coder/stock-pia-a (`git remote -v` 기준, 기본 브랜치 `main`, 공개 저장소)
- **운영 환경:** Cloudflare Workers 정적 자산. **공개 대상은 `public/` 폴더뿐**입니다.

> 이 문서는 외부 담당자가 README만으로 실행·검증·수정·배포 구조·수급 대기 자료를 파악할 수 있도록 작성했습니다. 1~8절이 현재 운영 안내이고, 9절은 참고용 과거 이력입니다.

## 1. 현재 상태 (2026-11-07 기준)

| 구분 | 상태 |
|---|---|
| 라이브 사이트 | 커밋 **`11be602`** (`main`, 2026-11-07 배포·검증 완료). 라이브 검증 99항목 통과: 404 화면·HTTP 404·보안 헤더, 잘못된 해시, 앵커, 공시 예시·Value-Up·Physical AI·팝업, 전 페이지 PC·모바일. 라이브 HTML·JS·CSS는 저장소와 동일(Cloudflare가 넣는 분석 스크립트 제외) |
| **보완 작업 (2026-11-07)** | **배포 완료.** 아래 1~9는 `11be602`로 배포되어 라이브에 반영됐습니다 |

**배포 완료 항목 (`11be602`)**

1. **커스텀 404 연결:** `wrangler.jsonc`의 `assets`에 `"not_found_handling": "404-page"` 추가. 없는 주소(최상위·하위 모두)에서 `public/404.html`을 HTTP 404 상태로 제공합니다. 404 화면에서는 상단 메뉴에 현재 페이지 표시를 하지 않습니다(`/about/없는주소`에서 '회사소개'가 선택된 것처럼 보이지 않게). 라이브에서도 확인했습니다.
2. **로컬 미리보기·브라우저 검사도 같은 404 규칙 사용:** `scripts/not-found.mjs`를 `scripts/server.mjs`(npm run dev)와 `scripts/verify-browser.mjs`가 함께 씁니다.
3. **잘못된 해시 주소 오류 수정:** `/about/#%`처럼 퍼센트 인코딩이 잘못된 주소에서 `public/app.js`의 `decodeURIComponent`가 `URIError`를 내며 이후 해시 이동이 멈추던 문제. `URIError`만 처리하도록 고쳤고, 공시 분류 해시는 선택자 문자열을 만들지 않고 값으로 비교합니다.
4. **개인정보처리방침 준비 안내 문구:** 사실과 다른 'Unsplash 이미지 요청' 설명을 실제 구성으로 수정했습니다. 이미지·영상은 사이트 내부에서 제공하고, 외부에서 불러오는 것은 Google Fonts 글꼴입니다. 정책 전문은 계속 수급 대기입니다.
5. **검사 추가:** 404 응답·화면·버튼·메뉴, 잘못된 해시, 정상·동적 앵커와 공시 분류 해시, 실제 외부 요청 범위를 검사합니다.
6. **README 최신화:** 이 문서입니다.
7. **비정상 요청으로 로컬 서버가 꺼지던 문제:** 해석할 수 없는 주소(예: `GET //[`)를 받으면 `scripts/server.mjs`가 `Invalid URL`로 종료됐습니다. 브라우저 검사 서버도 `catch` 안에서 같은 주소를 다시 해석하다 종료됐습니다. 이제 두 서버 모두 HTTP 400으로 응답하고 계속 동작합니다. 정상적으로 해석되는 없는 주소는 그대로 404 화면입니다.
8. **PPT 재추출 대상 고정:** `scripts/extract-ppt.ps1`은 그동안 폴더의 첫 번째 PPT를 골랐습니다. 이름 순으로 `PEF 조성계획.pptx`가 먼저 잡혀 기존 추출 자료를 덮어쓸 수 있었습니다. 이제 기본 대상은 원본 `STOCK PIA자산운용사.pptx`이고, `-Source`로 다른 파일을 지정하는 기능은 유지합니다. 원본이 없거나 열리지 않으면 기존 결과를 건드리지 않고 필요한 파일과 경로를 안내한 뒤 종료합니다.
9. **외부 담당자용 검사 준비 절차:** 5절에 원본 PPT → 재추출 → 생성 확인 → `check` → `check:browser` 순서를 정리했습니다. 자료가 없을 때 `npm run check`는 `ENOENT` 대신 이 절차를 안내합니다.

**결정 대기 (요청이 있을 때만 진행)**

- CEO 인사말의 사명 띄어쓰기 통일: 인사말·사진 아래 표기는 요청 문구대로 붙여 쓴 '그랑스톤자산운용'이고, 공식 표기는 '그랑스톤 자산운용'입니다.
- 프로토타입 표시 제거: 메인 히어로의 'WEBSITE PROTOTYPE' 표시(`.prototype-label`), 메인 meta·OG·Twitter 설명의 '웹사이트 프로토타입', 개인정보처리방침 안내의 '이 프로토타입에는…'.
- `noindex` 해제: 정식 런칭 시 8개 HTML(7개 페이지 + 404)의 `<meta name="robots" content="noindex, nofollow">`를 삭제합니다(바로 위에 TODO 주석).
- Cloudflare 분석 스크립트: **방문 통계는 사용하지 않기로 결정**(2026-11-07). 대시보드에서 자동 삽입을 끄는 일만 남았습니다(Cloudflare 로그인이 필요해 사이트 쪽에서 처리하지 못함). 2절 '분석 스크립트와 CSP' 참고.
- `npm run check`는 저장소에 없는 로컬 전용 원본 자료(원본 PPT와 추출 결과)가 있어야 돌아갑니다. 준비 절차는 5절에 있습니다. 원본 없이도 돌도록 검사를 나눌지는 결정 대기입니다.

**수급 대기 (임의로 만들거나 외부에서 가져오지 않음)**

- 공시 원본 자료
- 개인정보처리방침 PDF
- 금융소비자보호 PDF
- 대표이사 사진

준비 안내 버튼과 '자료 준비 중' 표시는 자료를 받을 때까지 유지합니다. 그 밖의 확인 사항은 법인명(주식회사) 표기, 수익률 문구(연 6~8% 등)의 준법 검토, PEF 테마 이미지 3장의 원본 주소(8절)입니다.

**운영 설정 확인 필요 (사이트 파일과 무관)**

- `grandstone-am.com` → `www.grandstone-am.com` 리디렉션
- 도메인 자동 갱신 설정

## 2. 배포 구조

- **호스팅:** Cloudflare Workers 정적 자산
  - Worker 이름은 `stock-pia`이며 `wrangler.jsonc`의 `name`과 같아야 합니다.
  - GitHub `kimdc1226-coder/stock-pia-a`의 **`main`에 push하면 Workers Builds가 자동 배포**합니다(빌드 명령 없음, 배포 명령 `npx wrangler deploy`, 보통 1~2분).
- **공개 범위:** `wrangler.jsonc`의 `assets.directory = "./public"`에 따라 **`public/` 폴더만 공개**됩니다.
  - 루트의 `README.md`, `package.json`, `wrangler.jsonc`, `scripts/`, `netlify.toml`, 로컬 전용 자료는 공개되지 않습니다(라이브에서 404 확인).
  - `wrangler.jsonc`를 지우거나 `directory`를 바꾸면 저장소 루트 전체가 공개될 수 있습니다.
  - **저장소 루트 전체를 배포하는 방식은 쓰지 않습니다.**
- **없는 주소:** `"not_found_handling": "404-page"`로 가장 가까운 `404.html`(현재 `public/404.html` 하나)을 HTTP 404로 제공합니다(로컬 수정 완료·배포 대기).
  - `404.html`의 CSS·JS·링크는 모두 루트 기준 절대 경로(`/styles.css`, `/app.js`, `/`, `/contact/`)라 하위 주소에서도 깨지지 않습니다.
- **주소 형식:** 폴더형(`/about/`)입니다. Cloudflare 기본 동작으로 `/about/index.html`과 `/404.html`은 각각 `/about/`과 `/404`로 307 이동합니다.
- **보안 헤더:** `public/_headers`에 있습니다. CSP는 `script-src 'self'`이고, 외부는 Google Fonts(`fonts.googleapis.com`, `fonts.gstatic.com`)만 허용합니다. `netlify.toml`에도 같은 헤더가 있으므로 바꿀 때는 두 파일을 함께 수정하세요(Netlify는 현재 사용하지 않음).
- **기타 설정:**
  - `"workers_dev": false`: 옛 이름이 드러나는 기본 주소 `*.workers.dev`를 막습니다.
  - `"previews": {}`: 브랜치 미리보기 빌드용입니다.
- **내부 이름:** 저장소 `stock-pia-a`, Worker `stock-pia`, `package.json` 이름 등에는 옛 이름(STOCK PIA)이 남아 있습니다. 바꾸면 자동 배포 연결이 끊길 수 있어 그대로 둡니다. 화면과 메타데이터에는 노출되지 않습니다.
- **브랜치 미리보기:** `main`이 아닌 브랜치를 push하면 Cloudflare가 별도 미리보기 주소를 만듭니다. 주소를 아는 사람은 누구나 열 수 있습니다.

### 분석 스크립트와 CSP (결정: 방문 통계 미사용 · Cloudflare 대시보드 설정 해제 대기)

- **소스:** 저장소(`public/`)에는 분석 스크립트가 없습니다.
- **HTTP 응답:** 운영 응답에는 Cloudflare Web Analytics 스크립트가 자동으로 들어갑니다(`<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/…" data-cf-beacon=…>`, `</body>` 앞).
  - 2026-11-07 확인: `Accept: text/html`이 포함된 요청(curl·Node)에서는 모든 페이지·압축 방식에서 삽입됩니다.
  - `Accept: */*`만 보내면 삽입되지 않습니다.
- **CSP 호환성:** 현재 CSP(`script-src 'self'`)와 맞지 않습니다. 삽입된 HTML을 같은 CSP로 Chrome에 띄워 재현했습니다.
  - 결과: `Loading the script 'https://static.cloudflareinsights.com/…' violates … "script-src 'self'" … blocked` 콘솔 오류
  - 분석 데이터는 수집되지 않고, 사이트 화면·메뉴·기능에는 영향이 없습니다.
- **확인 한계:** 검사용 헤드리스 Chrome으로 운영 사이트를 직접 열면, HTTP/2·HTTP/1.1 모두 Cloudflare가 스크립트를 넣지 않았습니다. 같은 요청 헤더를 curl로 보내면 삽입되므로, 삽입 여부는 헤더 외의 조건(브라우저 판별 등)에 따라 달라지는 것으로 보입니다. 따라서 일반 방문자 브라우저의 콘솔 오류는 직접 재현하지 못했고, 위 로컬 재현으로 대신 확인했습니다.
- **조치안 (택1, 결정 후 진행):**
  1. **(채택)** 방문 통계를 쓰지 않으므로 Cloudflare 대시보드에서 `grandstone-am.com`의 Web Analytics 자동 삽입을 끕니다(사이트 파일·CSP 변경 없음). Cloudflare 로그인이 필요해 2026-11-07 배포 작업에서는 처리하지 못했고(이 PC에 wrangler·API 토큰 없음), 담당자가 대시보드에서 해제해야 합니다. **해제 후 확인:** `curl -s --compressed -H "Accept: text/html" https://www.grandstone-am.com/`의 결과에 `cloudflareinsights`가 없어야 합니다. 해제 전까지는 아래 CSP 콘솔 오류가 일부 브라우저에서 계속 보일 수 있으며 기능에는 영향이 없습니다.
  2. (미채택) 분석이 필요하면 `public/_headers`·`netlify.toml`의 CSP를 넓힙니다. `script-src`에 `https://static.cloudflareinsights.com`을 추가하고, 전송 주소에 맞춰 `connect-src`도 조정합니다. 이 경우 개인정보처리방침 안내에 분석 도구 사용을 반영해야 합니다.
  3. (미채택) 현 상태 유지: 기능 영향은 없고 콘솔 오류만 남습니다.

## 3. 폴더 구조와 수정 위치

```
STOCK-PIA-B/
├─ public/                    ← 공개되는 유일한 폴더 (사이트 전체)
│  ├─ index.html              ← 메인(요약 페이지, 사칭 금융사기 주의 팝업 포함)
│  ├─ about/ philosophy/ strategy/ fund/ disclosure/ contact/  (각 index.html)
│  ├─ 404.html                ← 없는 주소 안내(홈으로 이동·Contact 버튼, 공통 메뉴·푸터)
│  ├─ styles.css, app.js, fx.js  ← 모든 페이지 공유(루트 경로 /styles.css 등으로 참조)
│  ├─ data/site-content.js    ← 메뉴·전략·PEF·공시 데이터
│  ├─ _headers                ← 보안 헤더(CSP 등)
│  └─ assets/                 ← 로고·파비콘·OG, images/(사진), videos/(배경 영상)
├─ scripts/                   ← 로컬 서버·검사 (공개 안 됨)
│  ├─ server.mjs              ← npm run dev
│  ├─ not-found.mjs           ← 로컬 서버 공통: 요청 주소 해석(실패 시 400), 404 처리(운영 not_found_handling과 같은 규칙)
│  ├─ verify-content.mjs, verify-no-ppt-citations.mjs  ← npm run check
│  ├─ verify-browser.mjs      ← npm run check:browser
│  └─ extract-ppt.ps1         ← 원본 PPT 재추출(기본 대상 STOCK PIA자산운용사.pptx, 로컬 전용)
├─ wrangler.jsonc             ← Cloudflare 배포 설정 (지우거나 directory를 바꾸지 말 것)
├─ netlify.toml               ← 예전 Netlify 설정(미사용, 헤더만 _headers와 동일 유지)
└─ package.json, README.md, .gitignore
```

`.gitignore`에 따라 저장소에 올리지 않는 로컬 전용 자료가 있습니다.
- 원본 PPT(`*.pptx`), `data/`(PPT 추출본), `docs/`(작업 문서·스크린샷), `assets/ppt/`, `update.txt`, `MAIN_Image.png`
- 그 밖에 미추적 상태로 둔 인수인계 문서 `HANDOFF.md`와 로고 원본 파일

| 바꿀 내용 | 파일 |
|---|---|
| 페이지 본문·구조, 연락처(Contact), CEO 인사말, 조직도 | `public/<페이지>/index.html` |
| 메뉴(헤더·푸터 사이트맵 공통) | `public/data/site-content.js`의 `nav` |
| 4대 전략·PEF 테마·펀드·카드 이미지 경로 | `public/data/site-content.js`의 `strategies`, `pefThemes`, `cards` |
| 공시 자료 등록 | `public/data/site-content.js`의 `disclosures` (아래 6절) |
| 헤더·푸터·회사 정보·투자유의사항, 정책 안내 팝업 문구, 공시 목록·검색, 사칭 주의 팝업 동작 | `public/app.js` |
| 사칭 주의 팝업 본문 | `public/index.html`의 `dialog#scam-notice` |
| 스크롤 연출·숫자 애니메이션 | `public/fx.js` |
| 색상·글꼴·간격·모바일 배치·줄바꿈 규칙 | `public/styles.css` |
| 이미지·영상·로고 | `public/assets/` |

공통 헤더와 푸터는 각 페이지의 `<div id="site-header">`·`<div id="site-footer">` 자리에 `app.js`가 만들어 넣습니다. 메뉴 이름이나 링크는 `nav` 한 곳만 고치면 됩니다.

## 4. 실행 (로컬 미리보기)

Node.js 18 이상이 필요하고, 패키지 설치는 필요 없습니다.

```powershell
Set-Location -LiteralPath 'C:\codex\STOCK-PIA-B'   # 또는 clone한 폴더
npm.cmd run dev
```

- 접속: **http://127.0.0.1:4173** (127.0.0.1에만 바인딩, 중지는 `Ctrl+C`)
- 포트를 사용 중이면 `$env:PORT=4174; npm.cmd run dev`
- Windows PowerShell 실행 정책 때문에 `npm`이 막히면 `npm.cmd`를 씁니다.
- `public/`만 서빙합니다. `/about/` 같은 폴더 주소가 열리고, 없는 주소는 운영과 같이 `404.html`을 HTTP 404로 보여 줍니다. 해석할 수 없는 주소(예: `//[`)에는 HTTP 400으로 응답하고 서버는 계속 동작합니다.
- 모든 경로가 루트 기준(`/styles.css`)이므로 `index.html` 파일을 더블클릭(`file://`)해서 열면 스타일·스크립트가 적용되지 않습니다. 반드시 로컬 서버로 확인하세요.

## 5. 검증

| 명령 | 필요 조건 | 검사 내용 |
|---|---|---|
| `npm.cmd run check` | Node.js 18 이상 + **로컬 전용 원본 자료** | JS 문법, 8개 HTML의 링크·앵커·로컬 자산, CSP 위반 요소, 승인된 문구·수치, 삭제 항목 재등장, 404·해시 처리 코드, 정책 안내 문구, 원본 PPT 해시·수치 일치, 화면의 PPT 인용 표기 |
| `npm.cmd run check:browser` | **Node.js 22 이상** + **Chrome 또는 Edge** | 실제 CSP 헤더로 서빙 후 헤드리스 브라우저로 확인(아래) |

### 새로 clone한 환경에서 검사 준비하기 (외부 담당자)

`npm run check`에는 저장소에 올리지 않는 로컬 전용 자료 세 가지가 필요합니다.
- 원본 `STOCK PIA자산운용사.pptx`
- 추출 결과 `data/ppt-extracted.json`
- 추출 이미지 `assets/ppt/` 23개

추출 결과와 이미지는 원본에서 다시 만들 수 있으므로 **원본 PPT 하나만 전달받으면 됩니다.** 아래 순서대로 진행하세요(2026-11-07 새 clone 사본에서 실제로 실행해 확인).

1. 원본 `STOCK PIA자산운용사.pptx`를 프로젝트 담당자에게 별도로 받아 **프로젝트 루트**(이 README가 있는 폴더)에 그 이름 그대로 저장합니다.
2. 원본 파일명을 지정해 재추출합니다. 프로젝트 루트에서 실행합니다.
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\extract-ppt.ps1 -Source ".\STOCK PIA자산운용사.pptx"
   ```
   정상이면 `Extracted 22 slides, 23 media files, …`가 출력됩니다. 원본이 없거나 열리지 않으면(PowerPoint로 열어 둔 경우 포함) 기존 결과를 바꾸지 않고 필요한 파일과 경로를 안내한 뒤 종료합니다.
3. 생성을 확인합니다. `data\ppt-extracted.json`(첫 줄 근처 `"source": "STOCK PIA자산운용사.pptx"`, `"slideCount": 22`)과 `assets\ppt\`의 이미지 23개가 있어야 합니다.
   ```powershell
   Test-Path .\data\ppt-extracted.json; (Get-ChildItem .\assets\ppt -File).Count
   ```
4. `npm.cmd run check`를 실행합니다. 자료가 없으면 이 절차를 안내하고 종료합니다.
5. `npm.cmd run check:browser`를 실행합니다. 원본 자료는 필요 없지만 Node.js 22 이상과 Chrome 또는 Edge가 필요합니다.

원본 PPT, 추출 결과(`data/`, `assets/ppt/`), 검토 문서(`docs/`)는 `.gitignore`로 막혀 있는 로컬 전용 자료입니다. 커밋하거나 `public/`에 넣지 마세요. 원본 없이도 `npm run check`가 돌도록 검사를 나눌지는 결정 대기입니다.

**`npm run check:browser` 검사 항목**
- 사칭 주의 팝업: 표시·닫기·Esc, '오늘 하루 보지 않기'(한국시간 당일), 저장소 차단 대응, 모바일 320×568·390×844 최초 표시 위치
- 메인 첫 화면: 8개 해상도에서 한 화면에 표시
- 모든 페이지 × 5개 화면 폭: 콘솔 오류·CSP 차단·깨진 이미지·가로 넘침, 실제 외부 요청이 Google Fonts뿐인지
- 줄바꿈, 모바일 메뉴
- 앵커: 정상 앵커와 동적 카드 앵커(`/strategy/#strategy-buyout`, `/fund/#pef-energy` 등), 공시 분류 해시(`/disclosure/#fund`)
- 잘못된 해시(`/about/#%` 등)에서도 오류 없이 메뉴·이후 앵커 동작
- 공시 예시·분류·검색, Value-Up 정렬, Physical AI 제목 한 줄
- 404: 상태 코드, 화면, 홈·Contact 버튼, 메뉴 이동
- 서버 견고성: 검사 서버와 `npm run dev` 서버에 비정상 요청(`//[` 등 5종)을 실제로 보낸 뒤 400 응답, 서버 생존, `/`·`/about/` 200, 없는 주소 404 화면 유지

**결과 확인과 스크린샷**
- 결과는 `PASS`/`FAIL` 목록과 마지막 줄 JSON(`checks`, `failed`)으로 나옵니다.
- 스크린샷이 필요하면 `node scripts/verify-browser.mjs <public 밖 폴더>`처럼 저장 폴더를 지정합니다. `public/` 안은 거부합니다.
- Chrome·Edge가 다른 위치에 있으면 `CHROME_PATH`로 실행 파일을 지정합니다. Node.js 22 미만이면 필요한 버전을 안내하고 종료합니다.

**원본 PPT가 교체된 경우:** 위 2~4단계와 같은 명령으로 다시 추출하고 검사합니다.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\extract-ppt.ps1 -Source ".\STOCK PIA자산운용사.pptx"
npm.cmd run check
```

- `-Source`를 빼면 기본 대상도 프로젝트 루트의 `STOCK PIA자산운용사.pptx`입니다.
- 폴더에 있는 다른 PPT(수정요청서 등)는 자동으로 고르지 않습니다. 다른 파일을 일부러 추출할 때만 `-Source`로 지정하세요. 다만 `data/ppt-extracted.*`가 덮어써져 `npm run check`가 실패하므로, 끝나면 원본으로 다시 추출하세요.
- 추출은 원본 PPT를 수정하지 않습니다. PPT 내용이 바뀌면 페이지 본문과 `public/data/site-content.js`도 맞춰야 합니다.

## 6. 콘텐츠·데이터 원칙 (현재 구성)

- **실적을 만들어 넣지 않습니다.** AUM 6,000억·1조·1.6조(2027·2028·2029)는 목표이고, 수익률 표기도 목표·예상입니다. 화면의 투자유의사항에 이를 밝히고 있습니다. 예전의 자산군별 예상 포트폴리오 표·필터는 삭제했고, PEF 페이지에는 연도별 AUM 성장 목표 그래프만 있습니다(메뉴 'AUM 성장 목표' → `/fund/#portfolio`).
- **연락처:** 공개 연락처는 대표전화 02-3454-1201과 사무실 주소입니다(Contact 페이지·문의 팝업). 문의 이메일·대표이사 직통은 삭제했고, 문의 전송 폼·서버는 없습니다.
- **회사소개:** 경영진 카드 대신 CEO 인사말(`/about/#leadership`)이 있습니다. 대표이사 사진은 준비 영역으로 비워 두었습니다. 조직도는 이사회 → 대표이사 → 2개 본부 → 4개 부문 + 독립·보조 조직입니다.
- **푸터 회사 정보:** 대표자, 사업자등록번호, 금융투자업 등록정보(일반 사모집합투자업)가 `public/app.js`에 있습니다.
- **정책 메뉴:** 개인정보처리방침·금융소비자보호 2개입니다. 문서를 받기 전에는 버튼을 누르면 준비 안내만 보입니다(PDF 링크 없음). PDF를 연결할 때는 `scripts/verify-content.mjs`의 'PDF 링크 금지' 검사도 함께 바꿔야 합니다.
- **공시:** 실제 자료는 `public/data/site-content.js`의 `disclosures`에 `{ category: 'management' | 'fund' | 'research', label, title, date: 'YYYY-MM-DD', file: '/경로.pdf' }`로 등록합니다. 파일은 `public/` 안에 둡니다.
  - 메인 요약(배열의 앞 3건, 최신 자료를 앞에 등록)과 공시 페이지가 같은 데이터를 씁니다.
  - 실제 자료가 한 건도 없는 동안은 준비 중 예시 3개(`disclosureSamples`)가 '자료 준비 중'으로 보입니다. 실제 자료를 한 건이라도 등록하면 예시는 자동으로 빠집니다.
- **사칭 주의 팝업:** 메인에만 있습니다. '오늘 하루 보지 않기'는 `localStorage`의 `gs-scam-notice-hidden-date`에 한국시간 날짜를 저장하고, 저장소가 막혀도 오류 없이 동작합니다.
- **이미지·영상:** 모두 `public/assets/`의 사이트 내부 파일이고, 외부 요청은 Google Fonts뿐입니다. CSP 때문에 외부 CDN·이미지·인라인 스크립트(`onclick` 등)는 동작하지 않습니다.
  - `/assets/*`는 1년 캐시입니다. 이미지를 바꿀 때는 같은 이름으로 덮어쓰지 말고 새 파일명을 쓰세요.
- **브랜드 표기:**
  - 한글 `그랑스톤 자산운용`('그랑스톤'은 의도한 발음), 영문 `GRANDSTONE` / `GRANDSTONE ASSET MANAGEMENT`(붙여쓰기, `GRAND STONE` 금지)
  - 로고는 확정본(`public/assets/logo-grandstone*.png`)입니다. 원본·후보 파일은 공개 폴더에 두지 않습니다.

## 7. 수정·배포 절차 (외부 담당자)

1. **받기:**
   ```powershell
   git clone https://github.com/kimdc1226-coder/stock-pia-a.git
   Set-Location -LiteralPath '.\stock-pia-a'
   git switch -c update/작업명
   ```
   기존 폴더라면 `git status` 후 `git pull origin main`을 먼저 실행합니다.
2. **수정:** 3절 표의 `public/` 파일만 고칩니다. 비공개 자료를 `public/`에 넣지 마세요. 저장소가 공개 상태이고 커밋 작성자 정보도 공개됩니다.
3. **로컬 확인:** `npm.cmd run dev`로 PC·모바일 폭을 확인한 뒤 `npm.cmd run check:browser`와 `npm.cmd run check`(5절의 원본 자료 준비 후)를 실행합니다.
4. **바이너리 확인:** 디자인 도구가 이미지·영상에 메타데이터를 넣어 파일이 바뀌는 일이 있었습니다. `git diff --numstat -- public/assets`로 의도하지 않은 변경이 없는지 확인하고, 있으면 `git checkout HEAD -- <파일>`로 되돌립니다.
5. **반영:** 커밋 → 브랜치 push(미리보기 주소로 확인 가능) → 검토 후 `main`에 병합합니다. **`main` 반영이 곧 운영 배포**이므로 승인 후에만 진행합니다.
6. **배포 확인:** Cloudflare 대시보드(Workers & Pages → `stock-pia`)에서 빌드 성공을 확인한 뒤 운영 주소에서 아래를 봅니다.
   - 메뉴, 팝업, 공시 분류·검색
   - 없는 주소(예: `/no-such-page`)에서 404 안내 화면이 뜨는지
   - 브라우저 콘솔 오류
   - 폴더 주소(`/about/`)로 비교합니다. `/about/index.html`은 307로 이동합니다.
7. **되돌리기:** 문제가 생기면 `git revert <커밋>` 후 `main`에 push합니다. 급하면 Cloudflare의 이전 배포 버전으로 되돌립니다.

## 8. 미디어 출처 기록 (화면의 이미지 출처 팝업 삭제 후 내부 보관)

화면에서 출처 안내를 뺐다고 저작권 표시 의무가 없다고 단정하지 않습니다. 라이선스 조건은 아래 원본에서 다시 확인하세요. 사이트에는 아래 원본을 내려받은 로컬 사본(`public/assets/`)만 쓰며, 외부 주소로 요청하지 않습니다.

- 배경 영상·일부 건축 이미지: Pexels — K [2406631](https://www.pexels.com/video/building-with-exterior-glass-panels-2406631/), [2254324](https://www.pexels.com/video/aerial-view-of-buildings-2254324/), [2256178](https://www.pexels.com/video/high-rise-building-with-glass-panels-2256178/), ArtHouse Studio [4514373](https://www.pexels.com/video/drone-footage-of-buildings-4514373/) · [Pexels License](https://www.pexels.com/license/)
- 건축·ESG 이미지: Unsplash [photo-1486406146926-c627a92ad1ab](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab), [photo-1473341304170-971dccb5ac1e](https://images.unsplash.com/photo-1473341304170-971dccb5ac1e) · [Unsplash License](https://unsplash.com/license)
- PEF 테마 이미지 `pef-ai.jpg`, `pef-energy.jpg`, `pef-green.jpg`(Pexels 사진 3장): 원본 주소 미기록 — 확인 필요

### 인수인계 시 별도로 전달할 정보

저장소에 비밀번호·API 키·토큰을 기록하지 마세요. 아래는 안전한 방법으로 따로 전달합니다.

- GitHub 저장소 권한과 `main` 병합 승인자
- Cloudflare 계정(Workers·도메인) 권한과 도메인 갱신 담당자
- 원본 `STOCK PIA자산운용사.pptx`(로컬 전용). `npm run check`에 필요하며, 추출 결과는 5절 절차로 다시 만듭니다.
- 수급 대기 자료(공시 원본, 정책 PDF 2종, 대표이사 사진)의 제공 담당자와 최종 승인자

## 9. 과거 이력 (참고용 — 현재 운영 안내가 아님)

- **2026-11-07 `a5a1f2e` (배포 완료):** 공시 준비 중 예시 3개 복원, Value-Up 카드 정렬(subgrid), 'Physical AI 파워 인프라' 제목 한 줄(AI 테마만, 320px에서 24px), 줄바꿈 정리(`text-wrap`, `.nb` 묶음, `br.desktop-only`)
- **2026-11-06 `5236fdf` (배포 완료):** 수정요청서 35장 반영
  - 첫 화면 높이 맞춤, 핵심 지표 정리, 핵심 가치 'Accompany'
  - 공시 '구성 예시' 문장 삭제, 정책 메뉴 2개, 푸터 회사 정보, 검토용 표기·이미지 출처 팝업 삭제
  - 사칭 금융사기 주의 팝업, CEO 인사말
  - 투자철학·운용전략 문구 수정, PEF 'Physical AI 파워 인프라'
  - 예상 포트폴리오 표 삭제, 문의 이메일·직통 삭제
  - `npm run check:browser` 신설
- **2026-11-01 `c4445da`·`9a40a3d`:** GRANDSTONE 로고 확정, 한글 사명 '그랑스톤 자산운용' 통일, 영문 'GRANDSTONE' 통일, 조직도·펀드명 갱신
- **2026-10-23:** 사명 STOCK PIA → GRAND STONE, 도메인 `www.grandstone-am.com` 연결, 옛 `workers.dev` 주소 차단
- **2026-10-08:** 단일 `index.html` 페이지 → 멀티페이지 구조(되돌림 태그 `v1-stable`)
- **초기:** 원본 PPT 22장과 타 운용사 사이트 조사를 바탕으로 만든 프로토타입
  - Netlify에서 공개하다 Cloudflare Workers로 옮겼습니다. Netlify는 크레딧 한도로 배포가 멈췄고 현재 쓰지 않습니다.
  - 당시 저장소 루트 전체가 공개되던 문제를 `public/` 분리로 해결했습니다.
