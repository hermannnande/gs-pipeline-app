#!/usr/bin/env node
/**
 * Deploie le bundle "Coffret Versace Homme" sur le VPS.
 *
 * Pipeline :
 *   1. Tar.gz du dossier wordpress/coffret-versace-bundle/
 *   2. Upload via SSH base64 pipe
 *   3. Extraction dans /web/coffret-versace/
 *   4. Preserve les donnees existantes (orders.csv, orders.json, config.php)
 *   5. Test GET sur l'URL publique
 *
 * Usage : npm run deploy:coffret-versace
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUNDLE_DIR = join(ROOT, 'wordpress', 'coffret-versace-bundle');
const IS_WIN = process.platform === 'win32';
const REMOTE_DIR = '/web/coffret-versace';

const c = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
const cyan = c(36), green = c(32), red = c(31), yellow = c(33), bold = c(1), gray = c(90);
const ok = (m) => console.log(green(`  ✓ ${m}`));
const warn = (m) => console.log(yellow(`  ⚠ ${m}`));
const err = (m) => console.log(red(`  ✗ ${m}`));
const step = (n, m) => console.log(`\n${bold(cyan(`[${n}] ${m}`))}`);
const info = (m) => console.log(gray(`     ${m}`));
const die = (m) => { err(m); process.exit(1); };

function loadEnv() {
  const path = join(ROOT, '.env.vps');
  if (!existsSync(path)) die('Fichier .env.vps manquant.');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, eq).trim()] = v;
  }
  if (env.VPS_SSH_KEY?.startsWith('~/') || env.VPS_SSH_KEY?.startsWith('~\\')) {
    env.VPS_SSH_KEY = join(homedir(), env.VPS_SSH_KEY.slice(2));
  }
  return env;
}

function packageBundle() {
  step(1, 'Tar.gz du bundle coffret-versace');
  if (!existsSync(BUNDLE_DIR)) die(`Dossier introuvable : ${BUNDLE_DIR}`);

  const archive = join(ROOT, 'coffret-versace-bundle.tar.gz');
  if (existsSync(archive)) rmSync(archive);

  // On place l'archive a la racine du bundle, puis on tar les fichiers
  // (sans inclure le dossier parent)
  const files = ['index.html', 'order.php', 'view.php', 'merci.html', '.htaccess', 'config.sample.php'];
  const missing = files.filter(f => !existsSync(join(BUNDLE_DIR, f)));
  if (missing.length) die(`Fichiers manquants : ${missing.join(', ')}`);

  const archiveRel = join('..', '..', 'coffret-versace-bundle.tar.gz');
  const r = spawnSync('tar', ['-czf', archiveRel, ...files], {
    stdio: 'inherit',
    cwd: BUNDLE_DIR,
  });
  if (r.status !== 0) die('Packaging echoue.');

  const sz = (statSync(archive).size / 1024).toFixed(1);
  ok(`Archive : coffret-versace-bundle.tar.gz (${sz} KB)`);
  return archive;
}

function buildRemoteScript() {
  return `set -e
TS=$(date +%Y%m%d-%H%M%S)
REMOTE='${REMOTE_DIR}'
WORK=/tmp/cv-deploy-$$

echo "[VPS] Reception du tar.gz..."
base64 -d > /tmp/cv-bundle-$$.tar.gz

mkdir -p "$REMOTE" "$WORK"

# Backup des fichiers existants (garde donnees + config)
if [ -f "$REMOTE/orders.csv" ]; then
  cp "$REMOTE/orders.csv" "$WORK/orders.csv.keep"
  echo "[VPS] Sauvegarde orders.csv"
fi
if [ -f "$REMOTE/orders.json" ]; then
  cp "$REMOTE/orders.json" "$WORK/orders.json.keep"
  echo "[VPS] Sauvegarde orders.json"
fi
if [ -f "$REMOTE/config.php" ]; then
  cp "$REMOTE/config.php" "$WORK/config.php.keep"
  echo "[VPS] Sauvegarde config.php"
fi

echo "[VPS] Extraction vers $REMOTE..."
cd "$REMOTE"
tar -xzf /tmp/cv-bundle-$$.tar.gz

# Restaure les donnees preservees
[ -f "$WORK/orders.csv.keep" ]   && mv "$WORK/orders.csv.keep"  "$REMOTE/orders.csv"
[ -f "$WORK/orders.json.keep" ]  && mv "$WORK/orders.json.keep" "$REMOTE/orders.json"
[ -f "$WORK/config.php.keep" ]   && mv "$WORK/config.php.keep"  "$REMOTE/config.php"

# Permissions correctes
chmod 644 "$REMOTE/index.html" "$REMOTE/merci.html" "$REMOTE/order.php" "$REMOTE/view.php" "$REMOTE/.htaccess" 2>&1 | grep -v 'No such' || true
[ -f "$REMOTE/config.php" ]  && chmod 600 "$REMOTE/config.php"
[ -f "$REMOTE/orders.csv" ]  && chmod 600 "$REMOTE/orders.csv"
[ -f "$REMOTE/orders.json" ] && chmod 600 "$REMOTE/orders.json"

cd /
rm -rf "$WORK" /tmp/cv-bundle-$$.tar.gz

echo "[VPS] === Resultat ==="
ls -la "$REMOTE/"

echo ""
echo "[VPS] === Test PHP order.php (syntax) ==="
php -l "$REMOTE/order.php" | head -1
php -l "$REMOTE/view.php"  | head -1
`.trim();
}

function uploadAndDeploy(env, archivePath) {
  step(2, 'Upload + deploiement sur le VPS');

  const b64 = readFileSync(archivePath).toString('base64');
  info(`Encode base64 : ${(b64.length / 1024).toFixed(1)} KB a transferer`);

  const remoteScript = buildRemoteScript();
  const sshArgs = [
    '-i', env.VPS_SSH_KEY,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=10',
    `${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}`,
    remoteScript,
  ];

  return new Promise((resolveP) => {
    const start = Date.now();
    const proc = spawn('ssh', sshArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
    proc.stdin.write(b64);
    proc.stdin.end();
    proc.on('close', (code) => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (code !== 0) die(`Upload/deploy echoue (code ${code})`);
      ok(`Deploiement termine en ${elapsed}s`);
      resolveP();
    });
    proc.on('error', (e) => die(`Erreur SSH : ${e.message}`));
  });
}

function cleanup() {
  step(3, 'Nettoyage local');
  const archive = join(ROOT, 'coffret-versace-bundle.tar.gz');
  if (existsSync(archive)) { rmSync(archive); ok('Archive locale supprimee'); }
}

async function testUrls(env) {
  step(4, 'Test des URLs publiques');
  const domain = env.PUBLIC_DOMAIN || 'obrille.com';
  const urls = [
    `https://${domain}/coffret-versace/`,
    `https://${domain}/coffret-versace/order.php`,
    `https://${domain}/coffret-versace/merci.html`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { method: url.endsWith('order.php') ? 'GET' : 'GET', redirect: 'manual' });
      const size = (await r.text()).length;
      if (url.endsWith('order.php')) {
        // GET sur order.php doit donner 405 (method not allowed)
        if (r.status === 405) ok(`${url} → 405 (POST only) ✓`);
        else warn(`${url} → ${r.status} (attendu 405)`);
      } else if (r.status === 200) {
        ok(`${url} → 200 (${size} bytes)`);
      } else {
        err(`${url} → ${r.status}`);
      }
    } catch (e) {
      err(`${url} → ${e.message}`);
    }
  }

  // Test POST complet (dry run)
  console.log();
  info('Test POST dry-run (honeypot → accepte silencieusement) :');
  try {
    const r = await fetch(`https://${domain}/coffret-versace/order.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ website: 'bot-filled', name: 'X', city: 'Y', phone: '07', quantity: 1 }),
    });
    const j = await r.json();
    if (j.success) ok(`POST honeypot → success (bot filtre) ✓`);
    else warn(`POST honeypot → ${JSON.stringify(j)}`);
  } catch (e) {
    err(`POST → ${e.message}`);
  }
}

async function main() {
  const t0 = Date.now();
  console.log(bold(cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));
  console.log(bold(cyan('  Deploy Coffret Versace (bundle WordPress)')));
  console.log(bold(cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));

  const env = loadEnv();
  if (!existsSync(env.VPS_SSH_KEY)) die(`Cle SSH introuvable : ${env.VPS_SSH_KEY}`);
  info(`Cible : ${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}:${REMOTE_DIR}`);

  const archive = packageBundle();
  await uploadAndDeploy(env, archive);
  cleanup();
  await testUrls(env);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${bold(green(`✓ Deploie en ${elapsed}s`))}`);
  console.log(`\n${bold('Prochaines etapes :')}`);
  console.log(gray(`  1. Visitez : https://${env.PUBLIC_DOMAIN || 'obrille.com'}/coffret-versace/`));
  console.log(gray(`  2. Admin   : https://${env.PUBLIC_DOMAIN || 'obrille.com'}/coffret-versace/view.php?key=obrille2026`));
  console.log(gray(`  3. Pour configurer Telegram/Google Sheet, creez config.php sur le VPS`));
  console.log(gray(`     (modele : wordpress/coffret-versace-bundle/config.sample.php)\n`));
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
