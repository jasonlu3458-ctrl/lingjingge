const fs = require('fs');
(async () => {
  const r = await fetch('http://localhost:3000/');
  const t = await r.text();
  fs.writeFileSync('tmp-home.html', t);
  const refs = [...t.matchAll(/self\.__next_f\.push\(\[1,\s*"((?:\\.|[^"\\])*)"\]\)/g)];
  const tsxRefs = new Set();
  for (const m of refs) {
    const raw = m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const found = raw.match(/"[^"]+\.tsx?"/g) || [];
    for (const f of found) tsxRefs.add(f.slice(1, -1));
  }
  console.log('TSX modules referenced in RSC payload:');
  for (const r of tsxRefs) console.log('  ', r);
})();
