#!/usr/bin/env node
// Dump des configs templates (publiques) pour sauvegarde.
// Usage: node scripts/snapshot-templates.mjs [output.json]
//
// Endpoint: GET /api/templates/public/:slug -> { template: { id, config (JSON string), ... } }
// Ce script ne necessite aucune authentification.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const API = 'https://gs-pipeline-app-2.vercel.app/api';
const SLUGS = [
  'creme-anti-verrue',
  'creme-verrue-tk',
  'spraydouleurtk',
  'creme-ongle-incarne',
  'chaussette-compression',
  'patchdouleurtk',
  'patchdouleurfb',
  'crememinceurfb',
];

const out = process.argv[2] ?? `backups/templates-config-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1)}.json`;

const dump = { snapshotAt: new Date().toISOString(), templates: {} };

for (const slug of SLUGS) {
  process.stdout.write(`  ${slug.padEnd(28)} -> `);
  try {
    const r = await fetch(`${API}/templates/public/${slug}`);
    if (!r.ok) {
      console.log(`HTTP ${r.status}`);
      dump.templates[slug] = { error: `HTTP ${r.status}` };
      continue;
    }
    const { template: t } = await r.json();
    const cfg = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
    dump.templates[slug] = {
      id: t.id,
      productCode: t.productCode,
      title: t.title,
      templateVersion: t.templateVersion ?? cfg.templateVersion ?? 1,
      metaPixelId: t.metaPixelId ?? cfg.metaPixelId ?? null,
      persuasionBlocksCount: Array.isArray(cfg.persuasionBlocks) ? cfg.persuasionBlocks.length : 0,
      reviewsCount: Array.isArray(cfg.reviews) ? cfg.reviews.length : 0,
      imagesCount: Array.isArray(cfg.images?.gallery) ? cfg.images.gallery.length : 0,
      sizesCount: Array.isArray(cfg.sizes) ? cfg.sizes.length : 0,
      config: cfg,
    };
    console.log(`OK (id=${t.id}, v${dump.templates[slug].templateVersion}, ${dump.templates[slug].persuasionBlocksCount} blocks, ${dump.templates[slug].reviewsCount} reviews, ${dump.templates[slug].imagesCount} images)`);
  } catch (e) {
    console.log(`ERREUR: ${e.message}`);
    dump.templates[slug] = { error: e.message };
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dump, null, 2));
const okCount = Object.values(dump.templates).filter(t => !t.error).length;
console.log(`\nDump ecrit dans ${out}`);
console.log(`${okCount}/${SLUGS.length} templates sauvegardes`);
