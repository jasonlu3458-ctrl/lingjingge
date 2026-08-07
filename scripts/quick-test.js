#!/usr/bin/env node
const http = require('http');
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m' };
const c = (col, s) => `${C[col]}${s}${C.reset}`;

const paths = ['/api/health', '/'];

function head(p) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: 3000, path: p, timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, size: data.length, body: data.slice(0, 200) }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout 60s' }); });
  });
}

(async () => {
  for (const p of paths) {
    const t0 = Date.now();
    const r = await head(p);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    if (r.error) console.log(c('red', `${dt}s FAIL  ${p}  (${r.error})`));
    else console.log(c('green', `${dt}s HTTP ${r.status}  ${p}  (${r.size}B)`));
  }
})();
