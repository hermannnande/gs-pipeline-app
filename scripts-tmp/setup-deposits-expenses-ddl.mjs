import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.vercel.prod','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["'\r]$/g,'')];}));
const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

// NOTE (types réels prod vérifiés via information_schema) : users.id / companies.id
// sont des INTEGER — la DDL est donc en SERIAL/INTEGER (et non TEXT).
const stmts = [
`CREATE TABLE IF NOT EXISTS livreur_deposits (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES companies(id),
  "livreurId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "nbLivraisons" INTEGER NOT NULL DEFAULT 0,
  "montantCollecte" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "commissionParLivraison" DOUBLE PRECISION NOT NULL DEFAULT 1500,
  "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "montantAttendu" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "montantDepose" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ecart DOUBLE PRECISION NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'DECLARE',
  "verifiedById" INTEGER REFERENCES users(id),
  "verifiedAt" TIMESTAMP(3),
  note TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE UNIQUE INDEX IF NOT EXISTS livreur_deposits_company_livreur_date_key ON livreur_deposits("companyId","livreurId",date)`,
`CREATE INDEX IF NOT EXISTS livreur_deposits_company_date_idx ON livreur_deposits("companyId",date)`,
`CREATE TABLE IF NOT EXISTS daily_expenses (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  libelle TEXT NOT NULL,
  montant DOUBLE PRECISION NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'DIVERS',
  "createdById" INTEGER NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE INDEX IF NOT EXISTS daily_expenses_company_date_idx ON daily_expenses("companyId",date)`,
];
for (const s of stmts) { await prisma.$executeRawUnsafe(s); }
const check = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('livreur_deposits','daily_expenses') ORDER BY 1`);
console.log('TABLES CREEES :', JSON.stringify(check));
await prisma.$disconnect();
