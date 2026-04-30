#!/usr/bin/env node
/**
 * Configure automatiquement TOUTES les variables d'environnement Chariow
 * sur les projets Vercel `gs-pipeline-app` (prod = obgestion.com) et
 * `gs-pipeline-app-2` (staging).
 *
 * Genere automatiquement le secret du webhook (32 chars aleatoires) et le
 * stocke dans .env.chariow.local pour que vous le retrouviez si besoin.
 *
 * Usage interactif :
 *   node scripts/setup-chariow-env.mjs
 *
 * Usage non interactif (toutes les valeurs en variables d'env locales) :
 *   $env:CHARIOW_API_KEY = "sk_live_xxx"
 *   $env:CHARIOW_PRODUCT_SERUM_CERNE_PAYE_1 = "prd_xxx"
 *   $env:CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2 = "prd_yyy"
 *   $env:CHARIOW_PRODUCT_SERUM_CERNE_PAYE_3 = "prd_zzz"
 *   node scripts/setup-chariow-env.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
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
async function ask(rl, label, defaultValue) {
  const envValue = process.env[label];
  if (envValue) {
    console.log(`  ${label} = (depuis env locale) ${envValue.slice(0, 12)}...`);
    return envValue;
  }
  const hint = defaultValue ? ` [${defaultValue}]` : '';
  const value = (await rl.question(`  ${label}${hint} : `)).trim();
  return value || defaultValue || '';
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  const auth = getVercelAuth();
  const token = auth.token;

  console.log('\n=== Configuration Chariow sur Vercel ===\n');

  console.log('-> Recuperation du teamId Vercel...');
  const teamRes = await vercelFetch('/v2/teams', { method: 'GET' }, token);
  const teamId = teamRes.data?.teams?.[0]?.id || null;
  console.log(`   teamId = ${teamId || '(personal)'}\n`);

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

  console.log('\n-> Saisie des valeurs Chariow (laissez vide pour la valeur entre [...] si proposee)\n');
  const rl = readline.createInterface({ input, output });
  let apiKey, productId1, productId2, productId3;
  try {
    apiKey = await ask(rl, 'CHARIOW_API_KEY', '');
    if (!apiKey || !apiKey.startsWith('sk_')) {
      console.error('[!] Cle API invalide (doit commencer par sk_live_ ou sk_test_)');
      process.exit(1);
    }
    productId1 = await ask(rl, 'CHARIOW_PRODUCT_SERUM_CERNE_PAYE_1', '');
    productId2 = await ask(rl, 'CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2', '');
    productId3 = await ask(rl, 'CHARIOW_PRODUCT_SERUM_CERNE_PAYE_3', '');
    if (!productId1 || !productId2 || !productId3) {
      console.error('[!] Les 3 IDs produits sont requis (ils doivent commencer par prd_)');
      process.exit(1);
    }
  } finally {
    rl.close();
  }

  // Genere le secret webhook automatiquement (32 octets hex = 64 chars)
  const webhookSecret = randomBytes(32).toString('hex');

  // Variables a pousser
  const varsToPush = {
    CHARIOW_API_KEY: apiKey,
    CHARIOW_WEBHOOK_SECRET: webhookSecret,
    CHARIOW_REQUIRE_SHIPPING: '1',
    FRONTEND_PUBLIC_URL: 'https://www.obgestion.com',
    CHARIOW_PRODUCT_SERUM_CERNE_PAYE_1: productId1,
    CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2: productId2,
    CHARIOW_PRODUCT_SERUM_CERNE_PAYE_3: productId3,
  };

  console.log('\n-> Variables a pousser :');
  Object.entries(varsToPush).forEach(([k, v]) => {
    const masked = k.includes('SECRET') || k.includes('API_KEY')
      ? `***${String(v).slice(-6)}`
      : v;
    console.log(`   ${k.padEnd(38)} = ${masked}`);
  });

  // Sauvegarde locale du secret pour reference (gitignore)
  const localFile = path.resolve('.env.chariow.local');
  const localContent = Object.entries(varsToPush)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(localFile, localContent, { encoding: 'utf-8' });
  console.log(`\n-> Sauvegarde locale ecrite : ${localFile}`);
  console.log('   (a ajouter dans .gitignore si pas deja fait)\n');

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
  console.log('1. Configurer le Pulse webhook dans Chariow :');
  console.log('   Dashboard Chariow -> Automatisations -> Pulses -> Add Pulse');
  console.log('   URL :');
  console.log(`     https://www.obgestion.com/api/chariow/webhook?secret=${webhookSecret}`);
  console.log('   Events : cocher "Successful Sale"');
  console.log('');
  console.log('2. Redeployer le backend Vercel :');
  console.log('   git add . && git commit -m "feat(chariow): integration paiement Mobile Money serum-cerne-paye"');
  console.log('   git push origin main   # declenche le deploiement Vercel');
  console.log('');
  console.log('3. Creer le produit obgestion en DB :');
  console.log('   node scripts/seed-serum-cerne-paye-product.mjs');
  console.log('');
  console.log('4. Deployer le frontend sur le VPS :');
  console.log('   cd frontend ; npm run build ; cd ..');
  console.log('   node scripts/deploy-vps.mjs');
  console.log('');
  console.log('5. Pousser le .htaccess racine sur le VPS :');
  console.log('   node scripts/push-htaccess.mjs _vps-root-htaccess.txt');
  console.log('');
  console.log('6. Tester :');
  console.log('   https://www.obgestion.com/serum-cerne-paye');
  console.log('');
}

main().catch((e) => {
  console.error('\n[!] ERREUR FATALE :', e?.stack || e);
  process.exit(1);
});
