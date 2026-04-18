#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const remotePath = process.argv[2];
const localFile = process.argv[3];

if (!remotePath || !localFile) {
  console.error('Usage: node pull-vps-file.mjs <remote-path> <local-file>');
  process.exit(1);
}

const SSH_KEY = join(homedir(), '.ssh', 'obrille_temp');
const SSH_HOST = 'vps112526.serveur-vps.net';
const SSH_USER = 'obrilleshell';

const sshArgs = [
  '-i', SSH_KEY,
  '-o', 'StrictHostKeyChecking=no',
  `${SSH_USER}@${SSH_HOST}`,
  `base64 -w 0 < '${remotePath}'`,
];

const chunks = [];
const proc = spawn('ssh', sshArgs, { stdio: ['ignore', 'pipe', 'inherit'] });
proc.stdout.on('data', (d) => chunks.push(d));
proc.on('close', (code) => {
  if (code !== 0) process.exit(code);
  const b64 = Buffer.concat(chunks).toString('utf8').trim();
  const buf = Buffer.from(b64, 'base64');
  writeFileSync(localFile, buf);
  console.log(`Pulled ${remotePath} -> ${localFile} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
});
proc.on('error', (e) => { console.error(e); process.exit(1); });
