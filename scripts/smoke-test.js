#!/usr/bin/env node
const http = require('http');
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m' };
const c = (col, s) => `${C[col]}${s}${C.reset}`;

const paths = ['/', '/muxintang', '/guan/lifecode', '/guan/wealth', '/guan/family', '/wen/zen', '/wen/light-solution', '/zang', '/zang/library', '/zang/library/laozi/dao-de-jing-chapter-1', '/tong/signup', '/api/health', '/disclaimer', '/privacy', '/terms'];

let done = 0;
paths.forEach((p) => {
  const req = http.get({ host: '127.0.0.1', port: 3000, path: p, timeout: 15000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const color = res.statusCode < 400 ? 'green' : res.statusCode < 500 ? 'yellow' : 'red';
      console.log(c(color, `HTTP ${res.statusCode}  ${p}`) + c('gray', `  (${data.length} bytes)`));
      if (++done === paths.length) console.log('\n完成');
    });
  });
  req.on('error', (e) => {
    console.log(c('red', `FAIL    ${p}  ${e.message}`));
    if (++done === paths.length) console.log('\n完成');
  });
});
