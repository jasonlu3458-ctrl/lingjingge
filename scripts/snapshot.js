#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
process.chdir(root);

console.log('=== node processes ===');
try {
  const out = execSync('powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, StartTime, CPU, WS | Format-Table -AutoSize -HideTableHeaders"', { encoding: 'utf8' });
  console.log(out);
} catch (e) { console.log('err: ' + e.message); }

console.log('=== .next/ ===');
if (fs.existsSync(path.join(root, '.next'))) {
  const items = fs.readdirSync(path.join(root, '.next'), { withFileTypes: true });
  items.forEach((it) => {
    const stat = fs.statSync(path.join(root, '.next', it.name));
    console.log(`  ${it.isDirectory() ? 'd' : 'f'} ${it.name.padEnd(30)} ${stat.size} bytes  ${stat.mtime.toISOString()}`);
  });
} else {
  console.log('  not exists');
}

console.log('=== BUILD_ID ===');
if (fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.log('  ' + fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8').trim());
} else {
  console.log('  MISSING');
}
