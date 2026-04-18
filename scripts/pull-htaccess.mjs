#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const remotePath = process.argv[2] || '/web/.htaccess';
const localFile = process.argv[3] || '.tmp-htaccess.txt';

const SSH_KEY = join(homedir(), '.ssh', 'obrille_temp');
const SSH_HOST = 'vps112526.serveur-vps.net';
const SSH_USER = 'obrilleshell';

const sshArgs = [
  '-i', SSH_KEY,
  '-o', 'StrictHostKeyChecking=no',
  `${SSH_USER}@${SSH_HOST}`,
  `base64 -w 0 < '${remotePath}'`,
];

let b64 = '';
const proc = spawn('ssh', sshArgs, { stdio: ['ignore', 'pipe', 'inherit'] });
proc.stdout.on('data', (d) => { b64 += d.toString('utf8'); });
proc.on('close', (code) => {
  if (code !== 0) process.exit(code);
  const buf = Buffer.from(b64.trim(), 'base64');
  writeFileSync(localFile, buf);
  console.log(`Pulled ${remotePath} -> ${localFile} (${buf.length} bytes)`);
});
proc.on('error', (e) => { console.error(e); process.exit(1); });
