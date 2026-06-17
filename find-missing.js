// 找哪些引用模块在 chunks 中没有 factory 定义
const http = require('http');
const fs = require('fs');
const path = require('path');

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

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); }
  catch { return ''; }
}

function findModules(dir, allModules) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) findModules(fp, allModules);
    else if (f.endsWith('.js')) {
      const content = readFile(fp);
      // 匹配 webpack 模块定义
      const re = /"\((app-pages-browser|app-pages-internals|lib)\)\/\.\/([^\"]+)":/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        allModules.add(m[1] + ')/./' + m[2]);
      }
    }
  }
}

(async () => {
  const r = await get('/');
  // 引用
  const refs = new Set();
  const re = /\((app-pages-browser|app-pages-internals|lib)\)\/\.\/[^")\s,]+/g;
  let m;
  while ((m = re.exec(r.body)) !== null) {
    refs.add(m[0]);
  }
  // 实际定义
  const defined = new Set();
  findModules('.next/static/chunks', defined);

  console.log('=== 引用但未定义 (会导致 hydration 错误) ===');
  for (const ref of refs) {
    if (!defined.has(ref)) console.log('  ❌', ref);
  }
  console.log('\n=== 实际定义但未引用 ===');
  for (const d of defined) {
    if (!refs.has(d)) console.log('  ⚠️ ', d);
  }
  console.log(`\n引用总数: ${refs.size}, 定义总数: ${defined.size}`);
})();
