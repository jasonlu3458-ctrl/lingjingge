#!/usr/bin/env node
/**
 * 一键把 .env.local 里所有 DIFY_*_API_KEY 同步到 Vercel
 *
 * 用法（三种方式，按优先级）：
 *   1) 环境变量：  export VERCEL_TOKEN=...; node scripts/sync-dify-env-via-api.js
 *   2) CLI 参数：  node scripts/sync-dify-env-via-api.js --token=vcp_xxx --project=prj_xxx
 *   3) .vercel 配置文件（自动检测 projectId / orgId）
 *
 * ⚠️ 千万不要把 token 写进源码！本仓库已配置 pre-commit 防护。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_FILE = path.resolve(__dirname, '..', '.env.local');
const VERCEL_PROJECT_FILE = path.resolve(__dirname, '..', '.vercel', 'project.json');

// 解析参数
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v || 'true'];
    }),
);

const TOKEN = process.env.VERCEL_TOKEN || args.token;
if (!TOKEN) {
  console.error('❌ 未找到 Vercel Token。请用以下任一方式提供：');
  console.error('   export VERCEL_TOKEN=vcp_xxx');
  console.error('   node scripts/sync-dify-env-via-api.js --token=vcp_xxx');
  process.exit(1);
}

let PROJ = args.project;
if (!PROJ && fs.existsSync(VERCEL_PROJECT_FILE)) {
  PROJ = JSON.parse(fs.readFileSync(VERCEL_PROJECT_FILE, 'utf8')).projectId;
}
if (!PROJ) {
  console.error('❌ 未找到 Vercel Project ID。请用 --project=prj_xxx 指定');
  console.error('   （或确保项目根目录有 .vercel/project.json）');
  process.exit(1);
}

console.log(`Project: ${PROJ}`);
console.log(`Token:   ${TOKEN.slice(0, 8)}...${TOKEN.slice(-4)}`);

function readDifyVars() {
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const map = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^DIFY_[A-Z_]+\s*=\s*(.+)$/);
    if (!m) continue;
    const key = line.split('=')[0].trim();
    let val = m[1].trim();
    // 去掉首尾引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // 跳过占位符
    if (/^__FILL_IN_/i.test(val) || /^<.+>$/.test(val) || /^your-/i.test(val)) {
      console.log(`   SKIP (placeholder): ${key}`);
      continue;
    }
    map[key] = val;
  }
  return map;
}

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: 'api.vercel.com',
      path: urlPath,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({ status: res.statusCode, body: json, raw: text });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('==== 1. 读取 .env.local ====');
  const difyVars = readDifyVars();
  const keys = Object.keys(difyVars).sort();
  console.log(`找到 ${keys.length} 个 DIFY 密钥：`);
  for (const k of keys) {
    const v = difyVars[k];
    const mask = v.length > 14 ? v.slice(0, 12) + '...' : v;
    console.log(`  ${k} = ${mask}`);
  }
  console.log('');

  console.log('==== 2. 拉取 Vercel 现有 env ====');
  const listRes = await api('GET', `/v10/projects/${PROJ}/env`);
  if (listRes.status !== 200) {
    console.log(`  GET 失败：HTTP ${listRes.status}`, listRes.raw);
    process.exit(1);
  }
  const existingMap = {};
  for (const e of (listRes.body.envs || [])) {
    existingMap[e.key] = e.id;
  }
  console.log(`  已有 ${Object.keys(existingMap).length} 个 env: ${Object.keys(existingMap).join(', ')}`);
  console.log('');

  console.log('==== 3. 逐个同步 ====');
  let ok = 0, fail = 0, created = 0, updated = 0;
  const targets = ['production', 'preview', 'development'];
  for (const k of keys) {
    const v = difyVars[k];
    if (existingMap[k]) {
      // 更新
      const envId = existingMap[k];
      const r = await api('PATCH', `/v10/projects/${PROJ}/env/${envId}`, { value: v });
      if (r.status === 200 || r.status === 201) {
        console.log(`  ✓ PATCH  ${k}`);
        ok++; updated++;
      } else {
        console.log(`  ✗ PATCH  ${k}  HTTP ${r.status}`, r.raw.slice(0, 200));
        fail++;
      }
    } else {
      // 新建
      const r = await api('POST', `/v10/projects/${PROJ}/env`, {
        key: k, value: v, type: 'encrypted', target: targets,
      });
      if (r.status === 200 || r.status === 201) {
        console.log(`  ✓ CREATE ${k}`);
        ok++; created++;
      } else {
        console.log(`  ✗ CREATE ${k}  HTTP ${r.status}`, r.raw.slice(0, 200));
        fail++;
      }
    }
  }

  console.log('');
  console.log('==== 4. 结果 ====');
  console.log(`  成功: ${ok}  (新建 ${created} / 更新 ${updated})`);
  console.log(`  失败: ${fail}`);

  console.log('');
  console.log('==== 5. 验证：拉取最新 env 列表 ====');
  const final = await api('GET', `/v10/projects/${PROJ}/env`);
  const allKeys = (final.body.envs || []).map((e) => e.key);
  const difyKeys = allKeys.filter((k) => k.startsWith('DIFY_'));
  console.log(`  所有 env (${allKeys.length}): ${allKeys.join(', ')}`);
  console.log(`  DIFY_* 服务端变量: ${difyKeys.length} 个`);
  console.log('');
  if (difyKeys.length >= 13) {
    console.log('🎉 同步完成！Vercel 即将自动重新部署（或手动 git push 触发）。');
  } else {
    console.log(`⚠️  DIFY 变量数量不足 13，请检查上方失败项。`);
    process.exit(1);
  }
})();
