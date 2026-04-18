#!/usr/bin/env node
// Pousse le .htaccess local vers /web/.htaccess sur le VPS via SSH+base64.
// Evite les problemes d'encodage UTF-16 de PowerShell.

import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const localFile = process.argv[2];
const remotePath = process.argv[3] || '/web/.htaccess';

if (!localFile || !existsSync(localFile)) {
  console.error(`Usage: node push-htaccess.mjs <local-file> [remote-path]`);
  process.exit(1);
}

const SSH_KEY = join(homedir(), '.ssh', 'obrille_temp');
const SSH_HOST = 'vps112526.serveur-vps.net';
const SSH_USER = 'obrilleshell';

const b64 = readFileSync(localFile).toString('base64');
console.log(`Local: ${localFile} (${readFileSync(localFile).length} bytes)`);
console.log(`Remote: ${remotePath}`);
console.log(`Base64: ${b64.length} chars`);

const remoteScript = `set -e
TS=$(date +%Y%m%d-%H%M%S)
TARGET='${remotePath}'
[ -f "$TARGET" ] && cp "$TARGET" "$TARGET.bak-$TS"
base64 -d > /tmp/htaccess-push-$$
cp /tmp/htaccess-push-$$ "$TARGET"
rm -f /tmp/htaccess-push-$$
echo "=== Verification ==="
wc -c "$TARGET"
echo "=== Premieres lignes ==="
head -5 "$TARGET"
echo "=== Recherche slugs ==="
grep -oE '(creme-anti-verrue|creme-verrue-tk|spraydouleurtk|creme-ongle-incarne|chaussette-compression|patchdouleurtk|crememinceurfb)' "$TARGET" | sort -u
`;

const sshArgs = [
  '-i', SSH_KEY,
  '-o', 'StrictHostKeyChecking=no',
  `${SSH_USER}@${SSH_HOST}`,
  remoteScript,
];

const proc = spawn('ssh', sshArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(b64);
proc.stdin.end();
proc.on('close', (code) => process.exit(code));
proc.on('error', (e) => { console.error(e); process.exit(1); });
