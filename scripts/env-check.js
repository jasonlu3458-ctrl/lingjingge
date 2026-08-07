#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/env-check.js
 * 检查 .env.local 是否包含所有必需环境变量（不读真实值，只看缺啥）
 * 用法：node scripts/env-check.js
 */
const fs = require('fs');
const path = require('path');

const REQUIRED = [
  // 基础
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_USE_MOCK_SUPABASE',
  // Supabase
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  // Dify
  'DIFY_API_KEY',
  'DIFY_PUSH_API_KEY',
  // Web Push
  'WEB_PUSH_VAPID_PUBLIC_KEY',
  'WEB_PUSH_VAPID_PRIVATE_KEY',
  'WEB_PUSH_VAPID_SUBJECT',
  'NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY',
  // 支付
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  // AI 语音
  'SILICONFLOW_API_KEY',
  // Cron
  'CRON_SECRET',
];

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log(c('red', '  ! .env.local 不存在'));
  process.exit(1);
}

const text = fs.readFileSync(envPath, 'utf8');
const defined = new Set();
for (const line of text.split(/\r?\n/)) {
  const trim = line.trim();
  if (!trim || trim.startsWith('#')) continue;
  const m = trim.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
  if (m) defined.add(m[1]);
}

console.log('');
console.log(c('cyan', '==> 环境变量自检（不读真实值）'));
console.log(c('cyan', `==> 已配置: ${defined.size} 个  |  期望: ${REQUIRED.length} 个`));
console.log('');

const missing = REQUIRED.filter((k) => !defined.has(k));
if (missing.length === 0) {
  console.log(c('green', 'OK 所有必需变量均已配置 ✅'));
  process.exit(0);
} else {
  console.log(c('red', `FAIL 缺失 ${missing.length} 个关键变量:`));
  for (const k of missing) {
    console.log(c('yellow', `  - ${k}`));
  }
  console.log('');
  console.log(c('gray', '参考 .env.local.example 或从 Vercel 控制台复制。'));
  process.exit(1);
}
