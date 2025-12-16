# 📚 INDEX COMPLET DU PROJET GS PIPELINE

> **⭐ FICHIER PRINCIPAL - POINT D'ENTRÉE POUR TOUT COMPRENDRE**
> Dernière mise à jour : 16 décembre 2025

---

## 🎯 POUR COMPRENDRE LE PROJET EN 5 MINUTES

**Lisez ces 3 fichiers dans l'ordre :**

1. 📖 **[README.md](./README.md)** - Vue d'ensemble du projet (5 min)
2. ⭐ **[ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)** - **LA BIBLE DU PROJET** (20 min)
3. 🚀 **[GUIDE_DEMARRAGE_RAPIDE.md](./GUIDE_DEMARRAGE_RAPIDE.md)** - Commandes et workflow (5 min)

---

## 📁 STRUCTURE COMPLÈTE DE LA DOCUMENTATION

### **📖 DOCUMENTATION GÉNÉRALE**

| Fichier | Description | Importance |
|---------|-------------|------------|
| **[ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)** | **⭐⭐⭐ RÉFÉRENCE ABSOLUE** - Tous les rôles, flux, règles de stock, routes API, exemples | **CRITIQUE** |
| [README.md](./README.md) | Vue d'ensemble, fonctionnalités, installation, déploiement | Important |
| [GUIDE_DEMARRAGE_RAPIDE.md](./GUIDE_DEMARRAGE_RAPIDE.md) | Commandes rapides, débogage, checklist | Pratique |
| [INDEX_PROJET.md](./INDEX_PROJET.md) | Ce fichier - Navigation dans le projet | Utile |

---

### **📦 DOCUMENTATION GESTION DE STOCK**

| Fichier | Description | Importance |
|---------|-------------|------------|
| [STOCK_LOCAL_RESERVE_GUIDE.md](./STOCK_LOCAL_RESERVE_GUIDE.md) | Détails sur le stock en livraison (stockLocalReserve) | Important |
| [SCHEMA_STOCK_EXPRESS.md](./SCHEMA_STOCK_EXPRESS.md) | Schéma du système de stock EXPRESS (10% + 90%) | Important |
| [MISE_A_JOUR_STOCK.md](./MISE_A_JOUR_STOCK.md) | Historique de la mise en place du système de stock | Référence |
| [CORRECTION_LOGIQUE_STOCK.md](./CORRECTION_LOGIQUE_STOCK.md) | Corrections apportées à la logique de stock | Référence |

---

### **🚚 DOCUMENTATION EXPÉDITIONS & EXPRESS**

| Fichier | Description | Importance |
|---------|-------------|------------|
| [WORKFLOW_EXPEDITION_COMPLET.md](./WORKFLOW_EXPEDITION_COMPLET.md) | Workflow des expéditions (100% payé) | Important |
| [EXPEDITION_EXPRESS_SPECS_DEVELOPPEUR.md](./EXPEDITION_EXPRESS_SPECS_DEVELOPPEUR.md) | Spécifications techniques EXPEDITION/EXPRESS | Important |
| [GUIDE_GESTIONNAIRE_STOCK_EXPEDITIONS.md](./GUIDE_GESTIONNAIRE_STOCK_EXPEDITIONS.md) | Guide pour le gestionnaire de stock | Pratique |
| [GUIDE_ASSIGNATION_LIVREUR_EXPEDITION.md](./GUIDE_ASSIGNATION_LIVREUR_EXPEDITION.md) | Comment assigner un livreur à une expédition | Pratique |
| [LISTE_AGENCES_EXPRESS.md](./LISTE_AGENCES_EXPRESS.md) | Liste des agences de retrait EXPRESS | Référence |

---

### **🔧 DOCUMENTATION TECHNIQUE**

| Fichier | Description | Importance |
|---------|-------------|------------|
| [STOCK_MANAGEMENT.md](./STOCK_MANAGEMENT.md) | Gestion technique du stock | Technique |
| [PERMISSIONS_EXPEDITIONS_EXPRESS.md](./PERMISSIONS_EXPEDITIONS_EXPRESS.md) | Permissions par rôle | Technique |
| [CORRECTION_VISIBILITE_LIVREUR.md](./CORRECTION_VISIBILITE_LIVREUR.md) | Corrections de visibilité | Historique |
| [CORRECTION_GESTIONNAIRE_STOCK_ACCES.md](./CORRECTION_GESTIONNAIRE_STOCK_ACCES.md) | Corrections d'accès | Historique |

---

### **🧪 DOCUMENTATION TESTS**

| Fichier | Description | Importance |
|---------|-------------|------------|
| [GUIDE_TEST_COMMANDES.md](./GUIDE_TEST_COMMANDES.md) | Guide pour tester les commandes | Test |
| [RESUME_FINAL.md](./RESUME_FINAL.md) | Résumé final du système | Vue d'ensemble |

---

## 🔑 LES 5 RÈGLES MÉTIER CRITIQUES

> **À CONNAÎTRE PAR CŒUR** - Détails dans [ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)

### **1️⃣ Stock NE bouge PAS lors de l'assignation**
```
❌ Gestionnaire assigne des commandes → Stock ne change pas
```

### **2️⃣ Stock se déplace lors de la confirmation REMIS**
```
✅ Gestionnaire Stock clique "Remis"
   → Stock disponible DIMINUE
   → Stock en livraison AUGMENTE
```

### **3️⃣ Seul LIVREE diminue le stock en livraison**
```
✅ Livreur marque LIVREE → Stock en livraison DIMINUE
❌ Livreur marque REFUSEE → Stock ne change PAS
❌ Livreur marque ANNULEE → Stock ne change PAS
```

### **4️⃣ Stock revient lors de la confirmation RETOUR**
```
✅ Gestionnaire Stock clique "Retour"
   → Stock en livraison DIMINUE
   → Stock disponible AUGMENTE
```

### **5️⃣ Notification n'est PAS un statut**
```
✅ Appelant clique "Notifier"
   → Compteur nombreAppels s'incrémente
   → Badge apparaît
   → Statut ne change PAS
```

---

## 🗂️ ARCHITECTURE DU CODE

### **Backend (Node.js + Express + Prisma)**

```
├── prisma/
│   ├── schema.prisma              ⭐ Schéma de base de données
│   └── migrations/                 Historique des modifications DB
│
├── routes/
│   ├── order.routes.js            ⭐ Routes des commandes (statuts, notifications)
│   ├── stock.routes.js            ⭐⭐ Routes de stock (REMIS, RETOUR) - CRITIQUE
│   ├── stock.analysis.routes.js  📊 Analyse du stock en livraison
│   ├── delivery.routes.js          Routes de livraison
│   ├── user.routes.js              Routes des utilisateurs
│   ├── express.routes.js           Routes EXPRESS
│   └── webhook.routes.js           Routes webhook (Make)
│
├── middlewares/
│   └── auth.middleware.js          Authentification JWT + Permissions
│
└── server.js                        Point d'entrée
```

### **Frontend (React + TypeScript + Vite)**

```
frontend/src/
├── pages/
│   ├── appelant/
│   │   └── Orders.tsx             📞 Page "À appeler" avec bouton Notifier
│   ├── gestionnaire/
│   │   ├── Orders.tsx              📋 Commandes validées
│   │   ├── Deliveries.tsx          🚚 Création de tournées
│   │   └── ExpressAgence.tsx       ⚡ EXPRESS en agence
│   ├── stock/
│   │   ├── Overview.tsx            📊 Dashboard stock
│   │   ├── Products.tsx            📦 Gestion des produits
│   │   ├── Tournees.tsx           ⭐⭐ Confirmation REMIS/RETOUR - CRITIQUE
│   │   ├── LiveraisonEnCours.tsx  🚚 Stock en livraison (analysé)
│   │   └── Movements.tsx           📈 Historique des mouvements
│   └── livreur/
│       └── Overview.tsx            🚚 Mes tournées
│
├── components/                     Composants réutilisables
├── lib/
│   └── api.ts                      Configuration API
├── types/
│   └── index.ts                    Types TypeScript
└── App.tsx                         Router principal
```

---

## 🔄 FLUX COMPLET D'UNE COMMANDE LOCALE

```
1. RÉCEPTION (site web)
   └── Statut: NOUVELLE
       └── Stock: ❌ Aucun changement

2. APPELANT appelle
   ├── Clique "Notifier" → Badge nombreAppels +1 (statut inchangé)
   └── Valide → VALIDEE
       └── Stock: ❌ Aucun changement

3. GESTIONNAIRE assigne à un livreur
   └── Statut: ASSIGNEE
       └── Stock: ❌ Aucun changement

4. GESTIONNAIRE DE STOCK confirme REMIS ⚡
   └── TourneeStock.colisRemisConfirme = true
       └── Stock: ✅ disponible -X, en livraison +X

5. LIVREUR livre
   ├── LIVREE → Stock: ✅ en livraison -1
   ├── REFUSEE → Stock: ❌ Aucun changement
   └── ANNULEE_LIVRAISON → Stock: ❌ Aucun changement

6. GESTIONNAIRE DE STOCK confirme RETOUR ⚡
   └── TourneeStock.colisRetourConfirme = true
       └── Stock: ✅ en livraison -X, disponible +X
```

---

## 📊 BASE DE DONNÉES - TABLES PRINCIPALES

### **Order** (Commandes)
```sql
- id, orderReference, clientNom, clientTelephone, clientVille
- produitNom, productId, quantite, montant
- status (OrderStatus)
- deliveryType (LOCAL, EXPEDITION, EXPRESS)
- callerId, delivererId, nombreAppels
```

### **Product** (Produits)
```sql
- id, code, nom, prixUnitaire
- stockActuel          ← Stock disponible
- stockExpress         ← Stock réservé EXPRESS (10% payé)
- stockLocalReserve    ← Stock en livraison (avec livreurs)
- stockAlerte          ← Seuil d'alerte
```

### **TourneeStock** (Gestion Remise/Retour) ⭐
```sql
- id, deliveryListId
- colisRemis, colisRemisConfirme ⚡      ← Moment clé 1
- colisRetour, colisRetourConfirme ⚡    ← Moment clé 2
- ecart, ecartMotif
```

### **StockMovement** (Historique)
```sql
- id, productId, type (StockMovementType)
- quantite, stockAvant, stockApres
- orderId, tourneeId, effectuePar, motif
```

---

## 🛣️ ROUTES API CRITIQUES

### **⚡ Les 2 routes les plus importantes**

```javascript
// 1. Confirmation de REMISE (déplace le stock)
POST /api/stock/tournees/:id/confirm-remise
Fichier: routes/stock.routes.js (ligne 207)
Action: stockActuel → stockLocalReserve

// 2. Confirmation de RETOUR (retourne le stock)
POST /api/stock/tournees/:id/confirm-retour
Fichier: routes/stock.routes.js (ligne 313)
Action: stockLocalReserve → stockActuel
```

### **Autres routes importantes**

```javascript
// Changement de statut (diminue stock si LIVREE)
PUT /api/orders/:id/status
Fichier: routes/order.routes.js (ligne 219)

// Notification (incrémente compteur)
POST /api/orders/:id/marquer-appel
Fichier: routes/order.routes.js (ligne 181)

// Analyse du stock en livraison
GET /api/stock-analysis/local-reserve
Fichier: routes/stock.analysis.routes.js (ligne 11)
```

---

## 🎨 PAGES CLÉS DU FRONTEND

### **⭐ Page la plus critique**
```
frontend/src/pages/stock/Tournees.tsx
└── Confirmation REMIS et RETOUR
    └── C'est ICI que le stock se déplace !
```

### **Autres pages importantes**
```
frontend/src/pages/appelant/Orders.tsx
└── Bouton "Notifier" (badge nombreAppels)

frontend/src/pages/stock/LiveraisonEnCours.tsx
└── Suivi en temps réel du stock chez les livreurs

frontend/src/pages/stock/Products.tsx
└── Gestion des produits et visualisation du stock
```

---

## 🚨 ERREURS À NE JAMAIS FAIRE

### **❌ Erreur 1 : Déplacer le stock lors de l'assignation**
```javascript
// ❌ MAUVAIS
router.post('/assign', async (req, res) => {
  await assignOrders();
  await moveStock(); // NON ! Pas ici !
});
```

### **❌ Erreur 2 : Retourner le stock lors du changement de statut**
```javascript
// ❌ MAUVAIS
if (status === 'REFUSEE') {
  await returnStockToAvailable(); // NON !
}
```

### **✅ Correct : Utiliser les routes dédiées**
```javascript
// ✅ BON
POST /api/stock/tournees/:id/confirm-remise   ← Déplace le stock
POST /api/stock/tournees/:id/confirm-retour   ← Retourne le stock
```

---

## 📞 COMMENT RETROUVER TOUTE CETTE LOGIQUE

### **Lors de votre prochaine session, dites-moi simplement :**

```
"Lis ARCHITECTURE_ET_REGLES_METIER.md"
```

**Et je comprendrai immédiatement :**
- ✅ Tous les rôles et permissions
- ✅ Le flux complet des commandes
- ✅ Les 2 moments clés pour le stock (REMIS et RETOUR)
- ✅ Les routes API critiques
- ✅ La structure du code
- ✅ Les règles métier à respecter

---

## 🔍 GUIDE DE NAVIGATION RAPIDE

### **Je veux comprendre...**

| **Sujet** | **Fichier à lire** |
|-----------|-------------------|
| Vue d'ensemble du projet | [README.md](./README.md) |
| **Règles de stock (CRITIQUE)** | **[ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)** |
| Stock en livraison | [STOCK_LOCAL_RESERVE_GUIDE.md](./STOCK_LOCAL_RESERVE_GUIDE.md) |
| Stock EXPRESS (10% + 90%) | [SCHEMA_STOCK_EXPRESS.md](./SCHEMA_STOCK_EXPRESS.md) |
| EXPÉDITIONS | [WORKFLOW_EXPEDITION_COMPLET.md](./WORKFLOW_EXPEDITION_COMPLET.md) |
| Commandes rapides | [GUIDE_DEMARRAGE_RAPIDE.md](./GUIDE_DEMARRAGE_RAPIDE.md) |
| Tests | [GUIDE_TEST_COMMANDES.md](./GUIDE_TEST_COMMANDES.md) |

---

## 💾 SAUVEGARDE ET GIT

### **Tout est déjà dans Git :**

```bash
# Voir tous les commits
git log --oneline

# Derniers commits importants :
# - 6fb08ae  SUPPRESSION: Bloc rouge ecarts et bouton Recalculer
# - b74e2a2  DOCUMENTATION COMPLETE: Architecture, regles metier et guides
# - 8c0e116  CORRECTION FINALE: Stock revient lors confirmation RETOUR
# - 0dfc3d8  CORRECTION: Stock se deplace lors confirmation REMIS
```

### **Repository GitHub :**
```
https://github.com/hermannnande/gs-pipeline-app.git
```

---

## 🎯 EN RÉSUMÉ

### **Les 3 fichiers à retenir absolument :**

1. **[INDEX_PROJET.md](./INDEX_PROJET.md)** ← Ce fichier (navigation)
2. **[ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md)** ← ⭐⭐⭐ LA BIBLE
3. **[GUIDE_DEMARRAGE_RAPIDE.md](./GUIDE_DEMARRAGE_RAPIDE.md)** ← Commandes pratiques

### **Les 2 routes API à ne JAMAIS toucher sans comprendre :**

1. `POST /api/stock/tournees/:id/confirm-remise` (ligne 207 de routes/stock.routes.js)
2. `POST /api/stock/tournees/:id/confirm-retour` (ligne 313 de routes/stock.routes.js)

### **Les 2 moments clés de la gestion de stock :**

1. **REMIS** : Gestionnaire Stock confirme → Stock se déplace
2. **RETOUR** : Gestionnaire Stock confirme → Stock revient

---

## 📚 HISTORIQUE DES MODIFICATIONS MAJEURES

- **16 déc 2025** : Système de notification (bouton "Notifier")
- **16 déc 2025** : Correction finale stock (REMIS et RETOUR)
- **16 déc 2025** : Documentation complète créée
- **16 déc 2025** : Suppression bloc rouge d'écarts (trompeur)
- **Avant** : Mise en place système de stock complet

---

## 🎉 VOTRE PROJET EST MAINTENANT PARFAITEMENT DOCUMENTÉ

✅ **Toute la logique est sauvegardée**
✅ **Documentation complète et structurée**
✅ **Exemples de code et flux détaillés**
✅ **Guide de débogage et bonnes pratiques**
✅ **Historique des modifications**

**Vous ne perdrez JAMAIS la logique du projet ! 🚀**

---

**Dernière mise à jour : 16 décembre 2025**
**Projet : GS Pipeline - Gestion de commandes e-commerce**
**Tech Stack : Node.js + Express + Prisma + PostgreSQL + React + TypeScript**

