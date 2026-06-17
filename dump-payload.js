const fs = require('fs');
const t = fs.readFileSync('tmp-home.html', 'utf8');
const matches = [...t.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g)];
for (let i = 0; i < matches.length; i++) {
  const raw = matches[i][1].replace(/\\"/g,'"').replace(/\\\\/g,'\\').replace(/\\n/g,'\n');
  console.log('=== chunk', i, '===');
  console.log(raw.slice(0, 1500));
  console.log('...');
}
