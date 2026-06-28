/**
 * Configure Meta CAPI pour coffret-boxer-luxe-v3 sur le VPS.
 * - Ajoute le pixel 1674022793901764 dans META_PIXEL_TOKENS (Vercel)
 * - Met a jour /web/coffret-versace/config.php sur le VPS
 *
 * Usage :
 *   node scripts/configure-coffret-meta-capi.mjs
 *   META_CAPI_TOKEN=EAA... node scripts/configure-coffret-meta-capi.mjs
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PIXEL_ID = '1674022793901764';
const REMOTE_CONFIG = '/web/coffret-versace/config.php';
const TMP_ENV = '.env.meta-capi.tmp';

function loadVpsEnv() {
  const path = join(ROOT, '.env.vps');
  if (!existsSync(path)) throw new Error('.env.vps manquant');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, eq).trim()] = v;
  }
  if (env.VPS_SSH_KEY?.startsWith('~/') || env.VPS_SSH_KEY?.startsWith('~\\')) {
    env.VPS_SSH_KEY = join(homedir(), env.VPS_SSH_KEY.slice(2));
  }
  return env;
}

function sshArgs(vps) {
  return [
    '-i', vps.VPS_SSH_KEY,
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'BatchMode=yes',
    `${vps.VPS_SSH_USER}@${vps.VPS_SSH_HOST}`,
  ];
}

function resolveToken() {
  if (process.env.META_CAPI_TOKEN?.trim()) return process.env.META_CAPI_TOKEN.trim();
  execFileSync('npx', ['vercel', 'env', 'pull', TMP_ENV, '--environment', 'production', '--yes'], {
    stdio: 'pipe',
    shell: true,
    cwd: ROOT,
  });
  const raw = readFileSync(TMP_ENV, 'utf8');
  for (const line of raw.split('\n')) {
    if (line.startsWith('META_ACCESS_TOKEN=')) {
      return line.slice('META_ACCESS_TOKEN='.length).replace(/^"|"$/g, '');
    }
  }
  throw new Error('META_CAPI_TOKEN absent. Passez META_CAPI_TOKEN=EAA... ou verifiez META_ACCESS_TOKEN sur Vercel.');
}

function patchVpsConfig(vps, token) {
  const php = `<?php
declare(strict_types=1);
$cfg = ${JSON.stringify(REMOTE_CONFIG)};
$pixel = ${JSON.stringify(PIXEL_ID)};
$token = ${JSON.stringify(token)};
$txt = is_file($cfg) ? (string)file_get_contents($cfg) : "<?php\\n";
$vars = [
  'META_PIXEL_ID' => '$META_PIXEL_ID   = \\'' . str_replace("'", "\\\\'", $pixel) . '\\';',
  'META_CAPI_TOKEN' => '$META_CAPI_TOKEN = \\'' . str_replace("'", "\\\\'", $token) . '\\';',
];
foreach ($vars as $name => $line) {
  if (preg_match('/^\\\\$' . preg_quote($name, '/') . '\\\\s*=/m', $txt)) {
    $txt = preg_replace('/^\\\\$' . preg_quote($name, '/') . '\\\\s*=.*$/m', $line, $txt);
  } else {
    $txt = rtrim($txt) . "\\n" . $line . "\\n";
  }
}
file_put_contents($cfg, $txt);
chmod($cfg, 0600);
echo "OK\\n";
`;

  const b64 = Buffer.from(php, 'utf8').toString('base64');
  const cmd = `echo '${b64}' | base64 -d > /tmp/patch-meta-capi.php && php /tmp/patch-meta-capi.php && rm /tmp/patch-meta-capi.php`;
  const r = spawnSync('ssh', [...sshArgs(vps), cmd], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Echec mise a jour config.php VPS');
}

function main() {
  const token = resolveToken();
  console.log(`[1] Token CAPI : ${token.length} caracteres`);

  console.log('[2] Ajout pixel dans META_PIXEL_TOKENS (Vercel)...');
  execFileSync('node', ['scripts/set-meta-pixel-token.mjs', PIXEL_ID], {
    stdio: 'inherit',
    shell: true,
    cwd: ROOT,
    env: { ...process.env, META_CAPI_TOKEN: token },
  });

  console.log('[3] Mise a jour config.php sur le VPS...');
  patchVpsConfig(loadVpsEnv(), token);

  console.log('\n[OK] Meta CAPI configure pour coffret-boxer-luxe-v3');
  console.log('     Pixel :', PIXEL_ID);
}

try {
  main();
} finally {
  try { unlinkSync('.env.meta-capi.tmp'); } catch {}
  try { unlinkSync('.env.prod.tmp'); } catch {}
}
