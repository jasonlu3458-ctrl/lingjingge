const fs = require('fs');
(async () => {
  const r = await fetch('http://localhost:3000/');
  const t = await r.text();
  fs.writeFileSync('tmp-home.html', t);
  // extract __next_f.push chunks
  const matches = [...t.matchAll(/self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g)];
  console.log('RSC push chunks:', matches.length);
  let allRefs = new Set();
  for (const m of matches) {
    const raw = m[1].replace(/\\"/g,'"').replace(/\\\\/g,'\\');
    // find tsx and similar references
    const refs = raw.match(/"[A-Za-z0-9_\-\.\\\/\u4e00-\u9fa5@:]+"/g) || [];
    for (const ref of refs) {
      const clean = ref.slice(1, -1);
      if (clean.includes('.tsx') || clean.includes('.ts') || clean.includes('.css') || clean.includes('.mjs')) {
        allRefs.add(clean);
      }
    }
  }
  console.log('Referenced source files:');
  for (const ref of allRefs) console.log('  ', ref);
})();
