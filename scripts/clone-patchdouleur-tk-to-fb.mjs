// scripts/clone-patchdouleur-tk-to-fb.mjs
// Duplique la page patchdouleurtk -> patchdouleurfb avec un nouveau productCode
// distinct (PATCH_DOULEUR_FB) pour separer le tracking commandes Facebook ads
// vs autres canaux.
//
// Etapes :
//   1. Cree le Product PATCH_DOULEUR_FB en DB (s'il n'existe pas deja)
//   2. Recupere la config complete de patchdouleurtk
//   3. Cree un nouveau LandingTemplate slug=patchdouleurfb avec :
//        - productCode = PATCH_DOULEUR_FB
//        - productId   = <id du nouveau Product>
//        - thankYouUrl = /landing/patchdouleurfb/merci
//   4. Verifie via GET public que le nouveau slug repond
//
// Usage : node scripts/clone-patchdouleur-tk-to-fb.mjs

const API = 'https://gs-pipeline-app-2.vercel.app/api';
const SOURCE_SLUG = 'patchdouleurtk';
const NEW_SLUG = 'patchdouleurfb';
const NEW_CODE = 'PATCH_DOULEUR_FB';
const NEW_NAME = 'Patch Anti-Douleur FB';

async function login() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gs-pipeline.com', password: 'admin123' }),
  });
  if (!r.ok) {
    console.error('Login failed:', r.status, await r.text());
    process.exit(1);
  }
  return (await r.json()).token;
}

async function findOrCreateProduct(token) {
  // Lister tous les produits pour voir si PATCH_DOULEUR_FB existe deja
  const list = await fetch(`${API}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (list.ok) {
    const { products } = await list.json();
    const existing = products.find((p) => p.code?.toUpperCase() === NEW_CODE);
    if (existing) {
      console.log(`  Produit ${NEW_CODE} existe deja: id=${existing.id}`);
      return existing.id;
    }
  }

  // Creer le produit
  console.log(`  Creation Product ${NEW_CODE}...`);
  const create = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      code: NEW_CODE,
      nom: NEW_NAME,
      description: 'Patch chauffant anti-douleur (variante Facebook ads)',
      prixUnitaire: 9900,
      prix2Unites: 16900,
      prix3Unites: 24900,
      stockActuel: 0,
      stockAlerte: 10,
    }),
  });
  if (!create.ok) {
    console.error('  ERREUR creation produit:', create.status, await create.text());
    process.exit(1);
  }
  const { product } = await create.json();
  console.log(`  Product cree: id=${product.id}, code=${product.code}`);
  return product.id;
}

async function run() {
  console.log(`Clonage : ${SOURCE_SLUG} -> ${NEW_SLUG}\n`);

  console.log('1. Login...');
  const token = await login();

  console.log('\n2. Product PATCH_DOULEUR_FB...');
  const newProductId = await findOrCreateProduct(token);

  console.log(`\n3. Recuperation config source (${SOURCE_SLUG})...`);
  const srcRes = await fetch(`${API}/templates/public/${SOURCE_SLUG}`);
  const srcData = await srcRes.json();
  const srcCfg = JSON.parse(srcData.template.config);
  console.log(`   Source: id=${srcData.template.id}, V${srcCfg.templateVersion ?? 1}, code=${srcData.template.productCode}`);

  console.log(`\n4. Verification slug ${NEW_SLUG} libre...`);
  const checkRes = await fetch(`${API}/templates/public/${NEW_SLUG}`);
  if (checkRes.ok) {
    console.log(`   ATTENTION: Le slug ${NEW_SLUG} existe deja - le PUT mettra a jour.`);
  } else {
    console.log(`   OK, libre.`);
  }

  // Construction de la nouvelle config (clone + remap)
  const newCfg = JSON.parse(JSON.stringify(srcCfg));
  newCfg.productCode = NEW_CODE;
  newCfg.thankYouUrl = `/landing/${NEW_SLUG}/merci`;

  console.log(`\n5. Creation LandingTemplate ${NEW_SLUG}...`);
  const createTpl = await fetch(`${API}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      nom: NEW_NAME,
      slug: NEW_SLUG,
      description: 'Variante Facebook ads du patch anti-douleur',
      productCode: NEW_CODE,
      productId: newProductId,
      config: JSON.stringify(newCfg),
      assetsFolder: srcData.template.assetsFolder || null,
      actif: true,
    }),
  });
  if (!createTpl.ok) {
    const err = await createTpl.text();
    console.error('  ERREUR creation template:', createTpl.status, err);
    process.exit(1);
  }
  const { template: newTpl } = await createTpl.json();
  console.log(`   Template cree: id=${newTpl.id}, slug=${newTpl.slug}`);

  console.log(`\n6. Verification publique...`);
  const verRes = await fetch(`${API}/templates/public/${NEW_SLUG}`);
  if (!verRes.ok) {
    console.error(`  ERREUR verif: HTTP ${verRes.status}`);
    process.exit(1);
  }
  const verData = await verRes.json();
  const verCfg = JSON.parse(verData.template.config);
  console.log(`   slug          : ${verData.template.slug}`);
  console.log(`   id            : ${verData.template.id}`);
  console.log(`   productCode   : ${verData.template.productCode}  (config: ${verCfg.productCode})`);
  console.log(`   productId     : ${verData.template.productId}`);
  console.log(`   actif         : ${verData.template.actif}`);
  console.log(`   templateVersion: ${verCfg.templateVersion ?? 1}`);
  console.log(`   thankYouUrl   : ${verCfg.thankYouUrl}`);
  console.log(`   persuasionBlocks: ${verCfg.persuasionBlocks?.length ?? 0}`);
  console.log(`   metaPixelId   : ${verCfg.metaPixelId || '(aucun)'}`);

  console.log('\nDONE.');
  console.log('Reste a faire cote frontend :');
  console.log('  - Ajouter "patchdouleurfb" a useLandingSlug VALID_LANDING_SLUGS');
  console.log('  - Ajouter "patchdouleurfb" a OrderModalDispatcher CUSTOM_SLUGS + switch');
  console.log('  - Build + deploy VPS');
  console.log('\nApres deploy, URLs :');
  console.log('  https://obrille.com/patchdouleurfb');
  console.log('  https://coachingexpertci.com/patchdouleurfb');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
