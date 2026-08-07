#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/build-and-serve.js
 * 一次性完成 build + start + 健康检查（不被外部工具中断）
 *
 * 用法：
 *   node scripts/build-and-serve.js                # 全流程
 *   node scripts/build-and-serve.js --skip-build   # 已有 .next/BUILD_ID
 *   node scripts/build-and-serve.js --port 3001
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const portIdx = args.indexOf('--port');
const PORT = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3000;

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;
const root = path.resolve(__dirname, '..');
process.chdir(root);

function step(n, total, msg) { return c('cyan', `[${n}/${total}] ${msg}`); }
function ok(m) { console.log(c('green', '  OK ' + m)); }
function warn(m) { console.log(c('yellow', '  WARN ' + m)); }
function err(m) { console.log(c('red', '  FAIL ' + m)); }
function info(m) { console.log(c('gray', '  · ' + m)); }

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', (e) => resolve(e.code === 'EADDRINUSE'));
    s.once('listening', () => s.close(() => resolve(false)));
    s.listen(port, '127.0.0.1');
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForPort(port, timeoutSec = 30) {
  for (let i = 0; i < timeoutSec; i++) {
    if (await portInUse(port)) return true;
    await sleep(1000);
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return false;
}

function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ ok: true, status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
  });
}

function curlHead(port, pathStr) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: pathStr, method: 'GET', timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 500) }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

function killPort(port) {
  try {
    spawnSync('powershell', [
      '-Command',
      `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
    ], { stdio: 'ignore' });
  } catch {}
}

function killAllNode() {
  try {
    spawnSync('powershell', [
      '-Command',
      `Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-30) } | Stop-Process -Force`
    ], { stdio: 'ignore' });
  } catch {}
}

(async () => {
  console.log('');
  console.log(c('cyan', '========================================'));
  console.log(c('cyan', ' 灵境阁 Build & Serve (port=' + PORT + ')'));
  console.log(c('cyan', '========================================'));
  console.log('');
  info('CWD: ' + root);

  // 0) 杀旧进程
  console.log(step(1, 5, '清理旧进程和端口 ...'));
  killPort(PORT);
  await sleep(500);
  if (await portInUse(PORT)) {
    err(`端口 ${PORT} 仍被占用，请手动清理`);
    process.exit(1);
  }
  ok('端口空闲');

  // 1) build
  if (!skipBuild) {
    if (fs.existsSync(path.join(root, '.next'))) {
      fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
      info('已清理旧 .next/');
    }
    console.log(step(2, 5, '运行 npm run build (首次 3-7 分钟) ...'));
    const t0 = Date.now();
    const buildCode = await new Promise((resolve) => {
      const p = spawn('npm.cmd', ['run', 'build'], {
        cwd: root,
        stdio: 'inherit',
        shell: true,
      });
      p.on('close', (code) => resolve(code || 0));
      p.on('error', (e) => { err('build 启动失败: ' + e.message); resolve(-1); });
    });
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    info(`build 退出码 ${buildCode}, 耗时 ${sec}s`);
    if (buildCode !== 0) {
      err('build 失败');
      process.exit(1);
    }
    if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
      err('BUILD_ID 缺失，build 未完成');
      process.exit(1);
    }
    const buildId = fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8').trim();
    ok(`BUILD_ID = ${buildId}`);
  } else {
    console.log(step(2, 5, '跳过 build (--skip-build)'));
    if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
      err('BUILD_ID 不存在，无法跳过 build');
      process.exit(1);
    }
    ok('已检测到 BUILD_ID');
  }

  // 2) 启动
  console.log(step(3, 5, '启动 next start (后台) ...'));
  if (!fs.existsSync(path.join(root, '.next'))) fs.mkdirSync(path.join(root, '.next'));
  const outLog = fs.openSync(path.join(root, '.next', 'start.log'), 'w');
  const errLog = fs.openSync(path.join(root, '.next', 'start.err'), 'w');
  const proc = spawn('npm.cmd', ['start', '--', '-p', String(PORT)], {
    cwd: root,
    detached: true,
    stdio: ['ignore', outLog, errLog],
    shell: true,
  });
  proc.unref();
  ok(`PID: ${proc.pid}`);

  // 3) 等就绪
  console.log(step(4, 5, `等待端口 ${PORT} 就绪 (最多 60s) ...`));
  const ready = await waitForPort(PORT, 60);
  if (!ready) {
    err('端口未就绪');
    info('start.err 尾部:');
    const errTxt = fs.readFileSync(path.join(root, '.next', 'start.err'), 'utf8');
    errTxt.split(/\r?\n/).slice(-20).forEach((l) => console.log('    ' + c('gray', l)));
    process.exit(1);
  }
  ok(`端口 ${PORT} 监听中`);

  // 4) 健康检查
  console.log(step(5, 5, '健康检查 ...'));
  const h = await checkHealth(PORT);
  if (h.ok) {
    ok(`/api/health HTTP ${h.status}`);
    info('body: ' + h.body);
  } else {
    warn('/api/health 失败: ' + h.error);
    info('这可能是因为 .env.local 缺 SUPABASE_URL 等关键变量（见诊断报告）');
  }

  // 5) 关键路径
  console.log('');
  console.log(c('cyan', '--- 关键路径测试 ---'));
  const paths = ['/', '/muxintang', '/guan/lifecode', '/wen/zen', '/zang'];
  for (const p of paths) {
    const r = await curlHead(PORT, p);
    if (r.status) {
      const color = r.status < 400 ? 'green' : r.status < 500 ? 'yellow' : 'red';
      console.log(`  ${c(color, 'HTTP ' + r.status)}  ${p}`);
    } else {
      console.log(`  ${c('red', 'FAIL')}  ${p}  (${r.error})`);
    }
  }

  // 总结
  console.log('');
  console.log(c('cyan', '========================================'));
  console.log(c('green', ' ✅ 服务已启动'));
  console.log(c('cyan', '========================================'));
  console.log('');
  console.log('  本地访问：');
  console.log('    ' + c('white', `http://localhost:${PORT}/`));
  console.log('    ' + c('white', `http://localhost:${PORT}/muxintang`));
  console.log('');
  console.log('  日志：');
  console.log('    ' + c('gray', `tail -f .next/start.log`));
  console.log('    ' + c('gray', `tail -f .next/start.err`));
  console.log('');
  console.log('  停止：');
  console.log('    ' + c('gray', `node scripts/build-and-serve.js --kill`));
  console.log('    ' + c('gray', `或: Get-Process -Name node | Stop-Process -Force`));
  console.log('');
})().catch((e) => { err('未捕获错误: ' + e.message); console.error(e); process.exit(1); });
