#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/diagnose.js
 * 灵境阁综合诊断：检查进程 / 端口 / 目录 / 关键文件
 * 用法：node scripts/diagnose.js
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const C = { reset:'\x1b[0m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', gray:'\x1b[90m' };
const c = (color, s) => `${C[color]}${s}${C.reset}`;
const root = path.resolve(__dirname, '..');
process.chdir(root);

const out = [];
const log = (m) => out.push(m);
const ok = (m) => log(c('green', '  ✓ ' + m));
const warn = (m) => log(c('yellow', '  ! ' + m));
const err = (m) => log(c('red', '  ✗ ' + m));
const info = (m) => log(c('cyan', '  · ' + m));

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', (e) => resolve(e.code === 'EADDRINUSE'));
    s.once('listening', () => s.close(() => resolve(false)));
    s.listen(port, '127.0.0.1');
  });
}

(async () => {
  log(c('cyan', '\n========== 灵境阁 综合诊断 ==========\n'));
  info(`CWD: ${root}`);

  // 1) Node / npm 版本
  log(c('cyan', '\n[1/8] Node / npm'));
  try {
    const nodeV = execSync('node -v', { encoding: 'utf8' }).trim();
    const npmV = execSync('npm -v', { encoding: 'utf8' }).trim();
    ok(`node ${nodeV} / npm ${npmV}`);
  } catch (e) { err('Node 或 npm 未安装: ' + e.message); }

  // 2) node_modules
  log(c('cyan', '\n[2/8] node_modules'));
  if (fs.existsSync(path.join(root, 'node_modules'))) {
    const stats = fs.statSync(path.join(root, 'node_modules'));
    ok(`存在 (修改时间: ${stats.mtime.toISOString().slice(0,19)})`);
  } else {
    err('缺失！请运行 npm install');
  }

  // 3) .env.local
  log(c('cyan', '\n[3/8] .env.local'));
  if (fs.existsSync(path.join(root, '.env.local'))) {
    const content = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
    ok(`存在 (${lines.length} 行配置)`);
    const mockMatch = content.match(/NEXT_PUBLIC_USE_MOCK_SUPABASE\s*=\s*(\S+)/);
    if (mockMatch) {
      const mock = mockMatch[1].trim();
      if (mock === 'true') {
        warn(`NEXT_PUBLIC_USE_MOCK_SUPABASE=true (mock 模式) - 仅能浏览 UI，登录/订单/支付失效`);
      } else {
        ok(`NEXT_PUBLIC_USE_MOCK_SUPABASE=${mock} (真 Supabase 模式)`);
      }
    } else {
      err('NEXT_PUBLIC_USE_MOCK_SUPABASE 未设置');
    }
    const appUrl = content.match(/NEXT_PUBLIC_APP_URL\s*=\s*(\S+)/);
    if (appUrl) info(`NEXT_PUBLIC_APP_URL=${appUrl[1]}`);
    const supabaseUrl = content.match(/^SUPABASE_URL\s*=\s*(\S+)/m);
    if (supabaseUrl) {
      ok(`SUPABASE_URL=${supabaseUrl[1].slice(0, 30)}...`);
    } else {
      err('SUPABASE_URL 缺失（只有 NEXT_PUBLIC_ 前缀的）');
    }
    const serviceKey = content.match(/^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(\S+)/m);
    if (serviceKey) {
      ok(`SUPABASE_SERVICE_ROLE_KEY 已配置 (${serviceKey[1].length} 字符)`);
    } else {
      err('SUPABASE_SERVICE_ROLE_KEY 缺失（必须，否则后台/上传/海报失败）');
    }
    const difyKey = content.match(/^DIFY_API_KEY\s*=\s*(\S+)/m);
    if (difyKey) ok(`DIFY_API_KEY 已配置`);
    else err('DIFY_API_KEY 缺失（阿阇梨主 key）');
  } else {
    err('缺失！请复制 .env.local.example');
  }

  // 4) .next / BUILD_ID
  log(c('cyan', '\n[4/8] .next / BUILD_ID'));
  if (fs.existsSync(path.join(root, '.next'))) {
    const buildIdPath = path.join(root, '.next', 'BUILD_ID');
    if (fs.existsSync(buildIdPath)) {
      const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
      ok(`BUILD_ID = ${buildId}`);
    } else {
      err('.next/ 存在但 BUILD_ID 缺失 → build 未完成');
    }
  } else {
    err('.next/ 不存在 → 从未 build 过');
  }

  // 5) 端口检查
  log(c('cyan', '\n[5/8] 端口 3000'));
  if (await portInUse(3000)) {
    err('3000 端口被占用');
    // 找占用进程
    try {
      const r = execSync('powershell -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess | Format-Table -HideTableHeaders"', { encoding: 'utf8' });
      info('占用进程:'); log(c('gray', r.split('\n').filter(l=>l.trim()).map(l=>'      '+l).join('\n')));
    } catch {}
  } else {
    ok('3000 端口空闲');
  }

  // 6) next start 进程
  log(c('cyan', '\n[6/8] next 进程'));
  try {
    const procs = execSync('powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize -HideTableHeaders"', { encoding: 'utf8' });
    const lines = procs.split('\n').filter(l => l.trim() && /\d/.test(l));
    if (lines.length === 0) ok('无 node 进程');
    else info(`node 进程 (${lines.length}):`); lines.forEach(l => log(c('gray', '      ' + l.trim())));
  } catch (e) { warn('无法查询进程: ' + e.message); }

  // 7) 关键文件
  log(c('cyan', '\n[7/8] 关键文件'));
  const keyFiles = [
    'package.json', 'next.config.js', 'vercel.json', 'tsconfig.json',
    'src/middleware.ts', 'src/app/layout.tsx', 'src/app/page.tsx',
    'src/app/(muxintang)/layout.tsx', 'src/app/(muxintang)/page.tsx',
    'src/lib/supabase.ts', 'src/lib/tenant.ts',
  ];
  for (const f of keyFiles) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) ok(f);
    else err(f + ' 缺失');
  }

  // 8) 总结
  log(c('cyan', '\n[8/8] 总结'));
  const hasNext = fs.existsSync(path.join(root, '.next', 'BUILD_ID'));
  const hasEnv = fs.existsSync(path.join(root, '.env.local'));
  const portFree = !(await portInUse(3000));

  if (!hasNext) {
    err('首要问题: 未 build');
    log(c('yellow', '\n  修复命令:'));
    log(c('white', '    node scripts/dev-start.js  (一键 build + start)'));
  }
  if (!hasEnv) {
    err('次要问题: .env.local 缺失');
  }
  if (!portFree && hasNext) {
    warn('端口被占 + 已 build → 可能是旧的 next start 没退');
    log(c('yellow', '\n  修复命令:'));
    log(c('white', '    powershell -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"'));
  }
  if (hasNext && hasEnv && portFree) {
    ok('环境就绪，可以启动');
    log(c('yellow', '\n  启动命令: node scripts/dev-start.js --skip'));
  }

  log(c('cyan', '\n========================================\n'));
  process.stdout.write(out.join('\n') + '\n');
})();
