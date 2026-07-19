import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = {};
for (const line of readFileSync(join(ROOT, '.env.vps'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}
const key = env.VPS_SSH_KEY.replace('~', homedir());

const remoteTest = `SECRET=$(php -r 'echo (include "/web/api/proxy-local.php")["bypass_secret"];'); echo "secret_len=${'${#SECRET}'}"; curl -sI -H "x-vercel-protection-bypass: $SECRET" 'https://gs-pipeline-app-2.vercel.app/api/public/product-orders?code=BOUILLOIRE_INTELLIGENTE&page=1&limit=1' | head -3; echo '---'; curl -sI 'https://obrille.com/api/public/product-orders?code=BOUILLOIRE_INTELLIGENTE&page=1&limit=1' | head -3`;

const r = spawnSync('ssh', ['-i', key, '-o', 'StrictHostKeyChecking=no', `${env.VPS_SSH_USER}@${env.VPS_SSH_HOST}`, remoteTest], { encoding: 'utf8' });
console.log(r.stdout);
if (r.stderr) console.error(r.stderr);
