// 检查首页 HTML 引用了哪些 chunk
const http = require('http');
function get(p) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 3000, path: p, method: 'GET' }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', () => resolve({ status: 'ERR' }));
    req.end();
  });
}

(async () => {
  const r = await get('/');
  console.log('HTML status:', r.status, 'len:', r.body.length);
  // RSC 引用了哪些模块
  const re = /\(app-pages-browser\)\/\.\/[^")\s,]+/g;
  const refs = new Set();
  let m;
  while ((m = re.exec(r.body)) !== null) {
    refs.add(m[0].replace('(app-pages-browser)/./', ''));
  }
  console.log('\n=== RSC 引用到的模块 ===');
  for (const r of refs) console.log('  ', r);
  // 实际存在的 chunk
  console.log('\n=== _next/static/chunks 实际文件 ===');
  const fs = require('fs');
  const path = require('path');
  function list(dir, depth) {
    if (depth > 4) return;
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) list(fp, depth + 1);
      else if (f.endsWith('.js')) console.log('  ', fp.replace(/.*\.next\\static\\chunks\\?/, ''));
    }
  }
  list('.next/static/chunks', 0);
})();
