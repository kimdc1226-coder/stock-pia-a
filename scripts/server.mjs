import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { notFoundFile, requestPath } from './not-found.mjs';

const root = resolve(fileURLToPath(new URL('../public', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.mp4':'video/mp4', '.pdf':'application/pdf', '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8', '.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
const handle = async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  // 주소 자체를 해석할 수 없으면(예: //[) 400. 서버는 계속 동작한다.
  const rawPath = requestPath(req.url);
  if (rawPath === null) { res.writeHead(400, {'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'}); res.end('Bad Request'); return; }
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(root + sep) || path.split('/').some(p => p.startsWith('.'))) { res.writeHead(403); res.end('Forbidden'); return; }
    let file = target;
    let info = await stat(file);
    if (info.isDirectory()) { file = resolve(target, 'index.html'); info = await stat(file); } // /about/ -> /about/index.html (Cloudflare 방식)
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    // 없는 주소: 운영과 같이 public/404.html을 404 상태로 제공 (wrangler.jsonc not_found_handling: "404-page")
    const page = notFoundFile(root, path);
    if (!page) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(404, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : await readFile(page));
  }
};
// 처리 중 예상하지 못한 오류가 나도 서버를 끄지 않고 해당 요청만 500으로 끝낸다
const server = http.createServer((req, res) => handle(req, res).catch(error => {
  console.error(`요청 처리 오류 (${req.url}): ${error.message}`);
  if (!res.headersSent) res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
  res.end();
}));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`STOCK PIA preview: http://127.0.0.1:${port}`));
