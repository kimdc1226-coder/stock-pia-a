// 로컬 미리보기(npm run dev)와 브라우저 검사(npm run check:browser)가 함께 쓰는 404 처리.
// 운영(Cloudflare Workers 정적 자산, wrangler.jsonc의 assets.not_found_handling: "404-page")과 같은 규칙:
// 없는 주소는 요청 경로에서 가장 가까운 상위 폴더의 404.html을 HTTP 404 상태로 제공한다.
// 현재 404.html은 public/404.html 하나뿐이므로 모든 없는 주소에 이 페이지가 쓰인다.
import fs from 'node:fs';
import path from 'node:path';

// 요청 주소의 경로 부분. 해석할 수 없는 주소(예: "//[")는 예외 대신 null을 돌려준다 → 서버는 400으로 응답.
// 퍼센트 인코딩 해석(decodeURIComponent)은 하지 않으므로 호출하는 쪽에서 따로 처리한다.
export const requestPath = url => {
  try { return new URL(url, 'http://localhost').pathname; } catch { return null; }
};

export const notFoundFile = (root, urlPath) => {
  const parts = String(urlPath).split('/').filter(Boolean);
  for (let i = parts.length; i >= 0; i--) {
    const dir = path.resolve(root, ...parts.slice(0, i));
    if (dir !== root && !dir.startsWith(root + path.sep)) continue; // public/ 밖은 보지 않는다
    const file = path.join(dir, '404.html');
    try { if (fs.statSync(file).isFile()) return file; } catch { /* 이 폴더에는 없음: 상위로 */ }
  }
  return null;
};
