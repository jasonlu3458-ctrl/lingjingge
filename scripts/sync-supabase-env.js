// 同步 Supabase 三个变量到 Vercel 三套环境
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN;
const PROJ = 'prj_7oE4h8MKmL9vzrNFBpxIrBWdLM3b';
const ENV_FILE = path.resolve(__dirname, '..', '.env.local');

if (!TOKEN) { console.error('需要 VERCEL_TOKEN env'); process.exit(1); }

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: 'api.vercel.com', path: urlPath,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const t = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(t) }); }
        catch { resolve({ status: res.statusCode, body: null, raw: t }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function readEnv() {
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const map = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*(NEXT_PUBLIC_SUPABASE_[A-Z_]+|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*(.+?)\s*$/);
    if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return map;
}

(async () => {
  const vars = readEnv();
  const keys = Object.keys(vars);
  console.log('待同步变量:', keys);
  for (const k of keys) console.log(`  ${k} = ${vars[k].slice(0, 12)}...`);

  const list = await api('GET', `/v10/projects/${PROJ}/env?decrypt=true`);
  const existing = {};
  for (const e of (list.body?.envs || [])) existing[e.key] = e;

  for (const k of keys) {
    const v = vars[k];
    const isPublic = k.startsWith('NEXT_PUBLIC_');
    const targets = isPublic ? ['production', 'preview', 'development'] : ['production', 'preview'];

    if (existing[k]) {
      console.log(`PATCH  ${k}`);
      const r = await api('PATCH', `/v10/projects/${PROJ}/env/${existing[k].id}`, { value: v, target: targets });
      console.log(`       → ${r.status} ${r.body?.error?.message || 'ok'}`);
    } else {
      console.log(`POST   ${k}`);
      const r = await api('POST', `/v10/projects/${PROJ}/env`, { key: k, value: v, type: 'sensitive', target: targets });
      console.log(`       → ${r.status} ${r.body?.error?.message || 'ok'}`);
    }
  }
  console.log('\n=== 验证 ===');
  const verify = await api('GET', `/v10/projects/${PROJ}/env?decrypt=true`);
  for (const k of keys) {
    const e = (verify.body?.envs || []).find((x) => x.key === k);
    console.log(`  ${k}: ${e ? `OK [${e.target.join(',')}]` : '❌ MISSING'}`);
  }
})();
