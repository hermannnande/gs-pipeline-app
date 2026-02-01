# Déploiement 100% Vercel + Supabase (sans Railway)

Objectif: garder **uniquement**:
- **Frontend** sur Vercel
- **API (backend)** sur Vercel (Serverless Functions)
- **Base de données** sur Supabase
- **Fichiers du chat** sur Supabase Storage

> Note: Socket.io (WebSocket) n'est pas compatible avec l'approche serverless Vercel.
> Le chat et les conversations sont donc en **polling** (rafraîchissement automatique), ce qui reste fonctionnel.

---

## 1) Supabase: créer le bucket Storage du chat

Dans Supabase:
- Storage → Create a new bucket
- Nom: `chat` (ou un autre nom)
- **Public bucket**: ON (plus simple)

Si tu choisis un autre nom, il faudra définir `SUPABASE_CHAT_BUCKET` sur Vercel.

---

## 2) Vercel: déployer l'API (backend)

Crée un **nouveau projet Vercel** pour le backend:
- Import Git Repository → sélectionne ton repo
- Root Directory: **racine du repo** (pas `frontend/`)

### Variables d'environnement (Backend)

Dans Vercel → Project → Settings → Environment Variables:

#### Obligatoires
- `DATABASE_URL`
  - **Transaction pooler Supabase** (port 6543)
  - Username format: `postgres.<projectRef>`
  - Ajoute `?pgbouncer=true` (recommandé en pooler)
  - Ajoute aussi `sslmode=require` (TLS)
  - Exemple:
    - `postgresql://postgres.<projectRef>:<PASSWORD>@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`
- `DIRECT_URL`
  - **Direct connection Supabase** (port 5432) pour Prisma migrate (si besoin)
  - Exemple:
    - `postgresql://postgres:<PASSWORD>@db.<projectRef>.supabase.co:5432/postgres?sslmode=require`
- `JWT_SECRET`
  - Mets la même valeur que ton `.env` actuel
- `SUPABASE_URL`
  - Exemple: `https://<projectRef>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`
  - Depuis Supabase → Project Settings → API → **service_role key**
- `SUPABASE_CHAT_BUCKET`
  - `chat` (ou le nom que tu as choisi)

#### Optionnelles
- `CORS_ORIGINS`
  - Liste séparée par des virgules des origines à autoriser en plus
  - Exemple: `https://ton-frontend.vercel.app,https://ton-domaine.com`
- `WEBHOOK_API_KEY`
  - Si tu utilises les webhooks Make, mets la même valeur qu'avant

### Tester l'API

Après déploiement, teste:
- `https://<backend>.vercel.app/api/health`
  - Doit répondre `{ status: "healthy", ... }`

---

## 3) Vercel: configurer le Frontend

Ton frontend est déjà sur Vercel. Il faut juste pointer vers l'API:

Vercel (frontend) → Settings → Environment Variables:
- `VITE_API_URL` = `https://<backend>.vercel.app/api`

Redeploy le frontend.

---

## 4) Vérification finale (avant suppression Railway)

Teste sur ton site:
- Connexion
- Liste commandes
- Création / update commande
- Chat (envoi texte + fichier)

Si tout marche ✅, tu peux supprimer Railway.

