// Anti-fraude GPS livreur — géocodage approximatif (centre de commune/ville) + distance.
// Objectif : détecter les marquages « refusé » / « absent au rendez-vous » faits loin
// de l'adresse du client. La précision est volontairement communale (tolérance large).

/** Centres approximatifs [lat, lng] — Abidjan (communes) puis principales villes CI. */
const ZONES_CI = [
  // Communes d'Abidjan (les plus précises d'abord)
  ['port-bouet', [5.2567, -3.9256]],
  ['treichville', [5.2945, -4.0053]],
  ['attecoube', [5.3364, -4.0417]],
  ['bingerville', [5.3558, -3.8853]],
  ['koumassi', [5.2954, -3.9539]],
  ['marcory', [5.3026, -3.9828]],
  ['plateau', [5.3244, -4.0205]],
  ['adjame', [5.3681, -4.0228]],
  ['yopougon', [5.3364, -4.0867]],
  ['abobo', [5.4161, -4.0159]],
  ['anyama', [5.4946, -4.0518]],
  ['cocody', [5.3480, -3.9878]],
  ['songon', [5.3177, -4.2435]],
  ['brofodoume', [5.4706, -3.9194]],
  ['abidjan', [5.3364, -4.0267]],
  // Villes de l'intérieur
  ['bouake', [7.6906, -5.0303]],
  ['daloa', [6.8774, -6.4503]],
  ['san pedro', [4.7485, -6.6363]],
  ['san-pedro', [4.7485, -6.6363]],
  ['yamoussoukro', [6.8276, -5.2893]],
  ['korhogo', [9.4579, -5.6297]],
  ['man', [7.4125, -7.5538]],
  ['gagnoa', [6.1319, -5.9506]],
  ['abengourou', [6.7297, -3.4964]],
  ['divo', [5.8374, -5.3574]],
  ['soubre', [5.7856, -6.6089]],
  ['agboville', [5.9280, -4.2132]],
  ['grand bassam', [5.2118, -3.7388]],
  ['grand-bassam', [5.2118, -3.7388]],
  ['assini', [5.1333, -3.3333]],
  ['dabou', [5.3256, -4.3769]],
  ['bingerville', [5.3558, -3.8853]],
];

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Géocode approximatif : commune > ville > adresse (premier match). */
function geocodeClient({ clientCommune, clientVille, clientAdresse }) {
  const hay = normalizeText(`${clientCommune || ''} ${clientVille || ''} ${clientAdresse || ''}`);
  if (!hay.trim()) return null;
  for (const [zone, [lat, lng]] of ZONES_CI) {
    if (hay.includes(zone)) return { zone, lat, lng };
  }
  return null;
}

/** Distance haversine en km. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Évaluation anti-fraude d'un marquage.
 * Seuils larges (géocodage communal) : <= 3 km OK · 3-8 km à vérifier · > 8 km suspect.
 */
function evaluerMarquage({ refusGpsLat, refusGpsLng, clientCommune, clientVille, clientAdresse }) {
  const hasGps = refusGpsLat != null && refusGpsLng != null;
  if (!hasGps) return { flag: 'SANS_PREUVE', distanceKm: null, zone: null };
  const geo = geocodeClient({ clientCommune, clientVille, clientAdresse });
  if (!geo) return { flag: 'NON_GEOCODE', distanceKm: null, zone: null };
  const distanceKm = haversineKm(refusGpsLat, refusGpsLng, geo.lat, geo.lng);
  const flag = distanceKm <= 3 ? 'OK' : distanceKm <= 8 ? 'A_VERIFIER' : 'SUSPECT';
  return { flag, distanceKm: Math.round(distanceKm * 10) / 10, zone: geo.zone };
}

export { geocodeClient, haversineKm, evaluerMarquage };
