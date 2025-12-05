# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION

## Railway (Backend + PostgreSQL) + Vercel (Frontend)

---

## 📋 PRÉREQUIS

✅ Compte GitHub  
✅ Compte Railway  
✅ Compte Vercel  
✅ Projet fonctionnel en local

---

## 🎯 ARCHITECTURE FINALE

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Make → https://votre-backend.up.railway.app/api/webhook/make │
│                                                             │
│  Users → https://votre-app.vercel.app                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# PARTIE 1 : PRÉPARER LE PROJET

## Étape 1.1 : Créer le repository GitHub

Allez sur : https://github.com/new

```
Repository name: gs-pipeline-app
Description: E-commerce order pipeline management
Public ✅
Add .gitignore: Node
```

## Étape 1.2 : Push le code vers GitHub

```bash
git init
git add .
git commit -m "Initial commit - GS Pipeline App"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/gs-pipeline-app.git
git push -u origin main
```

---

# PARTIE 2 : DÉPLOYER SUR RAILWAY (Backend)

## Étape 2.1 : Créer un nouveau projet Railway

1. Allez sur : https://railway.app
2. Cliquez sur **"New Project"**
3. Choisissez **"Deploy from GitHub repo"**
4. Sélectionnez votre repository **gs-pipeline-app**

## Étape 2.2 : Ajouter PostgreSQL

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Choisissez **"Database"** → **"Add PostgreSQL"**
3. Railway crée automatiquement la base de données

## Étape 2.3 : Configurer les variables d'environnement

Dans le service backend (pas la DB), allez dans **"Variables"** :

```bash
# Copiez la DATABASE_URL depuis le service PostgreSQL
DATABASE_URL=postgresql://...

# JWT Secret (générez-en un nouveau)
JWT_SECRET=votre_nouveau_secret_jwt_production

# Port (Railway le définit automatiquement)
PORT=5000

# Node env
NODE_ENV=production

# Make Webhook API Key (votre clé existante)
MAKE_WEBHOOK_API_KEY=436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf
```

## Étape 2.4 : Configurer le build

Railway détecte automatiquement Node.js. Vérifiez dans **"Settings"** :

```
Build Command: npm install
Start Command: npm run start
```

## Étape 2.5 : Appliquer les migrations Prisma

Dans **"Settings"** → **"Deploy"**, ajoutez :

```
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: node server.js
```

## Étape 2.6 : Récupérer l'URL publique

Une fois déployé, allez dans **"Settings"** → **"Networking"** :

```
Public URL: https://votre-app-xxxx.up.railway.app
```

**✅ Notez cette URL !**

---

# PARTIE 3 : DÉPLOYER SUR VERCEL (Frontend)

## Étape 3.1 : Créer un nouveau projet Vercel

1. Allez sur : https://vercel.com
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre repository **gs-pipeline-app**

## Étape 3.2 : Configurer le projet

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Étape 3.3 : Configurer les variables d'environnement

Dans **"Environment Variables"** :

```bash
VITE_API_URL=https://votre-app-xxxx.up.railway.app
```

⚠️ Remplacez par votre vraie URL Railway !

## Étape 3.4 : Déployer

Cliquez sur **"Deploy"**

Vercel va :
1. Cloner votre repo
2. Installer les dépendances
3. Build le frontend
4. Déployer

**✅ Vous obtiendrez une URL comme : https://gs-pipeline.vercel.app**

---

# PARTIE 4 : MISE À JOUR DU CODE POUR LA PRODUCTION

## Fichier à modifier : `frontend/src/lib/api.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Fichier à modifier : `server.js` (CORS)

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://votre-app.vercel.app'] 
    : 'http://localhost:3000',
  credentials: true
}));
```

---

# PARTIE 5 : CONFIGURATION MAKE

## Mettre à jour l'URL dans Make

1. Ouvrez votre scénario Make
2. Cliquez sur le module **HTTP**
3. Changez l'URL de :
   ```
   http://localhost:5000/api/webhook/make
   ```
   à :
   ```
   https://votre-app-xxxx.up.railway.app/api/webhook/make
   ```

4. **Sauvegardez**

---

# PARTIE 6 : INITIALISER LA BASE DE DONNÉES

## Option A : Via Railway CLI

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lancer une commande
railway run npx prisma migrate deploy
railway run node prisma/seed.js
```

## Option B : Depuis votre machine

```bash
# Copiez la DATABASE_URL de Railway
# Mettez-la temporairement dans votre .env local

DATABASE_URL="postgresql://postgres:xxx@containers-us-west-xxx.railway.app:7432/railway"

# Exécutez les migrations
npx prisma migrate deploy

# Seed la base
node prisma/seed.js
```

---

# PARTIE 7 : TESTS

## Test 1 : Backend accessible

```bash
curl https://votre-app-xxxx.up.railway.app/api/webhook/test \
  -H "X-API-KEY: 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"
```

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Webhook Make fonctionnel !"
}
```

## Test 2 : Frontend accessible

Ouvrez : https://gs-pipeline.vercel.app

**✅ Page de connexion doit s'afficher**

## Test 3 : Make → Backend

1. Dans Make, cliquez sur **"Run once"**
2. Remplissez votre formulaire
3. Vérifiez que la commande arrive dans l'app

---

# 🎉 DÉPLOIEMENT TERMINÉ !

Votre application est maintenant en production !

**URLs finales :**
- Frontend : https://gs-pipeline.vercel.app
- Backend : https://votre-app-xxxx.up.railway.app
- API Make : https://votre-app-xxxx.up.railway.app/api/webhook/make

---

# 🔧 MAINTENANCE

## Déployer une mise à jour

```bash
git add .
git commit -m "Mise à jour"
git push
```

- Railway redéploie automatiquement
- Vercel redéploie automatiquement

## Voir les logs

- **Railway** : Dashboard → Votre service → "Deployments" → "View Logs"
- **Vercel** : Dashboard → Votre projet → "Deployments" → Logs

---

# ⚠️ PROBLÈMES COURANTS

## Erreur : "Cannot connect to database"

- Vérifiez la DATABASE_URL dans Railway
- Vérifiez que PostgreSQL est démarré

## Erreur : "API request failed"

- Vérifiez VITE_API_URL dans Vercel
- Vérifiez CORS dans server.js

## Erreur : "Prisma not found"

Ajoutez `postinstall` dans package.json :

```json
"scripts": {
  "postinstall": "npx prisma generate"
}
```

---

**Besoin d'aide ? Je suis là ! 🚀**

