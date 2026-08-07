#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/dev-start.js
 * 灵境阁本地一键启动（生产模式，绕开 PowerShell 5.1 解析坑）
 * 流程：清理 .next → npm run build → npm start → 等端口就绪 → 健康检查
 *
 * 用法：
 *   node scripts/dev-start.js           # 完整 build + start
 *   node scripts/dev-start.js --skip    # 跳过 build（已有 .next/BUILD_ID）
 *   node scripts/dev-start.js --port 3001
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip');
const portIdx = args.indexOf('--port');
const PORT = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3000;

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;

const root = path.resolve(__dirname, '..');
process.chdir(root);

function log(msg) { console.log(c('cyan', msg)); }
function ok(msg)  { console.log(c('green', msg)); }
function warn(msg){ console.log(c('yellow', msg)); }
function err(msg) { console.log(c('red', msg)); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => resolve(code));
  });
}

function portInUse(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.once('error', (e) => resolve(e.code === 'EADDRINUSE'));
    server.once('listening', () => server.close(() => resolve(false)));
    server.listen(port, '127.0.0.1');
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

(async () => {
  console.log('');
  log(`==> Lingjingge Dev Start (port=${PORT}, skipBuild=${skipBuild})`);
  log(`==> CWD: ${root}`);
  console.log('');

  // 0) .env.local 检查
  if (!fs.existsSync(path.join(root, '.env.local'))) {
    err('  ! .env.local 不存在，请先复制 .env.local.example 并填入密钥');
    process.exit(1);
  }

  // 1) 端口检查
  log(`[1/5] 检查端口 ${PORT} ...`);
  if (await portInUse(PORT)) {
    err(`  ! 端口 ${PORT} 已被占用`);
    err(`    杀掉命令: Get-NetTCPConnection -LocalPort ${PORT} -State Listen | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }`);
    process.exit(1);
  }
  ok('  OK 端口空闲');

  // 2) build
  if (!skipBuild) {
    if (fs.existsSync(path.join(root, '.next'))) {
      log('[2/5] 清理旧 .next/ ...');
      fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
    }
    log('[2/5] 跑 next build (首次 2-5 分钟，请耐心等待) ...');
    const t0 = Date.now();
    const code = await run('npm.cmd', ['run', 'build']);
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    log(`==> build 完成 ${sec}s  退出码 ${code}`);
    if (code !== 0) {
      err('  ! build 失败，查看 .next\\build.err');
      process.exit(1);
    }
    if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
      err('  ! .next\\BUILD_ID 缺失，build 未完成');
      process.exit(1);
    }
  } else {
    log('[2/5] 跳过 build');
    if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
      err('  ! SkipBuild 模式但 .next\\BUILD_ID 不存在，请去掉 --skip 先跑 build');
      process.exit(1);
    }
  }

  // 3) 启动
  log('[3/5] 启动 next start (后台) ...');
  const out = fs.openSync(path.join(root, '.next', 'start.log'), 'w');
  const err2 = fs.openSync(path.join(root, '.next', 'start.err'), 'w');
  const proc = spawn('npm.cmd', ['start', '--', '-p', String(PORT)], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out, err2],
    shell: true,
  });
  proc.unref();
  ok(`  PID: ${proc.pid}`);

  // 4) 等就绪
  log(`[4/5] 等待端口 ${PORT} 就绪 (最多 30s) ...`);
  const ready = await waitForPort(PORT, 30);
  if (!ready) {
    err('  ! 端口未就绪，查看 .next\\start.err');
    const errLog = path.join(root, '.next', 'start.err');
    if (fs.existsSync(errLog)) {
      const lines = fs.readFileSync(errLog, 'utf8').split(/\r?\n/).slice(-30);
      lines.forEach((l) => console.log('    ' + c('gray', l)));
    }
    process.exit(1);
  }
  ok(`  OK 端口 ${PORT} 监听中`);

  // 5) 健康检查
  log('[5/5] 健康检查 /api/health ...');
  const h = await checkHealth(PORT);
  if (h.ok) {
    ok(`  HTTP ${h.status}  body: ${h.body}`);
  } else {
    err(`  ! 健康检查失败: ${h.error}`);
  }

  console.log('');
  ok('==> 启动完成 ✅');
  console.log('');
  console.log(c('cyan', '本地访问地址：'));
  console.log('  ' + c('white', `http://localhost:${PORT}/`));
  console.log('  ' + c('white', `http://localhost:${PORT}/muxintang`));
  console.log('  ' + c('white', `http://localhost:${PORT}/api/health`));
  console.log('');
  console.log(c('cyan', '日志文件：'));
  console.log('  ' + c('gray', `tail -f .next\\start.log`));
  console.log('  ' + c('gray', `tail -f .next\\start.err`));
  console.log('');
  console.log(c('gray', `停止服务: Stop-Process -Id ${proc.pid} -Force`));
  console.log('');
})();
