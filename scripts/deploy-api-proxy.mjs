#!/usr/bin/env node
/**
 * Déploie le proxy PHP /web/api sur le VPS (obrille.com/api/* -> Vercel).
 * Usage : node scripts/deploy-api-proxy.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
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
  if (env.VPS_SSH_KEY?.startsWith('~/')) env.VPS_SSH_KEY = join(homedir(), env.VPS_SSH_KEY.slice(2));
  return env;
}

function ssh(env, script) {
  const r = spawnSync('ssh', [
    '-i', env.VPS_SSH_KEY,
    '-o', 'StrictHostKeyChecking=no',
    `${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}`,
    script,
  ], { stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status || 1);
}

function uploadFile(env, localPath, remotePath) {
  const b64 = readFileSync(localPath).toString('base64');
  ssh(env, `mkdir -p /web/api && echo '${b64}' | base64 -d > ${remotePath}`);
}

const env = loadEnv();
const bypassPath = join(ROOT, '.vercel-bypass-secret.tmp');
if (!existsSync(bypassPath)) throw new Error('.vercel-bypass-secret.tmp manquant');
const bypassSecret = readFileSync(bypassPath, 'utf8').trim();

const tmpDir = join(ROOT, '.tmp-api-proxy');
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
mkdirSync(tmpDir, { recursive: true });
writeFileSync(join(tmpDir, 'proxy-local.php'), `<?php\nreturn ['bypass_secret' => ${JSON.stringify(bypassSecret)}];\n`);

console.log('Déploiement proxy API sur VPS…');
uploadFile(env, join(__dirname, 'api-proxy.php'), '/web/api/index.php');
uploadFile(env, join(__dirname, 'vps-api-proxy', '.htaccess'), '/web/api/.htaccess');
uploadFile(env, join(tmpDir, 'proxy-local.php'), '/web/api/proxy-local.php');
ssh(env, 'chmod 640 /web/api/proxy-local.php');
rmSync(tmpDir, { recursive: true, force: true });

const test = spawnSync('curl.exe', ['-s', '-o', 'NUL', '-w', '%{http_code}', 'https://obrille.com/api/public/product-orders?code=BOUILLOIRE_INTELLIGENTE&page=1&limit=1'], {
  stdio: ['inherit', 'pipe', 'inherit'],
});
const code = test.stdout?.toString().trim();
console.log(`Test API proxy : HTTP ${code}`);
if (code !== '200') {
  console.error('Échec du test proxy.');
  process.exit(1);
}
console.log('OK');
