#!/usr/bin/env node
/**
 * Configure les variables d'environnement Paystack sur les projets Vercel
 * `gs-pipeline-app` (prod = obgestion.com) et `gs-pipeline-app-2` (staging).
 *
 * Beaucoup plus simple que setup-chariow-env.mjs : pas de mapping produits a
 * configurer (Paystack accepte un montant libre), juste 2-3 cles a pousser.
 *
 * Usage interactif :
 *   node scripts/setup-paystack-env.mjs
 *
 * Usage non interactif (variables d'env locales) :
 *   $env:PAYSTACK_SECRET_KEY = "sk_live_xxx"
 *   $env:PAYSTACK_PUBLIC_KEY = "pk_live_xxx"
 *   node scripts/setup-paystack-env.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// ============================================================================
// Config
// ============================================================================
const PROJECTS = [
  { name: 'gs-pipeline-app',   alias: 'PROD (obgestion.com)' },
  { name: 'gs-pipeline-app-2', alias: 'STAGING' },
];

const TARGETS = ['production', 'preview', 'development'];

// ============================================================================
// Auth Vercel : lit le token depuis le cache local de la CLI
// ============================================================================
function getVercelAuth() {
  const authPath = path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json');
  if (!fs.existsSync(authPath)) {
    console.error(`\n[!] Token Vercel introuvable : ${authPath}`);
    console.error(`[!] Lancez d'abord : vercel login`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(authPath, 'utf-8'));
}

/**
 * Resout le teamId Vercel a utiliser.
 *
 * Strategie :
 *   1) Variable d'env VERCEL_TEAM_ID (override manuel)
 *   2) `.vercel/project.json` du projet courant (champ orgId) - le plus fiable
 *      car ca correspond exactement a la team ou les projets sont stockes
 *   3) Fallback : /v2/teams (premiere team de l'API) - ancien comportement
 *
 * Sans teamId, l'API retourne uniquement les projets "personal" (compte
 * utilisateur), ce qui est rare en realite : la plupart des projets sont
 * dans une team (meme la team perso par defaut "nandees-projects-xxx").
 */
async function resolveTeamId(token) {
  // 1) Override via env
  if (process.env.VERCEL_TEAM_ID) {
    console.log(`   teamId = ${process.env.VERCEL_TEAM_ID} (depuis env VERCEL_TEAM_ID)`);
    return process.env.VERCEL_TEAM_ID;
  }

  // 2) .vercel/project.json -> champ orgId
  const projectJsonPath = path.resolve('.vercel/project.json');
  if (fs.existsSync(projectJsonPath)) {
    try {
      const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
      if (projectJson.orgId && projectJson.orgId.startsWith('team_')) {
        console.log(`   teamId = ${projectJson.orgId} (depuis .vercel/project.json)`);
        return projectJson.orgId;
      }
    } catch (e) {
      console.warn(`   [!] Impossible de lire .vercel/project.json : ${e.message}`);
    }
  }

  // 3) /v2/teams - premiere team (ancien comportement)
  const teamRes = await vercelFetch('/v2/teams', { method: 'GET' }, token);
  const firstTeamId = teamRes.data?.teams?.[0]?.id || null;
  if (firstTeamId) {
    console.log(`   teamId = ${firstTeamId} (premiere team via /v2/teams)`);
    return firstTeamId;
  }

  console.log(`   teamId = (personal) - aucune team trouvee`);
  return null;
}

async function vercelFetch(url, options = {}, token) {
  const res = await fetch(`https://api.vercel.com${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function listProjects(token, teamId) {
  const url = `/v10/projects${teamId ? `?teamId=${teamId}` : ''}`;
  const { data } = await vercelFetch(url, { method: 'GET' }, token);
  return data.projects || [];
}

async function listProjectEnv(projectId, token, teamId) {
  const url = `/v10/projects/${projectId}/env${teamId ? `?teamId=${teamId}` : ''}`;
  const { data } = await vercelFetch(url, { method: 'GET' }, token);
  return data.envs || [];
}

async function deleteProjectEnv(projectId, envId, token, teamId) {
  const url = `/v10/projects/${projectId}/env/${envId}${teamId ? `?teamId=${teamId}` : ''}`;
  return vercelFetch(url, { method: 'DELETE' }, token);
}

async function createProjectEnv(projectId, key, value, token, teamId) {
  const url = `/v10/projects/${projectId}/env${teamId ? `?teamId=${teamId}` : ''}`;
  return vercelFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      key,
      value: String(value),
      type: 'encrypted',
      target: TARGETS,
    }),
  }, token);
}

async function upsertEnv(projectId, key, value, existingEnvs, token, teamId) {
  // Supprime toute version existante avant de creer (idempotent)
  const matches = existingEnvs.filter((e) => e.key === key);
  for (const e of matches) {
    await deleteProjectEnv(projectId, e.id, token, teamId);
  }
  return createProjectEnv(projectId, key, value, token, teamId);
}

// ============================================================================
// Prompt helpers
// ============================================================================
/**
 * Nettoie une valeur saisie au clavier ou collee depuis le dashboard.
 * Retire :
 *   - espaces blancs (debut/fin)
 *   - espaces insecables (\u00A0)
 *   - BOM (\uFEFF)
 *   - tabulations (\t)
 *   - guillemets ouvrants/fermants si la valeur entiere est entouree
 */
function sanitizeInput(raw) {
  if (raw == null) return '';
  let v = String(raw)
    .replace(/^[\s\u00A0\uFEFF]+|[\s\u00A0\uFEFF]+$/g, '') // trim invisible chars
    .replace(/^["'`]|["'`]$/g, ''); // retire guillemets entourants
  return v;
}

async function ask(rl, label, defaultValue) {
  const envValue = process.env[label];
  if (envValue) {
    const cleaned = sanitizeInput(envValue);
    console.log(`  ${label} = (depuis env locale) ${cleaned.slice(0, 12)}... (${cleaned.length} chars)`);
    return cleaned;
  }
  const hint = defaultValue ? ` [${defaultValue}]` : '';
  const raw = await rl.question(`  ${label}${hint} : `);
  const value = sanitizeInput(raw);
  return value || (defaultValue ? sanitizeInput(defaultValue) : '');
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  const auth = getVercelAuth();
  const token = auth.token;

  console.log('\n=== Configuration Paystack sur Vercel ===\n');

  console.log('-> Recuperation du teamId Vercel...');
  const teamId = await resolveTeamId(token);
  console.log('');

  console.log('-> Liste des projets Vercel...');
  const allProjects = await listProjects(token, teamId);
  const targets = PROJECTS.map((p) => {
    const found = allProjects.find((x) => x.name === p.name);
    if (!found) {
      console.warn(`   [!] Projet introuvable : ${p.name} (sera ignore)`);
      return null;
    }
    return { ...p, id: found.id };
  }).filter(Boolean);

  if (targets.length === 0) {
    console.error('[!] Aucun projet cible trouve. Abandon.');
    process.exit(1);
  }
  targets.forEach((t) => console.log(`   ${t.alias.padEnd(28)} ${t.name} (id=${t.id.slice(0, 12)}...)`));

  console.log('\n-> Saisie des cles Paystack');
  console.log('   (Recuperez-les dans https://dashboard.paystack.com/#/settings/developers)\n');

  const rl = readline.createInterface({ input, output });
  let secretKey, publicKey, frontendUrl;
  try {
    secretKey = await ask(rl, 'PAYSTACK_SECRET_KEY', '');
    if (!secretKey) {
      console.error('[!] Cle secrete vide. Recopiez-la depuis https://dashboard.paystack.com/#/settings/developers');
      process.exit(1);
    }
    if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(secretKey)) {
      // Debug pour aider l'utilisateur a comprendre ce qui ne va pas
      const masked = secretKey.length > 12 ? `${secretKey.slice(0, 8)}...${secretKey.slice(-4)}` : `(${secretKey.length} chars)`;
      console.error('[!] Cle secrete invalide (doit commencer par sk_test_ ou sk_live_).');
      console.error(`    Recue : ${masked}`);
      console.error(`    Longueur : ${secretKey.length} chars`);
      console.error(`    Premiers chars (codes ASCII) : ${[...secretKey.slice(0, 10)].map((c) => c.charCodeAt(0)).join(',')}`);
      console.error('    Verifiez : pas d\'espace, pas de guillemets, et la cle commence bien par sk_live_ ou sk_test_');
      process.exit(1);
    }
    publicKey = await ask(rl, 'PAYSTACK_PUBLIC_KEY', '');
    if (!publicKey) {
      console.error('[!] Cle publique vide.');
      process.exit(1);
    }
    if (!/^pk_(test|live)_[A-Za-z0-9]+$/.test(publicKey)) {
      const masked = publicKey.length > 12 ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}` : `(${publicKey.length} chars)`;
      console.error('[!] Cle publique invalide (doit commencer par pk_test_ ou pk_live_).');
      console.error(`    Recue : ${masked}`);
      process.exit(1);
    }
    if (secretKey.startsWith('sk_test_') !== publicKey.startsWith('pk_test_')) {
      console.error('[!] Incoherence : tu melange une cle test et une cle live. Verifie les 2 cles.');
      process.exit(1);
    }
    frontendUrl = await ask(rl, 'FRONTEND_PUBLIC_URL', 'https://www.obgestion.com');
  } finally {
    rl.close();
  }

  // Variables a pousser
  const varsToPush = {
    PAYSTACK_SECRET_KEY: secretKey,
    PAYSTACK_PUBLIC_KEY: publicKey,
    FRONTEND_PUBLIC_URL: frontendUrl,
  };

  console.log('\n-> Variables a pousser :');
  Object.entries(varsToPush).forEach(([k, v]) => {
    const masked = k.includes('SECRET')
      ? `***${String(v).slice(-6)}`
      : v;
    console.log(`   ${k.padEnd(38)} = ${masked}`);
  });

  // Sauvegarde locale (gitignore)
  const localFile = path.resolve('.env.paystack.local');
  const localContent = Object.entries(varsToPush)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(localFile, localContent, { encoding: 'utf-8' });
  console.log(`\n-> Sauvegarde locale ecrite : ${localFile}`);
  console.log('   (assurez-vous qu\'il est ignore par git : *.local dans .gitignore)\n');

  // Pousse sur chaque projet
  for (const target of targets) {
    console.log(`\n-> ${target.alias} (${target.name}) :`);
    const existingEnvs = await listProjectEnv(target.id, token, teamId);
    let success = 0, failed = 0;
    for (const [key, value] of Object.entries(varsToPush)) {
      const result = await upsertEnv(target.id, key, value, existingEnvs, token, teamId);
      if (result.ok) {
        success++;
        console.log(`   [OK] ${key}`);
      } else {
        failed++;
        console.error(`   [KO] ${key} : status=${result.status} message=${result.data?.error?.message || JSON.stringify(result.data).slice(0, 200)}`);
      }
    }
    console.log(`   Bilan : ${success} OK, ${failed} echec(s)`);
  }

  console.log('\n=== TERMINE ===\n');
  console.log('PROCHAINES ETAPES :');
  console.log('');
  console.log('1. Configurer le webhook dans le dashboard Paystack :');
  console.log('   Dashboard Paystack -> Settings -> API Keys & Webhooks');
  console.log('   Webhook URL :');
  console.log(`     ${frontendUrl}/api/paystack/webhook`);
  console.log('   (Pas de secret en query string : la signature HMAC sk_live_ suffit.)');
  console.log('');
  console.log('2. (Optionnel) Activer IP whitelisting cote Paystack :');
  console.log('   Settings -> API Keys -> IP Allowlist');
  console.log('   Ajouter les IPs de ton serveur Vercel + VPS');
  console.log('');
  console.log('3. Redeployer le backend Vercel :');
  console.log('   git add . && git commit -m "feat(paystack): migration Chariow -> Paystack"');
  console.log('   git push origin main   # declenche le deploiement Vercel');
  console.log('');
  console.log('4. Deployer le frontend sur le VPS :');
  console.log('   cd frontend ; npm run build ; cd ..');
  console.log('   node scripts/deploy-vps.mjs');
  console.log('');
  console.log('5. Tester le flux Mobile Money :');
  console.log('   https://www.obgestion.com/serum-cerne-paye');
  console.log('   En test mode : numero Orange test = 0700000000, OTP = 1234');
  console.log('');
  console.log('6. Verifier la config :');
  console.log('   curl https://www.obgestion.com/api/paystack/health');
  console.log('');
}

main().catch((e) => {
  console.error('\n[!] ERREUR FATALE :', e?.stack || e);
  process.exit(1);
});
