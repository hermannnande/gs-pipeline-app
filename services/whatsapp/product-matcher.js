import { prisma } from '../../utils/prisma.js';
import { normalize } from './normalizer.js';
import { PRODUCT_SYNONYMS } from './config.js';

const CATALOG_CACHE_TTL_MS = 60 * 1000;
const catalogCache = new Map();

const BLOCKED_NAME_WORDS = ['erreur', 'ne pas utiliser', 'test', 'archive', 'supprim'];

const CREME_MINCEUR_ALIASES = [
  'creme minceur', 'crème minceur', 'crem minceur', 'creme minceure',
  'brule graisse', 'brûle graisse', 'brule-graisse', 'brûle-graisse',
  'creme brule graisse', 'crème brûle graisse',
  'creme amincissante', 'crème amincissante', 'amincissante',
  'creme pour maigrir', 'crème pour maigrir', 'pour maigrir',
  'creme ventre plat', 'crème ventre plat', 'ventre plat',
  'perdre du ventre', 'perdre ventre', 'perdre du poids',
  'minceur', 'mincir', 'maigrir', 'amincir',
  'graisse ventre', 'graisse du ventre', 'bruler la graisse',
  'creme silhouette', 'crème silhouette',
  'creme chauffante minceur', 'creme chauffante',
  'produit minceur', 'produit pour mincir', 'produit pour maigrir',
  'creme pour le ventre', 'crème pour le ventre',
  'creme regime', 'crème régime',
  'la minceur', 'la creme', 'la crème',
];

const FALLBACK_NAME_MAPPING = {
  'chaussette de compression': 'CHAUSSETTE_DE_COMPRESSION',
  'chaussettes chauffantes tourmaline': 'CHAUSSETTE_CHAUFFANTE',
  'patch minceur glp': 'PATCH_MINCEUR_GLP',
  'patch minceur': 'PATCH_MINCEUR',
  'creme minceur': 'CREME_MINCEUR',
  'patch anti douleur': 'PATCH_ANTI_DOULEUR',
  'gaine tourmaline': 'GAINE_MINCEUR_TOURMALINE',
  'gaine tourmaline chauffante': 'GAINE_MINCEUR_TOURMALINE_CHAUFFANTE',
  'patch anti cicatrice': 'PATCH_ANTI_CICATRICE',
  'creme anti cerne': 'CREME_ANTI_CERNE',
  'creme anti lipome': 'CREME_ANTI_LIPOME',
  'creme anti verrues': 'CREME_ANTI_VERRUES',
  'creme verrue tk': 'VERRUE_TK',
  'creme probleme de peau': 'CREME_PROBLEME_DE_PEAU',
  'pack detox minceur': 'PATCH_DETOX_MINCEUR',
  'poudre pousse cheveux': 'POUDRE_CHEVEUX',
  'creme anti tache': 'CREME_TACHE',
  'creme vitiligo': 'CREME_VITILIGO',
  'spray anti douleur': 'SPRAY_DOULEUR',
  'creme jjl': 'CREME_JLL',
  'semelle massante': 'SEMELLE_MASSANTE',
  'ultra blanchiment dentaire v34': 'ULTRA_BLANCHIMENT_DENTAIRE_V34',
  'creme levre rose': 'LEVRE_ROSE',
  'creme anti hemorroide': 'CREME_ANTI_HEMORROIDE',
  'spray minceur': 'SPRAY_MINCEUR',
  'creme anti cernes2': 'CREME_ANTI_CERNES2',
  'serum ongle': 'SERUM_ONGLE',
  'creme cerne tk': 'CREME_CERNE_TK',
  'creme anti tache2': 'CREME_TACHE2',
  'creme tache tk': 'CREME_TACHE_TK',
  'patch minceur tk': 'PATCH_MINCEUR_TK',
  'lunette de vision nocturne': 'LUNETTE_VISION_NOCTUNE',
  'pads rehausseurs poitrine': 'PADS_REHAUSSEURS_POITRINE',
  'bande sport minceur': 'BANDE_SPORT_MINCEUR',
  'lunette anti uv': 'LUNETTE_ANTI_UV',
};

function isBlockedProduct(product) {
  const n = normalize(product.nom || '');
  return BLOCKED_NAME_WORDS.some(w => n.includes(w));
}

function filterValid(products) {
  return products.filter(p => !isBlockedProduct(p));
}

export async function matchProduct(rawQuery, companyId = 1) {
  const query = normalize(rawQuery);
  if (!query || query.length < 2) return { product: null, confidence: 0, method: 'none' };

  const allRaw = await getCachedProducts(companyId);
  const allProducts = filterValid(allRaw);

  const priorityCode = detectPriorityProduct(query);
  if (priorityCode) {
    const forced = allProducts.find(p => normalize(p.code) === normalize(priorityCode));
    if (forced) return { product: forced, confidence: 98, method: 'priority_alias' };
  }

  const fallbackCode = FALLBACK_NAME_MAPPING[query];
  if (fallbackCode) {
    const p = allProducts.find(prod => normalize(prod.code) === normalize(fallbackCode));
    if (p) return { product: p, confidence: 90, method: 'fallback_mapping' };
  }

  let p = allProducts.find(prod => normalize(prod.code) === normalize(rawQuery));
  if (p) return { product: p, confidence: 95, method: 'code_exact' };

  p = allProducts.find(prod => normalize(prod.nom) === normalize(rawQuery));
  if (p) return { product: p, confidence: 90, method: 'nom_exact' };

  p = allProducts.find(prod => normalize(prod.nom).includes(query) || query.includes(normalize(prod.nom)));
  if (p) return { product: p, confidence: 75, method: 'nom_contains' };

  for (const [, synonyms] of Object.entries(PRODUCT_SYNONYMS)) {
    const matchesSynonym = synonyms.some(s => query.includes(normalize(s)));
    if (matchesSynonym) {
      for (const prod of allProducts) {
        const normName = normalize(prod.nom);
        const normCode = normalize(prod.code);
        if (synonyms.some(s => normName.includes(normalize(s)) || normCode.includes(normalize(s)))) {
          return { product: prod, confidence: 65, method: 'synonym' };
        }
      }
    }
  }

  const queryClean = query.replace(/[^a-z0-9]/g, '');
  if (queryClean.length >= 4) {
    const fuzzy = allProducts.find(prod => {
      const n = normalize(prod.nom).replace(/[^a-z0-9]/g, '');
      const c = normalize(prod.code).replace(/[^a-z0-9]/g, '');
      return (n.length >= 4 && (n.includes(queryClean) || queryClean.includes(n)))
          || (c.length >= 4 && (c.includes(queryClean) || queryClean.includes(c)));
    });
    if (fuzzy) return { product: fuzzy, confidence: 50, method: 'fuzzy' };
  }

  return { product: null, confidence: 0, method: 'none' };
}

export async function getProductCatalog(companyId = 1) {
  const all = await prisma.product.findMany({
    where: { companyId, actif: true },
    select: { id: true, code: true, nom: true, prixUnitaire: true, prix2Unites: true, prix3Unites: true, stockActuel: true },
    orderBy: { nom: 'asc' },
  });
  return filterValid(all);
}

async function getCachedProducts(companyId) {
  const key = String(companyId);
  const now = Date.now();
  const cached = catalogCache.get(key);
  if (cached && now - cached.ts < CATALOG_CACHE_TTL_MS) {
    return cached.items;
  }

  const items = await prisma.product.findMany({ where: { companyId, actif: true } });
  catalogCache.set(key, { ts: now, items });
  return items;
}

function detectPriorityProduct(query) {
  const normalized = normalize(query);
  const aliases = CREME_MINCEUR_ALIASES.map(a => normalize(a));
  if (aliases.some(alias => normalized.includes(alias))) {
    return 'CREME_MINCEUR';
  }
  return null;
}
