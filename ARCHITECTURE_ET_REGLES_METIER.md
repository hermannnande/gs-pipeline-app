# 📚 ARCHITECTURE ET RÈGLES MÉTIER - PIPELINE GS

> **Document de référence pour comprendre toute la logique du système**
> Dernière mise à jour : 16 décembre 2025

---

## 🎯 OBJECTIF DU SYSTÈME

Application de gestion de pipeline de commandes e-commerce avec :
- Gestion des appels clients
- Gestion des livraisons locales et inter-villes
- Gestion de stock en temps réel
- Suivi des tournées de livraison

---

## 👥 RÔLES ET PERMISSIONS

### **1. ADMIN**
- Accès total au système
- Gestion des utilisateurs
- Accès à toutes les statistiques

### **2. GESTIONNAIRE (Gestionnaire Principal)**
- Gère le pipeline des commandes validées
- Assigne les commandes aux livreurs
- Crée les tournées de livraison
- Suit les livraisons en cours

### **3. GESTIONNAIRE_STOCK (Gestionnaire de Stock)**
- Prépare et remet les colis aux livreurs
- **Confirme la REMISE des colis** (moment clé pour le stock)
- Récupère les colis non livrés
- **Confirme le RETOUR des colis** (moment clé pour le stock)
- Contrôle les écarts
- Gère l'inventaire des produits

### **4. APPELANT**
- Appelle les clients
- Valide ou annule les commandes
- Gère les rendez-vous de rappel
- Notifie les clients (badge de notification)

### **5. LIVREUR**
- Voit ses tournées assignées
- Marque les livraisons (LIVREE, REFUSEE, ANNULEE_LIVRAISON, RETOURNE)
- Saisit les codes d'expédition (pour EXPEDITION)

---

## 🔄 FLUX COMPLET D'UNE COMMANDE LOCALE

### **ÉTAPE 1 : Réception de la commande**
```
Source : Site web (webhook) ou création manuelle
Statut : NOUVELLE
Stock impacté : ❌ AUCUN
```

### **ÉTAPE 2 : Appelant contacte le client**
```
Action : Appelant appelle le client
Options : 
  - Client valide → VALIDEE
  - Client annule → ANNULEE
  - Client injoignable → INJOIGNABLE
  - Programmer un RDV → rdvProgramme = true
Stock impacté : ❌ AUCUN
```

### **ÉTAPE 3 : Gestionnaire assigne à un livreur**
```
Action : Gestionnaire crée une tournée et assigne les commandes
Statut : ASSIGNEE
Stock impacté : ❌ AUCUN (PAS ENCORE !)
```

### **ÉTAPE 4 : Gestionnaire de Stock confirme REMISE** ⚡
```
Action : Gestionnaire de Stock clique "Confirmer la remise"
Saisit : Nombre de colis remis (ex: 7 colis)
Base de données : TourneeStock.colisRemisConfirme = true

⚡ MOMENT CLÉ POUR LE STOCK :
- Stock disponible (stockActuel) DIMINUE de 7
- Stock en livraison (stockLocalReserve) AUGMENTE de 7
- Mouvement créé : RESERVATION_LOCAL

Route API : POST /api/stock/tournees/:id/confirm-remise
Fichier : routes/stock.routes.js (ligne 207)
```

### **ÉTAPE 5 : Livreur livre les commandes**
```
Action : Livreur marque chaque commande
Options :
  - LIVREE → Stock en livraison DIMINUE de 1
  - REFUSEE → Stock ne change PAS
  - ANNULEE_LIVRAISON → Stock ne change PAS
  - RETOURNE → Stock ne change PAS

⚡ IMPORTANT : Seul le statut LIVREE impacte le stock
- Stock en livraison (stockLocalReserve) DIMINUE
- Mouvement créé : LIVRAISON_LOCAL

Route API : PUT /api/orders/:id/status
Fichier : routes/order.routes.js (ligne 219)
```

### **ÉTAPE 6 : Gestionnaire de Stock confirme RETOUR** ⚡
```
Action : Gestionnaire de Stock clique "Confirmer le retour"
Saisit : Nombre de colis retournés (ex: 2 colis)
Base de données : TourneeStock.colisRetourConfirme = true

⚡ MOMENT CLÉ POUR LE STOCK :
- Stock en livraison (stockLocalReserve) DIMINUE de 2
- Stock disponible (stockActuel) AUGMENTE de 2
- Mouvement créé : RETOUR_LOCAL
- Statut des commandes → RETOURNE

Route API : POST /api/stock/tournees/:id/confirm-retour
Fichier : routes/stock.routes.js (ligne 313)
```

---

## 📦 GESTION DE STOCK - RÈGLES CRITIQUES

### **3 Types de stock par produit**

```
┌─────────────────────────────────────┐
│  PRODUIT : Gaine Tourmaline         │
├─────────────────────────────────────┤
│  stockActuel        : 50            │  ← Stock disponible
│  stockExpress       : 5             │  ← Stock réservé EXPRESS (10% payé)
│  stockLocalReserve  : 12            │  ← Stock en livraison (chez livreurs)
└─────────────────────────────────────┘
```

### **Quand le stock bouge**

| **Action** | **stockActuel** | **stockLocalReserve** | **Mouvement** |
|------------|-----------------|----------------------|---------------|
| Gestionnaire assigne | ❌ | ❌ | Aucun |
| **Gestionnaire Stock → Remis** | **-X** | **+X** | **RESERVATION_LOCAL** |
| Livreur → LIVREE | ❌ | -1 | LIVRAISON_LOCAL |
| Livreur → REFUSEE | ❌ | ❌ | Aucun |
| Livreur → ANNULEE | ❌ | ❌ | Aucun |
| **Gestionnaire Stock → Retour** | **+X** | **-X** | **RETOUR_LOCAL** |

### **⚠️ RÈGLES ABSOLUES**

1. ✅ **Le stock NE bouge PAS lors de l'assignation par le gestionnaire**
2. ✅ **Le stock se déplace lors de la confirmation de REMISE par le gestionnaire de stock**
3. ✅ **Seul le statut LIVREE fait diminuer le stock en livraison**
4. ✅ **Les statuts REFUSEE/ANNULEE ne touchent PAS au stock** (le stock reste chez le livreur)
5. ✅ **Le stock revient lors de la confirmation de RETOUR par le gestionnaire de stock**

---

## 🚚 EXPÉDITION ET EXPRESS

### **Types de livraison (DeliveryType)**

- **LOCAL** : Livraison locale classique avec livreurs
- **EXPEDITION** : Paiement 100% avant envoi vers autre ville
- **EXPRESS** : Paiement 10% avant envoi, 90% à la réception en agence

### **EXPEDITION (100% payé)**

```
1. Appelant crée EXPEDITION → Stock disponible DIMINUE immédiatement
2. Gestionnaire assigne à un livreur
3. Livreur saisit code d'expédition et confirme → LIVREE
   Stock impacté : ❌ AUCUN (déjà réduit à l'étape 1)
```

### **EXPRESS (10% + 90%)**

```
1. Appelant crée EXPRESS → Stock disponible DIMINUE, Stock EXPRESS AUGMENTE
2. Colis arrive en agence → EXPRESS_ARRIVE
3. Appelant notifie le client (badge de notification)
4. Client vient payer 90% et retire → EXPRESS_LIVRE
   Stock EXPRESS DIMINUE
```

---

## 🔔 SYSTÈME DE NOTIFICATION (Page "À appeler")

### **Bouton "Notifier"**

- Appelant clique "🔔 Notifier" sur une commande
- Compteur `nombreAppels` s'incrémente
- Badge orange apparaît : "🔔 2 notifications · Jean"
- **Ne change PAS le statut de la commande**
- Permet aux autres appelants de voir qu'un collègue a déjà contacté le client

```
Route API : POST /api/orders/:id/marquer-appel
Fichier : routes/order.routes.js (ligne 181)
```

---

## 📊 BASE DE DONNÉES - TABLES PRINCIPALES

### **Order (Commandes)**
```prisma
model Order {
  id              Int
  orderReference  String @unique
  clientNom       String
  clientTelephone String
  clientVille     String
  produitNom      String
  productId       Int?         // Lien vers Product
  quantite        Int
  montant         Float
  deliveryType    DeliveryType @default(LOCAL)
  status          OrderStatus
  callerId        Int?
  delivererId     Int?
  nombreAppels    Int @default(0)  // Compteur de notifications
  // ... autres champs
}
```

### **Product (Produits)**
```prisma
model Product {
  id                Int
  code              String @unique
  nom               String
  prixUnitaire      Float
  stockActuel       Int @default(0)        // Stock disponible
  stockExpress      Int @default(0)        // Stock réservé EXPRESS
  stockLocalReserve Int @default(0)        // Stock en livraison
  stockAlerte       Int @default(10)       // Seuil d'alerte
}
```

### **TourneeStock (Gestion des remises/retours)**
```prisma
model TourneeStock {
  id                    Int
  deliveryListId        Int @unique
  colisRemis            Int @default(0)
  colisRemisConfirme    Boolean @default(false)   // ⚡ Moment clé 1
  colisRemisAt          DateTime?
  colisRemisBy          Int?
  colisLivres           Int @default(0)
  colisRetour           Int @default(0)
  colisRetourConfirme   Boolean @default(false)   // ⚡ Moment clé 2
  colisRetourAt         DateTime?
  colisRetourBy         Int?
  ecart                 Int @default(0)           // colisRemis - (colisLivres + colisRetour)
}
```

### **StockMovement (Historique des mouvements)**
```prisma
model StockMovement {
  id          Int
  productId   Int
  type        StockMovementType
  quantite    Int                  // Positif pour entrée, négatif pour sortie
  stockAvant  Int
  stockApres  Int
  orderId     Int?
  tourneeId   Int?
  effectuePar Int
  motif       String?
  createdAt   DateTime
}
```

---

## 🛣️ ROUTES API CRITIQUES

### **Stock - Confirmation Remise**
```javascript
POST /api/stock/tournees/:id/confirm-remise
Fichier : routes/stock.routes.js (ligne 207)
Paramètres : { colisRemis: number }
Action : Déplace le stock de stockActuel vers stockLocalReserve
```

### **Stock - Confirmation Retour**
```javascript
POST /api/stock/tournees/:id/confirm-retour
Fichier : routes/stock.routes.js (ligne 313)
Paramètres : { colisRetour: number, ecartMotif?, raisonsRetour? }
Action : Retourne le stock de stockLocalReserve vers stockActuel
```

### **Order - Changement de statut**
```javascript
PUT /api/orders/:id/status
Fichier : routes/order.routes.js (ligne 219)
Paramètres : { status: OrderStatus, note?, raisonRetour? }
Action : Change le statut, diminue stockLocalReserve si LIVREE
```

### **Order - Marquer appelé (Notification)**
```javascript
POST /api/orders/:id/marquer-appel
Fichier : routes/order.routes.js (ligne 181)
Action : Incrémente nombreAppels, met à jour callerId et calledAt
```

---

## 🎨 FRONTEND - PAGES PRINCIPALES

### **Appelant**
- `/appelant/orders` - Commandes à appeler avec bouton "Notifier"
- Boutons : 🔔 Notifier | 📞 Traiter | 📅 RDV

### **Gestionnaire**
- `/gestionnaire/orders` - Commandes validées
- `/gestionnaire/delivery` - Création et gestion des tournées

### **Gestionnaire de Stock**
- `/stock/overview` - Dashboard stock
- `/stock/products` - Gestion des produits
- `/stock/tournees` - **Confirmation Remise/Retour** (⚡ CRITIQUE)
- `/stock/movements` - Historique des mouvements

### **Livreur**
- `/livreur/overview` - Mes tournées
- Action : Marquer LIVREE/REFUSEE/ANNULEE_LIVRAISON/RETOURNE

---

## 🔍 DÉBOGAGE - COMMENT VÉRIFIER LE STOCK

### **1. Vérifier le stock d'un produit**
```sql
SELECT id, nom, stockActuel, stockLocalReserve, stockExpress 
FROM products 
WHERE nom LIKE '%Gaine%';
```

### **2. Voir l'historique des mouvements**
```sql
SELECT * FROM stock_movements 
WHERE productId = 1 
ORDER BY createdAt DESC 
LIMIT 20;
```

### **3. Vérifier les commandes d'une tournée**
```sql
SELECT o.id, o.orderReference, o.status, o.quantite, p.nom
FROM orders o
LEFT JOIN products p ON o.productId = p.id
WHERE o.deliveryListId = 123;
```

### **4. Voir l'état d'une tournée**
```sql
SELECT * FROM tournees_stock WHERE deliveryListId = 123;
```

---

## 📝 EXEMPLE COMPLET DE FLUX

```
SCÉNARIO : 7 commandes de "Gaine Tourmaline Chauffante"

ÉTAPE 0 : État initial
Stock disponible : 50
Stock en livraison: 0

ÉTAPE 1 : Gestionnaire assigne 7 commandes à Hassan
Stock disponible : 50 ✅ (pas de changement)
Stock en livraison: 0 ✅ (pas de changement)

ÉTAPE 2 : Gestionnaire Stock clique "Remis" (7 colis)
Stock disponible : 43 ✅ (50 - 7)
Stock en livraison: 7 ✅ (0 + 7)
Mouvement : RESERVATION_LOCAL × 7

ÉTAPE 3 : Hassan livre 5 commandes
Stock disponible : 43 ✅ (reste 43)
Stock en livraison: 2 ✅ (7 - 5)
Mouvement : LIVRAISON_LOCAL × 5

ÉTAPE 4 : Hassan marque 2 commandes REFUSEE
Stock disponible : 43 ✅ (pas de changement)
Stock en livraison: 2 ✅ (pas de changement)
Mouvement : Aucun

ÉTAPE 5 : Gestionnaire Stock clique "Retour" (2 colis)
Stock disponible : 45 ✅ (43 + 2)
Stock en livraison: 0 ✅ (2 - 2)
Mouvement : RETOUR_LOCAL × 2

RÉSULTAT FINAL :
Stock disponible : 45 ✅ (50 initial - 5 livrées)
Stock en livraison: 0 ✅
```

---

## 🚨 ERREURS COURANTES À ÉVITER

### ❌ **Erreur 1 : Déplacer le stock lors de l'assignation**
```javascript
// ❌ MAUVAIS
router.post('/assign', async (req, res) => {
  // Assigner les commandes
  await assignOrders();
  // Déplacer le stock ← NON !
  await moveStock();
});
```

### ✅ **Correct : Déplacer lors de la confirmation de remise**
```javascript
// ✅ BON
router.post('/tournees/:id/confirm-remise', async (req, res) => {
  // Confirmer la remise
  await confirmRemise();
  // Déplacer le stock ← OUI !
  await moveStockToReserve();
});
```

### ❌ **Erreur 2 : Retourner le stock lors du changement de statut**
```javascript
// ❌ MAUVAIS
if (status === 'REFUSEE') {
  await returnStockToAvailable(); // NON !
}
```

### ✅ **Correct : Retourner lors de la confirmation de retour**
```javascript
// ✅ BON
router.post('/tournees/:id/confirm-retour', async (req, res) => {
  // Pour chaque commande NON LIVREE
  await returnStockFromReserve();
});
```

---

## 📞 CONTACT ET SUPPORT

- **Projet** : GS Pipeline App
- **Tech Stack** : Node.js + Express + Prisma + PostgreSQL + React + TypeScript
- **Déploiement** : Railway (backend) + Vercel (frontend)
- **Base de données** : PostgreSQL sur Railway

---

## 🔄 HISTORIQUE DES MODIFICATIONS

### **16 Décembre 2025**
- ✅ Correction finale : Stock se déplace lors de la confirmation REMIS (pas lors de l'assignation)
- ✅ Correction finale : Stock revient lors de la confirmation RETOUR (pas lors du changement de statut)
- ✅ Ajout du système de notification avec bouton "Notifier" sur la page "À appeler"

---

**📌 CE DOCUMENT EST LA RÉFÉRENCE ABSOLUE POUR COMPRENDRE LE SYSTÈME**

Lors de vos prochaines sessions, référez-vous à ce document pour :
- Comprendre les règles métier
- Vérifier les flux critiques
- Déboguer les problèmes de stock
- Ajouter de nouvelles fonctionnalités sans casser la logique existante

