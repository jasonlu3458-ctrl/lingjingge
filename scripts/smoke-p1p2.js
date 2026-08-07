#!/usr/bin/env node
/**
 * 烟雾测试：12 关键路径（form-first + blind-box + muxintang）
 */
const http = require('http');

const paths = [
  '/api/health',
  '/',
  '/muxintang',
  '/wen/tuibei',
  '/wen/astrology',
  '/wen/zodiac',
  '/wen/name',
  '/wen/dream',
  '/wen/yili',
  '/wen/zen',
  '/muxintang/tools/bazi',
  '/guan/lifecode',
  '/zang',
];

let done = 0;
paths.forEach((p) => {
  http
    .get(`http://localhost:3000${p}`, (res) => {
      const size = res.headers['content-length'] || '?';
      const status = res.statusCode === 200 ? '✓' : res.statusCode;
      console.log(`${status}  ${p}  (${size} bytes)`);
      done++;
      if (done === paths.length) console.log('完成');
    })
    .on('error', (e) => {
      console.log(`ERR ${p}  ${e.message}`);
      done++;
      if (done === paths.length) console.log('完成');
    });
});
