const r = await fetch('https://www.obgestion.com/landing/creme-verrue-tk');
const html = await r.text();
const m = html.match(/src="(\/assets\/index[^"]+\.js)"/);
if (!m) { console.log('No JS bundle found'); process.exit(1); }
const jsUrl = 'https://www.obgestion.com' + m[1];
console.log('JS Bundle:', jsUrl);
const js = await fetch(jsUrl);
const code = await js.text();

console.log('Contains gs-pipeline-app-2.vercel.app:', code.includes('gs-pipeline-app-2.vercel.app'));
console.log('Contains localhost:5000:', code.includes('localhost:5000'));

const snippets = [];
for (const pat of [/["']\/api["']/g, /["']https:\/\/gs-pipeline[^"']*["']/g]) {
  let match;
  while ((match = pat.exec(code)) !== null) {
    snippets.push(match[0]);
  }
}
console.log('API references found:', [...new Set(snippets)]);
