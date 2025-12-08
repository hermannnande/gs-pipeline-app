# 🔐 PERMISSIONS DU GESTIONNAIRE DE STOCK

## 🎯 VUE D'ENSEMBLE

Le **Gestionnaire de Stock** (`GESTIONNAIRE_STOCK`) a des permissions **limitées** et **spécialisées** pour la gestion du stock uniquement. Il ne peut **PAS** gérer les produits eux-mêmes.

---

## ✅ CE QUE LE GESTIONNAIRE DE STOCK PEUT FAIRE

### **1️⃣ Voir les Produits** 👁️

| Permission | Accès |
|-----------|-------|
| Voir la liste des produits | ✅ Oui |
| Voir les détails d'un produit | ✅ Oui |
| Voir le stock disponible | ✅ Oui |
| Voir le stock EXPRESS réservé | ✅ Oui |
| Voir le stock total (physique) | ✅ Oui |
| Voir le seuil d'alerte | ✅ Oui |
| Rechercher un produit | ✅ Oui |

---

### **2️⃣ Ajuster le Stock** 📊

| Permission | Accès |
|-----------|-------|
| **Approvisionner** (ajouter du stock) | ✅ Oui |
| **Corriger** le stock (ajustement manuel) | ✅ Oui |
| **Déclarer une perte** de stock | ✅ Oui |
| Voir l'historique des mouvements | ✅ Oui |

**Interface** :

```
┌─────────────────────────────────────────────┐
│ Patch anti cicatrice                        │
├─────────────────────────────────────────────┤
│ Stock disponible: 93                        │
│ Stock EXPRESS: 2                            │
│ Stock total: 95                             │
│                                             │
│ [    📈 Ajuster le stock    ]               │ ← VISIBLE
│                                             │
│ (Pas de boutons Modifier/Supprimer)        │ ← MASQUÉS
└─────────────────────────────────────────────┘
```

---

### **3️⃣ Voir les Commandes** 📦

| Permission | Accès |
|-----------|-------|
| Voir toutes les commandes | ✅ Oui |
| Voir les expéditions & EXPRESS | ✅ Oui |
| Voir les détails des commandes | ✅ Oui |
| Filtrer et rechercher | ✅ Oui |

**Utilité** : Préparer les colis pour livraison et savoir quels produits sont en attente.

---

### **4️⃣ Voir l'Historique des Mouvements** 📜

| Permission | Accès |
|-----------|-------|
| Voir tous les mouvements de stock | ✅ Oui |
| Filtrer par type de mouvement | ✅ Oui |
| Filtrer par produit | ✅ Oui |
| Filtrer par période | ✅ Oui |

---

## ❌ CE QUE LE GESTIONNAIRE DE STOCK NE PEUT PAS FAIRE

### **1️⃣ Gérer les Produits** 🚫

| Permission | Accès |
|-----------|-------|
| **Ajouter** un nouveau produit | ❌ Non |
| **Modifier** les informations d'un produit | ❌ Non |
| **Supprimer** un produit | ❌ Non |

**Raison** : Seul l'**ADMIN** peut gérer le catalogue de produits.

---

### **2️⃣ Gérer les Utilisateurs** 🚫

| Permission | Accès |
|-----------|-------|
| Voir les utilisateurs | ✅ Oui (pour assigner livreurs) |
| Créer un utilisateur | ❌ Non |
| Modifier un utilisateur | ❌ Non |
| Supprimer un utilisateur | ❌ Non |

---

### **3️⃣ Créer des Commandes** 🚫

| Permission | Accès |
|-----------|-------|
| Créer une commande | ❌ Non |
| Créer une EXPÉDITION | ❌ Non |
| Créer un EXPRESS | ❌ Non |
| Assigner un livreur | ❌ Non (voir seulement) |

**Raison** : Le Gestionnaire de Stock **prépare** les colis, il ne **crée** pas les commandes.

---

## 🎨 INTERFACE UTILISATEUR

### **Page "Gestion des Produits"**

#### **Pour ADMIN** 👑

```
┌─────────────────────────────────────────────────────────┐
│ Gestion des Produits                [➕ Ajouter un produit] │ ← Bouton VISIBLE
├─────────────────────────────────────────────────────────┤
│ [🔍 Rechercher...]                                      │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Patch anti cicatrice                                │ │
│ │ Stock: 93 | EXPRESS: 2 | Total: 95                 │ │
│ │                                                     │ │
│ │ [  📈 Ajuster le stock  ]                          │ │
│ │ [  ✏️ Modifier  ] [  🗑️ Supprimer  ]              │ │ ← Boutons VISIBLES
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

#### **Pour GESTIONNAIRE_STOCK** 📦

```
┌─────────────────────────────────────────────────────────┐
│ Gestion des Produits                                    │ ← PAS de bouton "Ajouter"
├─────────────────────────────────────────────────────────┤
│ [🔍 Rechercher...]                                      │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Patch anti cicatrice                                │ │
│ │ Stock: 93 | EXPRESS: 2 | Total: 95                 │ │
│ │                                                     │ │
│ │ [  📈 Ajuster le stock  ]                          │ │ ← Bouton VISIBLE
│ │                                                     │ │ ← PAS de boutons Modifier/Supprimer
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Différences clés** :
- ❌ **PAS** de bouton "➕ Ajouter un produit"
- ❌ **PAS** de boutons "✏️ Modifier" et "🗑️ Supprimer"
- ✅ **OUI** au bouton "📈 Ajuster le stock"

---

## 🔧 WORKFLOW DU GESTIONNAIRE DE STOCK

### **Cas d'usage 1 : Approvisionnement**

**Besoin** : Réceptionner une livraison de fournisseur.

**Actions** :
1. Va dans **"Produits"**
2. Trouve le produit (ex: "Patch anti cicatrice")
3. Clique **"📈 Ajuster le stock"**
4. **Type** : Approv isionnement
5. **Quantité** : +50
6. **Motif** : "Livraison fournisseur XYZ - Bon de commande #123"
7. Valide
8. ✅ Stock passe de 93 → 143

---

### **Cas d'usage 2 : Correction de stock**

**Besoin** : Erreur d'inventaire détectée.

**Actions** :
1. Va dans **"Produits"**
2. Trouve le produit
3. Clique **"📈 Ajuster le stock"**
4. **Type** : Correction
5. **Quantité** : -5 (si stock en trop) ou +5 (si stock manquant)
6. **Motif** : "Correction après inventaire physique"
7. Valide
8. ✅ Stock corrigé + mouvement enregistré

---

### **Cas d'usage 3 : Déclaration de perte**

**Besoin** : Produits endommagés/périmés.

**Actions** :
1. Va dans **"Produits"**
2. Trouve le produit
3. Clique **"📈 Ajuster le stock"**
4. **Type** : Perte
5. **Quantité** : -3
6. **Motif** : "Produits endommagés lors du transport"
7. Valide
8. ✅ Stock réduit + perte enregistrée

---

### **Cas d'usage 4 : Préparer les colis**

**Besoin** : Préparer les commandes du jour pour livraison.

**Actions** :
1. Va dans **"Expéditions & EXPRESS"** ou **"Tournées"**
2. Voit les commandes assignées
3. **Prépare** les colis selon les commandes
4. **Remet** les colis aux livreurs
5. ❌ **Ne peut PAS** marquer comme livré (c'est le livreur qui le fait)

---

## 📊 TABLEAU RÉCAPITULATIF DES PERMISSIONS

### **Gestion des Produits**

| Action | ADMIN | GESTIONNAIRE_STOCK |
|--------|-------|-------------------|
| Voir les produits | ✅ | ✅ |
| Rechercher | ✅ | ✅ |
| **Ajouter un produit** | ✅ | ❌ |
| **Modifier un produit** | ✅ | ❌ |
| **Supprimer un produit** | ✅ | ❌ |
| **Ajuster le stock** | ✅ | ✅ |

---

### **Gestion du Stock**

| Action | ADMIN | GESTIONNAIRE_STOCK |
|--------|-------|-------------------|
| Approvisionnement | ✅ | ✅ |
| Correction | ✅ | ✅ |
| Perte | ✅ | ✅ |
| Voir mouvements | ✅ | ✅ |

---

### **Autres Permissions**

| Fonctionnalité | ADMIN | GESTIONNAIRE_STOCK |
|----------------|-------|-------------------|
| Voir commandes | ✅ | ✅ |
| Créer commandes | ✅ | ❌ |
| Voir expéditions/EXPRESS | ✅ | ✅ |
| Créer expéditions/EXPRESS | ✅ | ❌ |
| Gérer utilisateurs | ✅ | ❌ |
| Voir base clients | ✅ | ✅ |

---

## 🚀 MODIFICATIONS TECHNIQUES

### **Backend** 📡

**Fichier** : `routes/product.routes.js`

#### **Avant** ❌

```javascript
// POST /api/products/:id/stock/adjust
router.post('/:id/stock/adjust', authorize('ADMIN'), [...]);
```

**Seul ADMIN** pouvait ajuster le stock.

---

#### **Maintenant** ✅

```javascript
// POST /api/products/:id/stock/adjust
router.post('/:id/stock/adjust', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), [...]);
```

**ADMIN + GESTIONNAIRE_STOCK** peuvent ajuster le stock.

---

### **Frontend** 🎨

**Fichier** : `frontend/src/pages/stock/Products.tsx`

#### **Modifications** :

1. **Import de `useAuthStore`** pour récupérer le rôle
2. **Variable `canManageProducts`** : `user?.role === 'ADMIN'`
3. **Masquage conditionnel** des boutons :
   - Bouton "Ajouter un produit" : `{canManageProducts && ...}`
   - Boutons "Modifier" et "Supprimer" : `{canManageProducts && ...}`

---

## 🧪 TESTER

### **Test 1 : Gestionnaire de Stock - Vue limitée**

1. Connectez-vous en tant que **Gestionnaire de Stock** (Karim)
2. Allez dans **"Produits"**
3. ✅ **Vérifiez** : **PAS** de bouton "➕ Ajouter un produit"
4. Regardez une carte de produit
5. ✅ **Vérifiez** : Bouton "📈 Ajuster le stock" **VISIBLE**
6. ✅ **Vérifiez** : Boutons "✏️ Modifier" et "🗑️ Supprimer" **MASQUÉS**

---

### **Test 2 : Gestionnaire de Stock - Ajuster le stock**

1. Connectez-vous en tant que **Gestionnaire de Stock**
2. Allez dans **"Produits"**
3. Cliquez **"📈 Ajuster le stock"** sur un produit
4. Remplissez :
   - Type : **Approvisionnement**
   - Quantité : **+20**
   - Motif : **"Test approvisionnement"**
5. Validez
6. ✅ **Vérifiez** : Stock augmenté de 20
7. ✅ **Vérifiez** : Mouvement créé dans l'historique

---

### **Test 3 : Admin - Vue complète**

1. Connectez-vous en tant qu'**Admin**
2. Allez dans **"Produits"**
3. ✅ **Vérifiez** : Bouton "➕ Ajouter un produit" **VISIBLE**
4. Regardez une carte de produit
5. ✅ **Vérifiez** : Bouton "📈 Ajuster le stock" **VISIBLE**
6. ✅ **Vérifiez** : Boutons "✏️ Modifier" et "🗑️ Supprimer" **VISIBLES**

---

## ✅ RÉSUMÉ

### **CE QUI A ÉTÉ FAIT** :

✅ **Backend** : GESTIONNAIRE_STOCK peut ajuster le stock (route `/products/:id/stock/adjust`)
✅ **Frontend** : Boutons "Ajouter", "Modifier", "Supprimer" **masqués** pour GESTIONNAIRE_STOCK
✅ **Frontend** : Bouton "Ajuster le stock" **visible** pour GESTIONNAIRE_STOCK
✅ **Sécurité** : Routes protégées - seul ADMIN peut créer/modifier/supprimer des produits

---

### **PERMISSIONS DU GESTIONNAIRE DE STOCK** :

✅ **Voir** tous les produits et leur stock
✅ **Ajuster** le stock (approvisionnement, correction, perte)
✅ **Voir** les commandes et expéditions (pour préparation)
✅ **Voir** l'historique des mouvements de stock
❌ **Ne peut PAS** ajouter/modifier/supprimer de produits
❌ **Ne peut PAS** créer de commandes
❌ **Ne peut PAS** gérer les utilisateurs

---

### **RÔLE DU GESTIONNAIRE DE STOCK** 📦

Le Gestionnaire de Stock est responsable de :
1. 📦 **Réceptionner** les livraisons fournisseurs
2. 📊 **Approvisionner** les produits
3. 🔍 **Vérifier** les inventaires
4. ✅ **Corriger** les écarts de stock
5. 📋 **Préparer** les colis pour livraison
6. 🚚 **Remettre** les colis aux livreurs

**Il ne gère PAS** :
- Le catalogue de produits (ajout/modification/suppression)
- La création de commandes
- L'assignation de livreurs
- La gestion des utilisateurs

---

**DANS 3-5 MINUTES, RAFRAÎCHISSEZ ET TESTEZ ! 🚀**

**Le Gestionnaire de Stock aura une interface simplifiée, axée sur la gestion du stock uniquement ! ✨**







