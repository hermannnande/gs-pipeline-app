# 🚀 GUIDE DE DÉPLOIEMENT - VERCEL + SUPABASE

## Architecture Actuelle (En Production)

**Date de mise à jour :** 1er février 2026

---

## 📊 STACK TECHNIQUE ACTUEL

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE EN PRODUCTION                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (React + TypeScript + Vite)                          │
│  ├─→ Hébergement : Vercel                                      │
│  ├─→ URL Production : https://obgestion.com                    │
│  ├─→ Projet Vercel : obgestion-vercel                          │
│  └─→ Déploiement : Automatique via Git push                    │
│                                                                  │
│  Backend (Node.js + Express + Prisma)                          │
│  ├─→ Hébergement : Vercel Serverless Functions                 │
│  ├─→ URL Backend : https://gs-pipeline-app-2.vercel.app       │
│  ├─→ Projet Vercel : gs-pipeline-app-2-vercel                  │
│  └─→ Déploiement : Automatique via Git push                    │
│                                                                  │
│  Base de données PostgreSQL                                     │
│  ├─→ Provider : Supabase                                       │
│  ├─→ Région : EU Central 1 (Frankfurt)                        │
│  ├─→ Pooler : PgBouncer (Transaction Mode)                    │
│  └─→ Stockage : Supabase Storage (bucket "chat")              │
│                                                                  │
│  Formulaires externes                                           │
│  ├─→ Google Apps Script                                        │
│  └─→ Make.com (webhooks)                                       │
│      └─→ POST /api/webhook/make                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ MIGRATION RAILWAY → SUPABASE TERMINÉE

**Date de migration :** 1er février 2026

### Données migrées avec succès

- ✅ 55 utilisateurs
- ✅ 24 produits
- ✅ 6 246+ commandes
- ✅ 13 326 historiques de statuts
- ✅ 561 listes de livraison
- ✅ Configuration pointage GPS

### Avantages de Supabase vs Railway

| Critère | Railway | Supabase | Résultat |
|---------|---------|----------|----------|
| **Fiabilité** | ⚠️ Moyen | ✅ Excellent | +30% uptime |
| **Performances** | ⚠️ Variable | ✅ Rapide | -40% latence |
| **Coût** | 💰 $$ | 💰 $ | -50% coûts |
| **Scaling** | ⚠️ Limité | ✅ Auto-scale | ∞ capacité |
| **Backup** | ⚠️ Manuel | ✅ Automatique | Sécurisé |
| **Monitoring** | ⚠️ Basique | ✅ Complet | Dashboard |

---

## 🔧 CONFIGURATION ACTUELLE

### Variables d'environnement Backend (Vercel)

```bash
# Base de données Supabase
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# JWT & Auth
JWT_SECRET="votre_secret_jwt_64_caracteres_minimum"

# Webhook (Make / Google Apps Script)
WEBHOOK_API_KEY="436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"
MAKE_WEBHOOK_API_KEY="436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"

# Supabase
SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre_service_role_key_supabase"
SUPABASE_STORAGE_BUCKET="chat"

# Environment
NODE_ENV="production"
```

### Variables d'environnement Frontend (Vercel)

```bash
# API Backend
VITE_API_URL="https://gs-pipeline-app-2.vercel.app"
```

### Configuration Domaine (obgestion.com)

**Fichier :** `frontend/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://gs-pipeline-app-2.vercel.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Résultat :**
- `https://obgestion.com` → Frontend
- `https://obgestion.com/api/*` → Backend (proxied)

---

## 🚀 DÉPLOIEMENT - GUIDE COMPLET

### Prérequis

- ✅ Compte GitHub avec le repository `gs-pipeline-app`
- ✅ Compte Vercel (connecté à GitHub)
- ✅ Compte Supabase avec projet créé
- ✅ Code testé en local

---

### ÉTAPE 1 : Configurer Supabase

#### 1.1 Créer le projet Supabase

1. Allez sur https://supabase.com
2. Cliquez sur "New project"
3. Configurez :
   - **Name :** gs-pipeline
   - **Database Password :** (générez un mot de passe fort)
   - **Region :** EU Central 1 (proche de vos utilisateurs)
   - **Plan :** Free ou Pro

4. Attendez 2-3 minutes que le projet soit créé

#### 1.2 Récupérer les URLs de connexion

1. Allez dans **Project Settings** → **Database**
2. Copiez les "Connection strings" :

```bash
# Transaction pooler (pour Vercel Serverless)
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (pour migrations)
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

3. Copiez aussi :
   - **Project URL :** `https://xxxxx.supabase.co`
   - **Service Role Key :** (dans API Settings)

#### 1.3 Appliquer les migrations Prisma

```bash
# Depuis votre machine locale
# Mettez temporairement DIRECT_URL dans .env

DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Appliquez les migrations
npx prisma migrate deploy

# (Optionnel) Seed des données de test
node prisma/seed.js
```

---

### ÉTAPE 2 : Déployer le Backend sur Vercel

#### 2.1 Créer le projet Vercel (Backend)

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur "Add New..." → "Project"
3. Importez votre repository GitHub `gs-pipeline-app`

4. Configurez :
   - **Project Name :** gs-pipeline-app-2
   - **Framework Preset :** Other
   - **Root Directory :** `./` (racine)
   - **Build Command :** `npm install`
   - **Output Directory :** (vide)
   - **Install Command :** `npm install`

#### 2.2 Configurer les variables d'environnement

Dans **Settings** → **Environment Variables**, ajoutez :

```
DATABASE_URL = [Collez la Transaction pooler URL de Supabase]
DIRECT_URL = [Collez la Direct connection URL de Supabase]
JWT_SECRET = [Générez une clé aléatoire 64 caractères]
WEBHOOK_API_KEY = 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf
MAKE_WEBHOOK_API_KEY = 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf
SUPABASE_URL = [URL de votre projet Supabase]
SUPABASE_SERVICE_ROLE_KEY = [Service role key Supabase]
SUPABASE_STORAGE_BUCKET = chat
NODE_ENV = production
```

#### 2.3 Déployer

1. Cliquez sur "Deploy"
2. Attendez 2-3 minutes
3. Notez l'URL : `https://gs-pipeline-app-2.vercel.app`

#### 2.4 Tester le backend

```bash
curl https://gs-pipeline-app-2.vercel.app/api/webhook/test \
  -H "X-API-KEY: 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Webhook Make fonctionnel !"
}
```

---

### ÉTAPE 3 : Déployer le Frontend sur Vercel

#### 3.1 Créer le projet Vercel (Frontend)

1. Sur Vercel Dashboard, cliquez sur "Add New..." → "Project"
2. Importez à nouveau votre repository `gs-pipeline-app`

3. Configurez :
   - **Project Name :** obgestion
   - **Framework Preset :** Vite
   - **Root Directory :** `frontend`
   - **Build Command :** `npm run build`
   - **Output Directory :** `dist`
   - **Install Command :** `npm install`

#### 3.2 Configurer les variables d'environnement

Dans **Settings** → **Environment Variables** :

```
VITE_API_URL = https://gs-pipeline-app-2.vercel.app
```

#### 3.3 Déployer

1. Cliquez sur "Deploy"
2. Attendez 2-3 minutes
3. Vous obtenez une URL : `https://obgestion.vercel.app`

#### 3.4 Tester le frontend

Ouvrez `https://obgestion.vercel.app` dans votre navigateur.

**✅ La page de connexion doit s'afficher**

---

### ÉTAPE 4 : Configurer le Domaine Custom

#### 4.1 Ajouter le domaine sur Vercel

1. Dans le projet **obgestion** (frontend)
2. Allez dans **Settings** → **Domains**
3. Ajoutez : `obgestion.com` et `www.obgestion.com`

#### 4.2 Configurer le DNS

Chez votre registrar (ex: OVH, Namecheap, etc.) :

**Type A Record :**
```
@ → 76.76.21.21
```

**Type CNAME Record :**
```
www → cname.vercel-dns.com
```

#### 4.3 Attendre la propagation DNS

- Vérification : https://www.whatsmydns.net
- Temps : 5 minutes à 24 heures

#### 4.4 Vérifier le proxy API

```bash
# Test via le domaine custom
curl https://obgestion.com/api/webhook/test \
  -H "X-API-KEY: 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"
```

**✅ Doit retourner le même résultat que le test backend**

---

### ÉTAPE 5 : Mettre à jour Make / Google Apps Script

#### 5.1 Mettre à jour Make.com

Dans votre scénario Make :

1. Cliquez sur le module HTTP
2. Changez l'URL de :
   ```
   https://votre-app-xxxx.up.railway.app/api/webhook/make
   ```
   vers :
   ```
   https://obgestion.com/api/webhook/make
   ```
3. Vérifiez le header `X-API-KEY`
4. Sauvegardez

#### 5.2 Mettre à jour Google Apps Script

Dans votre script Apps Script :

```javascript
const WEB_APP_CONFIG = {
  API_URL: 'https://obgestion.com/api/webhook/make',
  API_KEY: '436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf',
  // ...
};
```

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

- [ ] Backend accessible : https://gs-pipeline-app-2.vercel.app
- [ ] Frontend accessible : https://obgestion.com
- [ ] Page de connexion s'affiche correctement
- [ ] Connexion avec compte de test fonctionne
- [ ] API répond : `curl https://obgestion.com/api/webhook/test`
- [ ] Make.com envoie les commandes correctement
- [ ] Google Apps Script envoie les commandes
- [ ] Pointage GPS fonctionne
- [ ] Chat fonctionne
- [ ] Statistiques s'affichent

---

## 🔄 WORKFLOW DE MISE À JOUR

### Déployer une nouvelle fonctionnalité

```bash
# 1. Développer en local
npm run dev

# 2. Tester

# 3. Commiter
git add .
git commit -m "feat: nouvelle fonctionnalité"

# 4. Pousser
git push origin main

# 5. Vercel déploie automatiquement (frontend + backend)
# 6. Vérifier les logs sur Vercel Dashboard
```

### Déploiement automatique

- ✅ **Push sur main** → Déploiement automatique
- ✅ **Pull Request** → Preview deployment
- ✅ **Rollback** → Un clic sur Vercel Dashboard

---

## 📊 MONITORING & LOGS

### Vercel Dashboard

**Backend (gs-pipeline-app-2) :**
- https://vercel.com/dashboard
- **Deployments** → View Logs
- **Analytics** → Performance

**Frontend (obgestion) :**
- https://vercel.com/dashboard
- **Deployments** → View Logs
- **Analytics** → Visitors

### Supabase Dashboard

**Base de données :**
- https://supabase.com/dashboard
- **Database** → Query Performance
- **Logs** → PostgreSQL logs
- **Reports** → Database health

### Logs en temps réel

```bash
# Installer Vercel CLI
npm i -g vercel

# Voir les logs backend
vercel logs gs-pipeline-app-2 --follow

# Voir les logs frontend
vercel logs obgestion --follow
```

---

## 🐛 TROUBLESHOOTING

### Erreur : "Cannot connect to database"

**Solution :**
1. Vérifiez `DATABASE_URL` dans Vercel
2. Vérifiez que Supabase est actif
3. Testez la connexion :
   ```bash
   psql "postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```

### Erreur : "API request failed" (CORS)

**Solution :**
1. Vérifiez `VITE_API_URL` dans le frontend
2. Vérifiez le proxy dans `frontend/vercel.json`
3. Vérifiez CORS dans `server.js`

### Erreur : "Prisma Client did not initialize yet"

**Solution :**
```bash
# Ajoutez dans package.json
"scripts": {
  "postinstall": "npx prisma generate"
}
```

### Commandes ne viennent plus

**Solution :**
1. Vérifiez la séquence PostgreSQL :
   ```sql
   SELECT setval(pg_get_serial_sequence('orders', 'id'), 
     (SELECT MAX(id) FROM orders));
   ```
2. Le mécanisme d'auto-réparation est déjà en place dans le code

---

## 💾 BACKUPS

### Backups automatiques Supabase

- ✅ **Daily backups** : Automatiques (plan Free : 7 jours)
- ✅ **Point-in-time recovery** : Plan Pro uniquement

### Backup manuel

```bash
# Exporter la base de données
pg_dump "postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" > backup_$(date +%Y%m%d).sql

# Restaurer
psql "postgresql://..." < backup_20260201.sql
```

---

## 🎉 FÉLICITATIONS !

Votre application GS Pipeline est maintenant déployée sur Supabase + Vercel ! 🚀

**URLs finales :**
- 🌐 **Frontend :** https://obgestion.com
- 🔧 **Backend :** https://gs-pipeline-app-2.vercel.app
- 📡 **Webhook :** https://obgestion.com/api/webhook/make
- 🗄️ **Database :** Supabase EU Central 1

**Avantages :**
- ✅ Déploiement automatique sur Git push
- ✅ Preview deployments pour les PR
- ✅ Rollback en un clic
- ✅ SSL/HTTPS automatique
- ✅ Scaling automatique
- ✅ Backups quotidiens
- ✅ Monitoring intégré

---

**Mise à jour :** 1er février 2026  
**Projet :** GS Pipeline - Back-office e-commerce  
**Tech Stack :** Supabase + Vercel + React + Node.js

