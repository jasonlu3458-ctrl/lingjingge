#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);

const p = spawn('npm.cmd', ['run', 'build'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});
p.stdout.on('data', (d) => process.stdout.write('[OUT] ' + d));
p.stderr.on('data', (d) => process.stderr.write('[ERR] ' + d));
p.on('close', (code) => {
  console.log('exit code: ' + code);
  process.exit(code || 0);
});
