const r = await fetch('https://www.obgestion.com/landing/creme-verrue-tk');
const html = await r.text();
const m = html.match(/src="(\/assets\/index[^"]+\.js)"/);
if (!m) { console.log('No JS bundle found'); process.exit(1); }
const jsUrl = 'https://www.obgestion.com' + m[1];
console.log('Bundle:', m[1]);

const js = await fetch(jsUrl);
const code = await js.text();

// Find the exact API_URL value in the compiled code
const patterns = [
  /VITE_API_URL[^;]{0,50}/g,
  /baseURL:\s*["'][^"']*["']/g,
  /["']\/api["']/g,
  /["']http:\/\/localhost:5000\/api["']/g,
];

for (const pat of patterns) {
  const matches = code.match(pat);
  if (matches) {
    console.log(`Pattern ${pat}:`);
    [...new Set(matches)].forEach(m => console.log('  ', JSON.stringify(m)));
  }
}

// Check for the exact compiled API URL logic
const idx = code.indexOf('/api');
if (idx > -1) {
  const context = code.substring(Math.max(0, idx - 80), idx + 80);
  console.log('\nContext around /api:');
  console.log(JSON.stringify(context));
}
