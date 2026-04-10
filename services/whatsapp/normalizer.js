const ACCENT_MAP = {
  'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'ï': 'i', 'î': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ç': 'c',
};

export function normalize(text) {
  if (!text) return '';
  let t = String(text).trim().toLowerCase();
  t = t.replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e')
       .replace(/[ïî]/g, 'i').replace(/[ô]/g, 'o')
       .replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c');
  t = t.replace(/[''`]/g, "'");
  t = t.replace(/\s+/g, ' ');
  return t;
}

export function removeEmojis(text) {
  if (!text) return '';
  return text.replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '').trim();
}

export function extractPhoneNumber(text) {
  if (!text) return null;
  const cleaned = text.replace(/[\s\-.()]/g, '');
  const patterns = [
    /(?:\+?225)?0?[0-9]{10}/,
    /(?:\+?226)[0-9]{8}/,
    /0[1-9][0-9]{8}/,
    /[0-9]{8,10}/,
  ];
  for (const p of patterns) {
    const m = cleaned.match(p);
    if (m) {
      let phone = m[0];
      if (phone.length === 10 && phone.startsWith('0')) return phone;
      if (phone.length === 8) return phone;
      if (phone.startsWith('+')) return phone;
      if (phone.startsWith('225') && phone.length >= 12) return phone;
      if (phone.startsWith('226') && phone.length >= 11) return phone;
      return phone;
    }
  }
  return null;
}

export function extractQuantity(text) {
  if (!text) return null;
  const norm = normalize(text);
  const wordNums = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
  for (const [w, n] of Object.entries(wordNums)) {
    if (norm.includes(w)) return n;
  }
  const numMatch = norm.match(/\b([1-9])\b/);
  if (numMatch) return parseInt(numMatch[1]);
  return null;
}

export function extractName(text) {
  if (!text) return null;
  const norm = text.trim();
  const prefixes = [
    /^(?:je (?:m'?|me )appelle|je suis|mon nom (?:est|c'est)|c'est)\s+/i,
    /^(?:moi c'est|moi je suis)\s+/i,
  ];
  for (const p of prefixes) {
    const m = norm.match(p);
    if (m) {
      const name = norm.slice(m[0].length).trim();
      if (name.length >= 2 && name.length <= 60) return capitalizeWords(name);
    }
  }
  const words = norm.split(/\s+/);
  if (words.length >= 1 && words.length <= 4) {
    const allAlpha = words.every(w => /^[a-zA-ZÀ-ÿ'-]+$/.test(w) && w.length >= 2);
    if (allAlpha) return capitalizeWords(norm);
  }
  return null;
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function extractCity(text, knownCities) {
  if (!text) return null;
  const norm = normalize(text);
  for (const city of knownCities) {
    if (norm.includes(city)) {
      return capitalizeWords(city);
    }
  }
  const clean = text.trim();
  if (clean.length >= 3 && clean.length <= 50 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(clean)) {
    return capitalizeWords(clean);
  }
  return null;
}
