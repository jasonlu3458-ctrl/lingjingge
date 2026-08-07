#!/usr/bin/env node
const http = require('http');
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m' };
const c = (col, s) => `${C[col]}${s}${C.reset}`;

function get(p) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: 3000, path: p, timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

(async () => {
  console.log('=== 测试 1：基础 /jixiangju 页面 ===');
  const a = await get('/jixiangju');
  if (a.error) { console.log(c('red', 'FAIL ' + a.error)); return; }
  console.log(c('green', `HTTP ${a.status}  /jixiangju  (${a.body.length} bytes)`));

  console.log('\n=== 测试 2：带 ?category=爱宠配饰 参数 ===');
  const b = await get('/jixiangju?category=' + encodeURIComponent('爱宠配饰'));
  if (b.error) { console.log(c('red', 'FAIL ' + b.error)); return; }
  console.log(c('green', `HTTP ${b.status}  /jixiangju?category=爱宠配饰  (${b.body.length} bytes)`));

  // 检查页面是否包含"爱宠配饰"分类（应在导航激活状态出现）
  const hasAichongCategory = b.body.includes('爱宠配饰');
  console.log(c(hasAichongCategory ? 'green' : 'red',
    hasAichongCategory ? '✓ 页面包含"爱宠配饰"分类文案' : '✗ 页面未包含"爱宠配饰"分类'));

  // 检查激活态类名（activeCategory === '爱宠配饰' 时按钮带 bg-[#8B4513]）
  const isActive = b.body.includes('爱宠配饰') && b.body.includes('爱宠配饰');
  console.log(c('gray', '  注：客户端 useSearchParams 在 SSR HTML 中不生效，需在浏览器中看效果'));

  console.log('\n=== 测试 3：Navbar 爱宠屋菜单 "吉祥配饰" 链接 ===');
  // / 首页不显示 Navbar（immersive 模式），用 /guan/lifecode 测试主站 Navbar
  const c1 = await get('/guan/lifecode');
  if (c1.error) { console.log(c('red', 'FAIL ' + c1.error)); return; }
  console.log(c('green', `HTTP ${c1.status}  /guan/lifecode  (${c1.body.length} bytes)`));
  // 主站 Navbar 顶层 link 一定在 SSR HTML 中（activeMenu state 不影响 label 渲染）
  const targetHref = '/jixiangju?category=' + encodeURIComponent('爱宠配饰');
  const hasNewLink = c1.body.includes(targetHref);
  const hasOldLink = c1.body.includes('href="/pet/accessories"');
  console.log(c(hasNewLink ? 'green' : 'red',
    hasNewLink ? '✓ 全站 HTML 含新链接 ' + targetHref : '✗ 全站 HTML 不含新链接'));
  console.log(c(hasOldLink ? 'red' : 'green',
    hasOldLink ? '✗ 全站 HTML 还含旧链接 /pet/accessories' : '✓ 旧链接 /pet/accessories 已清除'));
  // 列出文中所有 /pet/* href 上下文
  const petLinks = [...c1.body.matchAll(/href="(\/pet[^"]*)"/g)].map(m => m[1]);
  const uniq = [...new Set(petLinks)];
  console.log(c('gray', '  文中所有 /pet/* 链接: ' + JSON.stringify(uniq)));
  const jjLinks = [...c1.body.matchAll(/href="(\/jixiangju[^"]*)"/g)].map(m => m[1]);
  console.log(c('gray', '  文中所有 /jixiangju* 链接: ' + JSON.stringify([...new Set(jjLinks)])));

  console.log('\n=== 完成 ===');
})();
