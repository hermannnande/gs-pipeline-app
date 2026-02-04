# 📊 ÉTAT ACTUEL DU PROJET GS PIPELINE (Supabase)

> **Dernière mise à jour : 1er février 2026**

---

## ✅ ARCHITECTURE ACTUELLE (EN PRODUCTION)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE SUPABASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (React + TypeScript)                                  │
│  └─→ https://obgestion.com (Vercel)                            │
│      └─→ Projet: obgestion-vercel                              │
│                                                                  │
│  Backend (Node.js + Express + Prisma)                          │
│  └─→ https://gs-pipeline-app-2.vercel.app (Vercel Serverless) │
│      └─→ Projet: gs-pipeline-app-2-vercel                      │
│                                                                  │
│  Base de données PostgreSQL                                     │
│  └─→ Supabase (eu-central-1)                                   │
│      └─→ Organisation: nandeherm2012@gmail.com                 │
│      └─→ Projet: xxxxxxxxxxxx (ID Supabase)                    │
│                                                                  │
│  Formulaires externes                                           │
│  └─→ Google Apps Script                                        │
│  └─→ Make.com (webhooks)                                       │
│      └─→ POST /api/webhook/make                                │
│      └─→ Header: X-API-KEY                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 MIGRATION RAILWAY → SUPABASE

### ✅ Migration terminée le : 1er février 2026

**Raisons de la migration :**
- Railway était l'ancienne plateforme d'hébergement PostgreSQL
- Supabase offre une meilleure intégration et des fonctionnalités supplémentaires
- Base de données PostgreSQL plus performante et scalable

**Données migrées :**
- ✅ 55 utilisateurs
- ✅ 24 produits
- ✅ 6 246 commandes
- ✅ 13 326 historiques de statuts
- ✅ 561 listes de livraison
- ✅ Configuration du pointage GPS (store_config, attendances)

---

## 🔑 CONFIGURATION ACTUELLE

### Variables d'environnement Backend (Vercel)

```bash
# Base de données Supabase
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Authentification
JWT_SECRET="votre_secret_jwt"

# Webhook (Make / Google Apps Script)
WEBHOOK_API_KEY="436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"
MAKE_WEBHOOK_API_KEY="436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"

# Supabase
SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="votre_service_role_key"
SUPABASE_STORAGE_BUCKET="chat"
```

### Variables d'environnement Frontend (Vercel)

```bash
# API Backend
VITE_API_URL="https://gs-pipeline-app-2.vercel.app"
```

### Configuration Domaine

**Domaine principal :** `obgestion.com`
- Frontend hébergé sur Vercel
- Proxy `/api/*` vers le backend Vercel

**Configuration Vercel (frontend/vercel.json) :**
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://gs-pipeline-app-2.vercel.app/api/$1"
    }
  ]
}
```

---

## 📦 FONCTIONNALITÉS ACTUELLES

### ✅ Fonctionnalités opérationnelles

1. **Gestion des commandes**
   - Réception via webhook (Make + Google Apps Script)
   - Statuts : NOUVELLE, A_APPELER, VALIDEE, ASSIGNEE, LIVREE, etc.
   - Historique complet des changements de statuts

2. **Rôles utilisateurs**
   - ADMIN : Accès total
   - GESTIONNAIRE : Gestion des commandes et livraisons
   - GESTIONNAIRE_STOCK : Gestion des stocks et produits
   - APPELANT : Appel des clients
   - LIVREUR : Livraisons sur le terrain

3. **Gestion du stock**
   - Stock disponible (stockActuel)
   - Stock EXPRESS (stockExpress)
   - Stock en livraison (stockLocalReserve)
   - Mouvements de stock tracés (stock_movements)
   - Confirmation REMISE et RETOUR

4. **Types de livraison**
   - LOCAL : Livraison locale classique
   - EXPEDITION : Paiement 100% avant envoi
   - EXPRESS : Paiement 10% + 90% à la réception

5. **Pointage GPS** (Nouveau - 1er février 2026)
   - Bouton de pointage Arrivée/Départ
   - Vérification de géolocalisation (rayon de tolérance)
   - Détection des retards
   - Page admin "Présences" pour consultation
   - Historique des pointages avec filtres et export CSV

6. **Chat entreprise**
   - Conversations entre équipes
   - Stockage Supabase Storage (bucket "chat")
   - Notifications en temps réel

7. **Statistiques et analytics**
   - Dashboard par rôle
   - Analyse des produits
   - Taux de conversion
   - Comptabilité

---

## 🛣️ ROUTES API PRINCIPALES

### Authentification
```
POST /api/auth/login          → Connexion
GET  /api/auth/me             → Utilisateur actuel
```

### Commandes
```
GET    /api/orders                → Liste des commandes (avec filtres)
POST   /api/orders                → Créer une commande manuellement
GET    /api/orders/:id            → Détails d'une commande
PUT    /api/orders/:id/status     → Changer le statut
POST   /api/orders/:id/marquer-appel → Notifier (compteur)
```

### Webhook (Formulaires externes)
```
POST /api/webhook/make        → Réception commandes (Make / Apps Script)
GET  /api/webhook/test        → Test de connectivité
```

### Stock
```
GET  /api/stock/products                        → Liste des produits
POST /api/stock/tournees/:id/confirm-remise    → Confirmer REMISE (⚡ CRITIQUE)
POST /api/stock/tournees/:id/confirm-retour    → Confirmer RETOUR (⚡ CRITIQUE)
GET  /api/stock-analysis/local-reserve          → Analyse stock en livraison
```

### Pointage GPS (Nouveau)
```
POST /api/attendance/mark-arrival      → Pointer arrivée
POST /api/attendance/mark-departure    → Pointer départ
GET  /api/attendance/my-attendance-today → Mon pointage du jour
GET  /api/attendance/history           → Historique (Admin/Gestionnaire)
GET  /api/attendance/store-config      → Configuration magasin
PUT  /api/attendance/store-config      → Modifier config (Admin)
```

### Utilisateurs
```
GET    /api/users          → Liste des utilisateurs
POST   /api/users          → Créer un utilisateur (Admin)
PUT    /api/users/:id      → Modifier un utilisateur
DELETE /api/users/:id      → Supprimer un utilisateur
```

### Statistiques
```
GET /api/stats/overview    → Vue d'ensemble
GET /api/stats/appelant    → Stats appelant
GET /api/stats/livreur     → Stats livreur
```

---

## ⚡ RÈGLES MÉTIER CRITIQUES

### 🔴 Stock : Les 2 Moments Clés

```
1️⃣ Gestionnaire de Stock clique "REMIS"
   → POST /api/stock/tournees/:id/confirm-remise
   → Stock disponible DIMINUE
   → Stock en livraison AUGMENTE
   → Mouvement de stock enregistré (REMISE_LIVREUR)

2️⃣ Gestionnaire de Stock clique "RETOUR"
   → POST /api/stock/tournees/:id/confirm-retour
   → Stock en livraison DIMINUE
   → Stock disponible AUGMENTE
   → Mouvement de stock enregistré (RETOUR_LIVREUR)
```

### ❌ Ce qui NE change PAS le stock

- ❌ Gestionnaire assigne des commandes
- ❌ Livreur marque REFUSEE/ANNULEE/RETOURNE
- ❌ Appelant valide une commande

### ✅ Ce qui change le stock

- ✅ Gestionnaire Stock confirme REMISE (déplace le stock)
- ✅ Livreur marque LIVREE (diminue stock en livraison)
- ✅ Gestionnaire Stock confirme RETOUR (retourne le stock)

---

## 🚨 PROBLÈMES RÉSOLUS RÉCEMMENT

### ✅ Problème 1 : Commandes n'arrivaient plus (1er février 2026)

**Cause :** 
- Séquence PostgreSQL `orders.id` désynchronisée après migration
- L'ID auto-incrémenté tentait de réutiliser un ID existant

**Solution :**
```sql
SELECT setval(pg_get_serial_sequence('orders', 'id'), 
  (SELECT MAX(id) FROM orders));
```
- Mécanisme d'auto-réparation ajouté dans `routes/order.routes.js` et `routes/webhook.routes.js`

### ✅ Problème 2 : Proxy API ne fonctionnait pas sur obgestion.com

**Cause :** 
- Le domaine custom `obgestion.com` n'avait pas de rewrite pour `/api/*`

**Solution :**
- Ajout de `frontend/vercel.json` avec rewrite vers le backend

### ✅ Problème 3 : UUID orderReference manquant

**Cause :** 
- Supabase n'avait pas la valeur par défaut `uuid_generate_v4()` configurée

**Solution :**
- Génération côté serveur avec `crypto.randomUUID()` dans les routes

---

## 📂 STRUCTURE DU PROJET

```
gs-pipeline-app/
├── prisma/
│   ├── schema.prisma           ⭐ Schéma de base de données
│   ├── migrations/             Historique des migrations
│   └── seed.js                 Données de test
│
├── routes/
│   ├── order.routes.js         Routes commandes
│   ├── stock.routes.js         ⚡ Routes stock (REMIS/RETOUR)
│   ├── webhook.routes.js       Webhook Make/Apps Script
│   ├── attendance.routes.js    ⭐ Routes pointage GPS
│   ├── user.routes.js          Routes utilisateurs
│   ├── delivery.routes.js      Routes livraisons
│   ├── express.routes.js       Routes EXPRESS
│   ├── stats.routes.js         Routes statistiques
│   └── chat.routes.js          Routes chat
│
├── middlewares/
│   └── auth.middleware.js      Auth JWT + Permissions
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/          Pages admin
│   │   │   │   ├── Attendances.tsx    ⭐ Page Présences GPS
│   │   │   │   └── ...
│   │   │   ├── gestionnaire/   Pages gestionnaire
│   │   │   ├── stock/          Pages gestion stock
│   │   │   ├── appelant/       Pages appelant
│   │   │   └── livreur/        Pages livreur
│   │   ├── components/
│   │   │   ├── attendance/
│   │   │   │   └── AttendanceButton.tsx  ⭐ Bouton pointage GPS
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── api.ts          Configuration API
│   │   └── store/
│   │       └── authStore.ts    State auth
│   └── vercel.json             ⭐ Config proxy API
│
├── server.js                   Point d'entrée backend
├── app.js                      Configuration Express
├── api/
│   └── index.js                Handler Vercel Serverless
├── vercel.json                 Config backend Vercel
└── package.json
```

---

## 🔄 WORKFLOW DE DÉVELOPPEMENT

### 1. Développement local

```bash
# Backend (racine)
npm run dev

# Frontend (dossier frontend)
cd frontend
npm run dev
```

### 2. Commit et déploiement

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

**Déploiement automatique :**
- Vercel détecte le push et déploie automatiquement
- Frontend : https://obgestion.com
- Backend : https://gs-pipeline-app-2.vercel.app

### 3. Vérifier le déploiement

```bash
# Test backend
curl https://gs-pipeline-app-2.vercel.app/api/webhook/test \
  -H "X-API-KEY: 436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf"

# Frontend
https://obgestion.com
```

---

## 🔐 SÉCURITÉ

### ⚠️ Clés API à ne JAMAIS commiter

- ✅ `.gitignore` configuré pour exclure :
  - `.env`
  - `import-railway-vers-supabase-*.sql`
  - `copie-railway-supabase.sql`
  - `verifier-schema-railway.sql`

### 🔑 Clés sensibles

**API Webhook :** `436FC6CBE81C45E8EokuRA<}yj[D<tBm])GApD@egB2MBGf`
- ⚠️ Cette clé a été exposée, il est recommandé de la régénérer

**JWT Secret :** Non divulgué
**Supabase Service Role Key :** Non divulgué

---

## 📊 STATISTIQUES DU PROJET

### Données actuelles (1er février 2026)

- **Utilisateurs :** 55
- **Produits :** 24
- **Commandes totales :** 6 923 (et plus)
- **Statuts :**
  - NOUVELLE : 2 127
  - LIVREE : 1 792
  - ANNULEE : 1 259
  - REFUSEE : 445
  - EXPRESS_LIVRE : 180
  - Autres : 1 120

### Technologies

- **Backend :** Node.js 18+, Express, Prisma ORM
- **Frontend :** React 18, TypeScript, Vite, TailwindCSS
- **Base de données :** PostgreSQL 15 (Supabase)
- **Hébergement :** Vercel (Frontend + Backend Serverless)
- **Formulaires :** Google Apps Script, Make.com
- **Stockage :** Supabase Storage (chat)

---

## 📝 DERNIÈRES MODIFICATIONS (1er février 2026)

### ✅ Ajout du système de pointage GPS

**Fichiers créés/modifiés :**
- `routes/attendance.routes.js` (créé)
- `frontend/src/components/attendance/AttendanceButton.tsx` (créé)
- `frontend/src/pages/admin/Attendances.tsx` (créé)
- `prisma/schema.prisma` (ajout modèles `StoreConfig` et `Attendance`)

**Fonctionnalités :**
- Bouton "Pointer Arrivée" / "Pointer Départ"
- Vérification géolocalisation (rayon de tolérance)
- Détection automatique des retards
- Page admin pour consulter l'historique
- Export CSV des présences

### ✅ Correction séquence orders.id

**Fichiers modifiés :**
- `routes/order.routes.js` (auto-réparation P2002)
- `routes/webhook.routes.js` (auto-réparation P2002)

### ✅ Configuration domaine obgestion.com

**Fichiers modifiés :**
- `frontend/vercel.json` (ajout rewrite `/api/*`)

---

## 🎯 PROCHAINES ÉTAPES POSSIBLES

### Améliorations suggérées

- [ ] Régénérer la clé API webhook (sécurité)
- [ ] Ajouter des tests automatisés
- [ ] Monitoring avec Sentry
- [ ] Optimisation des performances
- [ ] Application mobile (React Native)
- [ ] Notifications push en temps réel
- [ ] Export Excel avancé

---

## 📞 DOCUMENTATION COMPLÈTE

**Fichiers de référence :**

1. **ARCHITECTURE_ET_REGLES_METIER.md** → ⭐⭐⭐ LA BIBLE DU PROJET
2. **INDEX_PROJET.md** → Navigation dans la documentation
3. **GUIDE_DEMARRAGE_RAPIDE.md** → Commandes pratiques
4. **ETAT_ACTUEL_PROJET_SUPABASE.md** → Ce fichier

---

## ✅ RÉSUMÉ EXÉCUTIF

**Projet :** GS Pipeline - Back-office e-commerce  
**État :** ✅ En production et opérationnel  
**Plateforme :** Supabase (PostgreSQL) + Vercel (Full-stack)  
**Domaine :** https://obgestion.com  
**Dernière migration :** Railway → Supabase (1er février 2026)  
**Dernière fonctionnalité :** Pointage GPS (1er février 2026)

**🎉 Le projet est stable, documenté et prêt pour la production ! 🚀**

---

**Mise à jour suivante prévue :** Quand de nouvelles fonctionnalités seront ajoutées

