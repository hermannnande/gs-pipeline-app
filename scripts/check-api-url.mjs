const r = await fetch('https://www.obgestion.com/landing/creme-verrue-tk');
const html = await r.text();
const m = html.match(/src="(\/assets\/index[^"]+)"/);
if (!m) { console.log('No JS bundle found'); process.exit(1); }
const jsUrl = 'https://www.obgestion.com' + m[1];
console.log('JS Bundle:', jsUrl);
const js = await fetch(jsUrl);
const code = await js.text();
const apiMatch = code.match(/VITE_API_URL[^,]*?"([^"]+)"/);
if (apiMatch) console.log('VITE_API_URL in bundle:', apiMatch[1]);
const localhostMatch = code.match(/localhost:5000/);
console.log('Contains localhost:5000:', !!localhostMatch);
const apiUrls = code.match(/https?:\/\/[^"'\s]*api[^"'\s]*/g);
if (apiUrls) {
  const unique = [...new Set(apiUrls)].filter(u => u.includes('api'));
  console.log('API URLs found in bundle:');
  unique.forEach(u => console.log('  ', u));
}
