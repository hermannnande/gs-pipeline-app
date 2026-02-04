# 🚀 GUIDE DE DÉMARRAGE RAPIDE

> **Pour reprendre rapidement le développement après une pause**

---

## 📌 LIENS RAPIDES

### **Documentation**
- 📚 **[ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)** ← **RÉFÉRENCE ABSOLUE**
- 📖 [README.md](./README.md) - Vue d'ensemble du projet
- 📦 [STOCK_LOCAL_RESERVE_GUIDE.md](./STOCK_LOCAL_RESERVE_GUIDE.md) - Détails sur le stock local
- 🚚 [GUIDE_GESTIONNAIRE_STOCK_EXPEDITIONS.md](./GUIDE_GESTIONNAIRE_STOCK_EXPEDITIONS.md) - Expéditions et Express

### **Déploiement**
- Backend : https://gs-pipeline-app-2.vercel.app (Vercel)
- Frontend : https://obgestion.com (Vercel)
- Base de données : PostgreSQL sur Supabase

---

## ⚡ COMMANDES RAPIDES

### **Développement local**

```bash
# Backend (depuis la racine)
npm run dev

# Frontend (depuis ./frontend)
cd frontend
npm run dev
```

### **Base de données**

```bash
# Créer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Regénérer le client Prisma
npx prisma generate

# Interface graphique de la DB
npx prisma studio
```

### **Déploiement**

```bash
# Commiter et pousser
git add -A
git commit -m "Description des changements"
git push

# Vercel déploie automatiquement le frontend et le backend
```

---

## 🔑 RÈGLES MÉTIER CRITIQUES

### **⚠️ Stock : Les 2 Moments Clés**

```
1️⃣ Gestionnaire de Stock clique "REMIS"
   → Stock disponible DIMINUE
   → Stock en livraison AUGMENTE

2️⃣ Gestionnaire de Stock clique "RETOUR"
   → Stock en livraison DIMINUE
   → Stock disponible AUGMENTE
```

### **❌ Ce qui NE change PAS le stock**

- ❌ Gestionnaire assigne des commandes
- ❌ Livreur marque REFUSEE/ANNULEE/RETOURNE

### **✅ Ce qui change le stock**

- ✅ Gestionnaire Stock confirme REMISE
- ✅ Livreur marque LIVREE (diminue stock en livraison)
- ✅ Gestionnaire Stock confirme RETOUR

---

## 📂 FICHIERS CRITIQUES

### **Backend - Routes principales**

```
routes/order.routes.js (ligne 219)
└── PUT /api/orders/:id/status
    └── Change le statut, diminue stockLocalReserve si LIVREE

routes/stock.routes.js (ligne 207)
└── POST /api/stock/tournees/:id/confirm-remise
    └── ⚡ Déplace stock disponible → stock en livraison

routes/stock.routes.js (ligne 313)
└── POST /api/stock/tournees/:id/confirm-retour
    └── ⚡ Retourne stock en livraison → stock disponible

routes/order.routes.js (ligne 181)
└── POST /api/orders/:id/marquer-appel
    └── Incrémente le compteur de notifications
```

### **Frontend - Pages principales**

```
frontend/src/pages/appelant/Orders.tsx
└── Page "À appeler" avec bouton "Notifier"

frontend/src/pages/stock/Tournees.tsx
└── ⚡ Confirmation REMISE et RETOUR (CRITIQUE)

frontend/src/pages/stock/Products.tsx
└── Gestion des produits et visualisation du stock

frontend/src/pages/livreur/Overview.tsx
└── Mes tournées et actions de livraison
```

### **Base de données - Schéma**

```
prisma/schema.prisma
└── Modèles : Order, Product, TourneeStock, StockMovement
```

---

## 🐛 DÉBOGAGE RAPIDE

### **Problème : Le stock ne bouge pas**

```bash
# 1. Vérifier le stock actuel
npx prisma studio
# Ouvrir la table "products"

# 2. Vérifier les mouvements
# Ouvrir la table "stock_movements"
# Trier par createdAt DESC

# 3. Vérifier les tournées
# Ouvrir la table "tournees_stock"
# Vérifier colisRemisConfirme et colisRetourConfirme
```

### **Problème : Les notifications ne s'affichent pas**

```bash
# 1. Vérifier la table orders
# Colonne nombreAppels doit être > 0

# 2. Vérifier que callerId est bien rempli

# 3. Vérifier la relation avec la table users
```

### **Problème : Le déploiement échoue**

```bash
# 1. Vérifier les logs Vercel
# Dashboard Vercel → Deployments → View Logs

# 2. Vérifier les variables d'environnement
# Dashboard Vercel → Settings → Environment Variables

# 3. Tester localement d'abord
npm run dev
```

---

## 📝 CHECKLIST AVANT MODIFICATION

Avant de modifier la logique de stock :

- [ ] Lire [ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)
- [ ] Vérifier les 2 moments clés (REMIS et RETOUR)
- [ ] Ne PAS toucher à `routes/delivery.routes.js` (assignation)
- [ ] Tester le flux complet après modification
- [ ] Créer une migration si besoin

Avant de modifier les statuts :

- [ ] Comprendre le cycle de vie complet
- [ ] Vérifier que le stock ne bouge PAS lors du changement de statut
- [ ] Documenter les changements dans ARCHITECTURE_ET_REGLES_METIER.md

---

## 🔄 WORKFLOW DE DÉVELOPPEMENT

### **1. Créer une nouvelle fonctionnalité**

```bash
# 1. Créer une branche (optionnel)
git checkout -b feature/nom-fonctionnalite

# 2. Coder la fonctionnalité
# Tester localement

# 3. Documenter dans ARCHITECTURE_ET_REGLES_METIER.md

# 4. Commiter et pousser
git add -A
git commit -m "feat: Description de la fonctionnalité"
git push

# 5. Tester en production après déploiement
```

### **2. Corriger un bug**

```bash
# 1. Reproduire le bug localement
# 2. Identifier la cause (voir section Débogage)
# 3. Corriger et tester
# 4. Commiter et pousser
git commit -m "fix: Description du bug corrigé"
git push
```

### **3. Modifier le schéma de base de données**

```bash
# 1. Modifier prisma/schema.prisma
# 2. Créer la migration
npx prisma migrate dev --name description_changement

# 3. Tester localement
npm run dev

# 4. Commiter AVEC le fichier de migration
git add prisma/migrations/
git commit -m "db: Description des changements DB"
git push

# 5. Vercel appliquera automatiquement la migration
```

---

## 🎯 OBJECTIFS FUTURS

### **Fonctionnalités à développer**

- [ ] Optimisation automatique des routes de livraison
- [ ] Notifications push en temps réel
- [ ] Export Excel des statistiques
- [ ] Intégration avec services de paiement mobile
- [ ] Application mobile pour livreurs (React Native)

### **Améliorations techniques**

- [ ] Tests unitaires (Jest)
- [ ] Tests end-to-end (Playwright)
- [ ] Monitoring des performances (Sentry)
- [ ] Logs structurés (Winston)

---

## 📞 CONTACTS ET RESSOURCES

### **Documentation technique**
- Node.js : https://nodejs.org/docs
- Prisma : https://www.prisma.io/docs
- React : https://react.dev
- TailwindCSS : https://tailwindcss.com/docs

### **Déploiement**
- Supabase : https://supabase.com/docs
- Vercel : https://vercel.com/docs

---

## 🚨 EN CAS D'URGENCE

### **Le site est down**

```bash
# 1. Vérifier le statut sur Vercel Dashboard
# https://vercel.com/dashboard

# 2. Voir les logs
# Vercel Dashboard → Deployments → View Logs

# 3. Redéployer
# Vercel Dashboard → Deployments → Redeploy

# 4. Si ça ne marche pas, rollback
# Vercel Dashboard → Deployments → Promote to Production (version précédente)
```

### **Les données sont corrompues**

```bash
# 1. Se connecter à la DB de production Supabase
# Supabase Dashboard → SQL Editor

# 2. Vérifier l'intégrité
SELECT COUNT(*) FROM orders WHERE status IS NULL;

# 3. Contacter l'équipe technique
# NE PAS exécuter de DELETE ou UPDATE sans backup
```

---

**📌 RAPPEL : [ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md) est votre meilleur ami !**

