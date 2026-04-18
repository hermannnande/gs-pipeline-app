#!/usr/bin/env node
/**
 * Deploy le frontend React sur le VPS (obrille.com).
 *
 * Pipeline :
 *   1. Lecture de .env.vps (config SSH + VITE_*)
 *   2. Verifications (ssh, tar, npm, cle SSH, vars)
 *   3. Build vite avec les bonnes variables d'environnement
 *   4. Tar.gz du shell React (+ images en option)
 *   5. Upload via SSH base64 pipe + script bash distant
 *   6. Backup auto + cleanup vieux backups (garde les 3 derniers)
 *   7. Test des URLs publiques apres deploiement
 *
 * Usage : npm run deploy:vps [options]
 *   --with-images   Inclut aussi les dossiers d'images (verrue-tk/, etc.)
 *   --skip-build    Ne rebuild pas, deploie le dist/ existant
 *   --no-check      Ne teste pas les URLs apres deploiement
 *   --dry-run       Affiche les actions sans rien executer
 *   -h, --help      Affiche l'aide
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FRONTEND = join(ROOT, 'frontend');
const IS_WIN = process.platform === 'win32';

// ─── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS = {
  withImages: args.includes('--with-images'),
  skipBuild: args.includes('--skip-build'),
  check: !args.includes('--no-check'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

if (FLAGS.help) {
  console.log(`
Deploy frontend React sur le VPS.

Usage : npm run deploy:vps [-- options]

Options :
  --with-images    Inclut les dossiers d'images (premier deploy ou refresh).
                   Par defaut, seul le shell React est uploade (rapide).
  --skip-build     Skip le build, utilise le dist/ existant.
  --no-check       Ne teste pas les URLs apres deploiement.
  --dry-run        Affiche les actions sans rien executer.
  -h, --help       Affiche cette aide.

Configuration : edite le fichier .env.vps a la racine du projet.
                Voir .env.vps.example pour le format.
`);
  process.exit(0);
}

// ─── Couleurs ANSI ─────────────────────────────────────────────────────────
const c = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
const cyan = c(36), green = c(32), red = c(31), yellow = c(33), bold = c(1), gray = c(90);
const log = console.log;
const ok = (m) => log(green(`  ✓ ${m}`));
const warn = (m) => log(yellow(`  ⚠ ${m}`));
const err = (m) => log(red(`  ✗ ${m}`));
const step = (n, m) => log(`\n${bold(cyan(`[${n}] ${m}`))}`);
const info = (m) => log(gray(`     ${m}`));
const die = (m) => { err(m); process.exit(1); };

// ─── Charge .env.vps ───────────────────────────────────────────────────────
function loadEnv() {
  const path = join(ROOT, '.env.vps');
  if (!existsSync(path)) {
    die(`Fichier .env.vps manquant.\n     Copie .env.vps.example en .env.vps puis remplis les valeurs.`);
  }
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
  // Expand ~ in SSH key path (Linux/Mac/Win)
  if (env.VPS_SSH_KEY?.startsWith('~/') || env.VPS_SSH_KEY?.startsWith('~\\')) {
    env.VPS_SSH_KEY = join(homedir(), env.VPS_SSH_KEY.slice(2));
  }
  return env;
}

// ─── Verifications prealables ──────────────────────────────────────────────
function checkBinary(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: 'pipe', shell: IS_WIN });
  if (r.status !== 0) die(`${label} non disponible. Installe-le.`);
  ok(`${label} OK`);
}

function preflight(env) {
  step(0, 'Verifications prealables');
  checkBinary('ssh', ['-V'], 'ssh');
  checkBinary('tar', ['--version'], 'tar');
  checkBinary('npm', ['--version'], 'npm');

  if (!existsSync(env.VPS_SSH_KEY)) {
    die(`Cle SSH introuvable : ${env.VPS_SSH_KEY}`);
  }
  ok(`Cle SSH : ${env.VPS_SSH_KEY}`);

  for (const k of ['VPS_SSH_HOST', 'VPS_SSH_USER', 'VPS_APP_DIR', 'VITE_API_URL']) {
    if (!env[k]) die(`Variable manquante dans .env.vps : ${k}`);
  }
  ok("Variables d'environnement OK");

  info(`Cible : ${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}:${env.VPS_APP_DIR}`);
  info(`Mode  : ${FLAGS.withImages ? 'shell + images' : 'shell uniquement (rapide)'}`);
}

// ─── Build ─────────────────────────────────────────────────────────────────
function build(env) {
  if (FLAGS.skipBuild) {
    step(1, 'Build saute (--skip-build)');
    if (!existsSync(join(FRONTEND, 'dist', 'index.html'))) {
      die('Pas de dist/ existant. Lance sans --skip-build.');
    }
    ok('Utilisation du dist/ existant');
    return;
  }
  step(1, 'Build du frontend (vite build)');

  const buildEnv = {
    ...process.env,
    VITE_API_URL: env.VITE_API_URL,
    VITE_BASE_PATH: env.VITE_BASE_PATH || '/landings-app/',
  };
  if (env.VITE_SOCKET_URL) buildEnv.VITE_SOCKET_URL = env.VITE_SOCKET_URL;

  info(`VITE_API_URL=${buildEnv.VITE_API_URL}`);
  info(`VITE_BASE_PATH=${buildEnv.VITE_BASE_PATH}`);

  if (FLAGS.dryRun) { info('(dry-run) skip vite build'); return; }

  // Sur Windows, npm est un .cmd resolu via PATHEXT donc shell:true requis.
  // Le DeprecationWarning n'est pas problematique ici (args controles, pas
  // de user input). On le supprime via NODE_NO_WARNINGS pour propreete.
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: FRONTEND,
    env: { ...buildEnv, NODE_NO_WARNINGS: '1' },
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) die('Build echoue.');
  ok('Build termine');
}

// ─── Package tar.gz ────────────────────────────────────────────────────────
function packageBuild() {
  step(2, FLAGS.withImages ? 'Package shell + images' : 'Package shell React (rapide)');

  const distDir = join(FRONTEND, 'dist');
  const archive = join(FRONTEND, 'dist-deploy.tar.gz');
  if (existsSync(archive)) rmSync(archive);

  if (!existsSync(distDir)) die(`dist/ introuvable : ${distDir}`);

  const candidates = ['index.html', 'robots.txt', '.htaccess', 'assets'];
  if (FLAGS.withImages) {
    candidates.push('verrue-tk', 'spray-douleur', 'creme-minceur', 'patch-douleur-tk');
  }

  // Note : on n'utilise NI -C NI shell:true (les deux explosent avec les
  // espaces dans les paths Windows). cwd: distDir + chemins relatifs.
  const archiveRel = join('..', 'dist-deploy.tar.gz');
  const tarArgs = ['-czf', archiveRel];
  for (const f of candidates) {
    if (existsSync(join(distDir, f))) tarArgs.push(f);
  }

  if (FLAGS.dryRun) { info(`(dry-run) tar ${tarArgs.join(' ')} (cwd: ${distDir})`); return null; }

  const r = spawnSync('tar', tarArgs, { stdio: 'inherit', cwd: distDir });
  if (r.status !== 0) die('Packaging echoue.');

  const sz = (statSync(archive).size / 1024 / 1024).toFixed(2);
  ok(`Archive : dist-deploy.tar.gz (${sz} MB)`);
  return archive;
}

// ─── Script bash distant ───────────────────────────────────────────────────
function buildRemoteScript(env) {
  // Note : on evite "2>/dev/null" car Jailkit interdit /dev/null.
  // On utilise "|| true" pour absorber les erreurs benignes.
  return `set -e
TS=$(date +%Y%m%d-%H%M%S)
APP_DIR='${env.VPS_APP_DIR}'
WORK=/tmp/deploy-vps-$$

echo "[VPS] Reception et decode du tar.gz..."
base64 -d > /tmp/dist-deploy-$$.tar.gz

mkdir -p "$WORK" "$APP_DIR"

echo "[VPS] Backup des assets actuels..."
if [ -d "$APP_DIR/assets" ]; then
  cp -r "$APP_DIR/assets" "$APP_DIR/assets.bak-$TS" || true
fi

echo "[VPS] Extraction..."
cd "$WORK"
tar -xzf /tmp/dist-deploy-$$.tar.gz

echo "[VPS] Deploiement du shell React..."
[ -f index.html ] && cp index.html "$APP_DIR/"
[ -f robots.txt ] && cp robots.txt "$APP_DIR/"
[ -f .htaccess ] && cp .htaccess "$APP_DIR/"
if [ -d assets ]; then
  rm -rf "$APP_DIR/assets"
  cp -r assets "$APP_DIR/"
fi

WEB_ROOT=$(dirname "$APP_DIR")
for img_dir in verrue-tk spray-douleur creme-minceur patch-douleur-tk; do
  if [ -d "$img_dir" ]; then
    rm -rf "$WEB_ROOT/$img_dir"
    mv "$img_dir" "$WEB_ROOT/$img_dir"
    count=$(find "$WEB_ROOT/$img_dir" -type f | wc -l)
    echo "[VPS] IMG  $img_dir -> $count fichier(s)"
  fi
done

cd /
rm -rf "$WORK" /tmp/dist-deploy-$$.tar.gz

# Garde les 3 derniers backups, supprime les autres (sans xargs car
# Jailkit interdit l'acces a /dev/null que xargs utilise en interne).
N_BACKUPS=$(ls -d "$APP_DIR"/assets.bak-* 2>&1 | grep -v 'No such' | wc -l)
if [ "$N_BACKUPS" -gt 3 ]; then
  ls -dt "$APP_DIR"/assets.bak-* | tail -n +4 | while IFS= read -r old; do
    rm -rf "$old"
  done
fi

echo "[VPS] === Resultat ==="
ls -la "$APP_DIR/" | tail -n +2
`.trim();
}

// ─── Upload + deploy ───────────────────────────────────────────────────────
function uploadAndDeploy(env, archivePath) {
  step(3, 'Upload + deploiement sur le VPS');

  if (FLAGS.dryRun) { info('(dry-run) skip upload'); return Promise.resolve(); }

  const b64 = readFileSync(archivePath).toString('base64');
  info(`Encode base64 : ${(b64.length / 1024 / 1024).toFixed(2)} MB a transferer`);

  const remoteScript = buildRemoteScript(env);
  const sshArgs = [
    '-i', env.VPS_SSH_KEY,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=10',
    `${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}`,
    remoteScript,
  ];

  const start = Date.now();
  return new Promise((resolveP) => {
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

// ─── Cleanup local ─────────────────────────────────────────────────────────
function cleanup() {
  step(4, 'Nettoyage local');
  const archive = join(FRONTEND, 'dist-deploy.tar.gz');
  if (existsSync(archive)) {
    rmSync(archive);
    ok('Archive locale supprimee');
  }
}

// ─── Test URLs ─────────────────────────────────────────────────────────────
async function testUrls(env) {
  if (!FLAGS.check || FLAGS.dryRun) return;
  step(5, 'Test des URLs publiques');

  const slugs = (env.LANDING_SLUGS ||
    'creme-anti-verrue,creme-verrue-tk,spraydouleurtk,creme-ongle-incarne,chaussette-compression,patchdouleurtk,crememinceurfb'
  ).split(',').map(s => s.trim()).filter(Boolean);
  const domain = env.PUBLIC_DOMAIN || 'obrille.com';
  const basePath = env.VITE_BASE_PATH || '/landings-app/';

  let okCount = 0;
  for (const slug of slugs) {
    const url = `https://${domain}/${slug}`;
    try {
      const r = await fetch(url, { redirect: 'manual' });
      const html = await r.text();
      const isReact = html.includes('id="root"') && html.includes(basePath);
      if (r.status === 200 && isReact) {
        ok(`${url} → 200 + React`);
        okCount++;
      } else {
        err(`${url} → status=${r.status} React=${isReact}`);
      }
    } catch (e) {
      err(`${url} → ${e.message}`);
    }
  }

  if (okCount === slugs.length) {
    log(`\n${green(bold(`🎉 Tous les tests OK (${okCount}/${slugs.length})`))}`);
  } else {
    log(`\n${yellow(bold(`⚠ Tests partiels : ${okCount}/${slugs.length}`))}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  log(bold(cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));
  log(bold(cyan(`  Deploy VPS  ${FLAGS.dryRun ? gray('(DRY-RUN)') : ''}`)));
  log(bold(cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')));

  const env = loadEnv();
  preflight(env);
  build(env);
  const archive = packageBuild();
  if (archive) await uploadAndDeploy(env, archive);
  cleanup();
  await testUrls(env);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`\n${bold(green(`✓ Total : ${elapsed}s`))}\n`);
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
