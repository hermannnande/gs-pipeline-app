const API_URL = 'https://gs-pipeline-app-2.vercel.app/api';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  return (await res.json()).token;
}

const token = await login();

// === creme-anti-verrue (V1) ===
{
  const slug = 'creme-anti-verrue';
  console.log(`\n=== ${slug} ===`);
  const tpl = await fetch(`${API_URL}/templates/public/${slug}`);
  const data = await tpl.json();
  const cfg = JSON.parse(data.template.config);

  cfg.prices = { "1": 9900, "2": 16000, "3": 24900 };
  cfg.qtyOptions = [
    { v: 1, label: "1 boite", sub: "9 900 FCFA", save: "" },
    { v: 2, label: "2 boites", sub: "16 000 FCFA", tag: "Populaire", save: "Economisez 3 800 F" },
    { v: 3, label: "3 boites", sub: "24 900 FCFA", tag: "Meilleure offre", save: "Economisez 4 800 F" },
  ];

  const update = await fetch(`${API_URL}/templates/${data.template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  console.log('  Update:', update.status);
  
  const v = await fetch(`${API_URL}/templates/public/${slug}`);
  const vc = JSON.parse((await v.json()).template.config);
  console.log('  prices:', JSON.stringify(vc.prices));
  console.log('  qtyOptions:', JSON.stringify(vc.qtyOptions));
}

// === creme-verrue-tk (V2) ===
{
  const slug = 'creme-verrue-tk';
  console.log(`\n=== ${slug} ===`);
  const tpl = await fetch(`${API_URL}/templates/public/${slug}`);
  const data = await tpl.json();
  const cfg = JSON.parse(data.template.config);

  cfg.prices = { "1": 9900, "2": 16000, "3": 24900 };
  cfg.qtyOptions = [
    { v: 1, label: "1 tube", sub: "9 900 FCFA", save: "" },
    { v: 2, label: "2 tubes", sub: "16 000 FCFA", tag: "Populaire", save: "Economisez 3 800 F" },
    { v: 3, label: "3 tubes", sub: "24 900 FCFA", tag: "Meilleure offre", save: "Economisez 4 800 F" },
  ];
  cfg.bundles = [
    {
      v: 1, label: "1 Tube — Essai", unitPrice: 9900, totalPrice: 9900,
      perDay: "Soit 330 F / jour pendant 30 jours",
      img: "https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-15-avr.-2026-10_11_48.png"
    },
    {
      v: 2, label: "2 Tubes — Traitement complet", unitPrice: 8000, totalPrice: 16000,
      save: "Economisez 3 800 FCFA", tag: "POPULAIRE", perDay: "Soit 267 F / jour",
      img: "https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-15-avr.-2026-10_04_54.png"
    },
    {
      v: 3, label: "3 Tubes — Pack famille", unitPrice: 8300, totalPrice: 24900,
      save: "Economisez 4 800 FCFA", tag: "MEILLEURE OFFRE", perDay: "Soit 277 F / jour",
      img: "https://obrille.com/wp-content/uploads/2026/04/ChatGPT-Image-15-avr.-2026-10_10_03.png"
    },
  ];

  const update = await fetch(`${API_URL}/templates/${data.template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ config: JSON.stringify(cfg) }),
  });
  console.log('  Update:', update.status);

  const v = await fetch(`${API_URL}/templates/public/${slug}`);
  const vc = JSON.parse((await v.json()).template.config);
  console.log('  prices:', JSON.stringify(vc.prices));
  console.log('  qtyOptions:', JSON.stringify(vc.qtyOptions));
  console.log('  bundles:', JSON.stringify(vc.bundles.map(b => `${b.v}x=${b.totalPrice}`)));
}
