#!/usr/bin/env node
const http = require('http');
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', gray:'\x1b[90m' };
const c = (col, s) => `${C[col]}${s}${C.reset}`;

function get(path) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: 3000, path, timeout: 90000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

(async () => {
  console.log('=== 验证 LOGO 链接 ===\n');
  // 抓 /guan/lifecode 页面，看 Navbar LOGO 链接
  const r = await get('/guan/lifecode');
  if (r.error) { console.log(c('red', 'FAIL ' + r.error)); process.exit(1); }
  console.log(`HTTP ${r.status}  /guan/lifecode  (${r.body.length} bytes)`);
  // 找 nav 区域里的 href="/xxx"
  const navMatch = r.body.match(/<nav[\s\S]*?<\/nav>/);
  if (!navMatch) { console.log(c('red', 'FAIL: 没找到 <nav>')); process.exit(1); }
  const nav = navMatch[0];
  // 找 LOGO 区域（通常有 logo.png 或 灵境阁字样）
  const logoMatch = nav.match(/href="(\/[a-z]*)"[^>]*aria-label="[^"]*首页[^"]*"/i) ||
                    nav.match(/href="(\/[^"]*)"[^>]*>\s*<img[^>]*alt="灵境阁"/i) ||
                    nav.match(/<img[^>]*alt="灵境阁"[^>]*>\s*<\/a>|<a[^>]*>\s*<img[^>]*alt="灵境阁"/i);
  // 更宽泛：找第一个 href="/..."
  const firstHrefMatch = nav.match(/href="(\/[^"]*)"/);
  if (firstHrefMatch) {
    const href = firstHrefMatch[1];
    if (href === '/') {
      console.log(c('green', `OK  LOGO 第一个链接 = "${href}"  (符合要求)`));
    } else if (href === '/home') {
      console.log(c('red', `FAIL  LOGO 第一个链接 = "${href}"  (还是 /home，未修复)`));
    } else {
      console.log(c('yellow', `WARN  LOGO 第一个链接 = "${href}"`));
    }
  }
  // 计数所有 href
  const allHrefs = [...nav.matchAll(/href="(\/[^"]*)"/g)].map(m => m[1]);
  const homeCount = allHrefs.filter(h => h === '/home').length;
  const rootCount = allHrefs.filter(h => h === '/').length;
  console.log(`  nav 区域 href 统计: "/"=${rootCount} 次, "/home"=${homeCount} 次, 共 ${allHrefs.length} 个`);
  if (homeCount > 0) {
    console.log(c('red', `  ✗ 还有 ${homeCount} 个 "/home" 链接未修复`));
  } else if (rootCount > 0) {
    console.log(c('green', `  ✓ 所有跳转都正确指向 "/"`));
  }
})();
