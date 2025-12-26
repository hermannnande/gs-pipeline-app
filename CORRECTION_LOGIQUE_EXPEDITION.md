# ✅ CORRECTION LOGIQUE EXPEDITION - 26 Décembre 2025

## 🎯 **PROBLÈME INITIAL**

Le stock en livraison (`stockLocalReserve`) était **négatif (-50)** pour "Gaine Tourmaline Chauffante".

---

## 🔍 **CAUSE RACINE**

**Double logique de déplacement de stock pour les commandes LOCAL** :

1. ❌ **Ancienne logique** (routes/order.routes.js ligne 288-322) : 
   - Stock se déplaçait lors de l'**assignation** (ASSIGNEE)
   
2. ✅ **Nouvelle logique** (routes/stock.routes.js ligne 207) :
   - Stock se déplace lors de la **confirmation REMISE**

**Conflit** : Ces deux logiques coexistaient et créaient des stocks négatifs !

---

## 🔧 **CORRECTIONS APPLIQUÉES**

### **Correction 1 : Suppression de la double logique LOCAL** ✅

**Fichier** : `routes/order.routes.js` (lignes 286-322)

**Avant** :
```javascript
// ⚡ NOUVEAU : Quand une commande passe à ASSIGNEE (assignée à livreur)
// → Déplacer le stock de stockActuel vers stockLocalReserve
if (status === 'ASSIGNEE' && order.status !== 'ASSIGNEE' && order.productId && order.deliveryType === 'LOCAL') {
  // ... déplacer le stock ...
}
```

**Après** :
```javascript
// ⚠️ STOCK : Le stock NE se déplace PAS lors de l'assignation
// Le stock se déplacera UNIQUEMENT lors de la confirmation de REMISE
// par le gestionnaire de stock (voir routes/stock.routes.js ligne 207)
```

---

### **Correction 2 : Inclure EXPEDITION dans la REMISE** ✅

**Fichier** : `routes/stock.routes.js` (lignes 256-295)

**Besoin** : Les EXPEDITION doivent passer par la REMISE pour la **traçabilité** mais **sans déplacer le stock** (déjà réduit lors de la création).

**Avant** :
```javascript
if (order.productId && order.deliveryType === 'LOCAL' && order.product) {
  // ... déplacer le stock ...
}
```

**Après** :
```javascript
// ✅ Inclure LOCAL et EXPEDITION pour la REMISE
if (order.productId && order.product) {
  
  // 📦 LOCAL : Déplacer le stock vers stockLocalReserve
  if (order.deliveryType === 'LOCAL') {
    // ... déplacer le stock ...
  }
  
  // 📮 EXPEDITION : Pas de déplacement de stock (déjà réduit lors de la création)
  // La REMISE sert uniquement à la traçabilité
  else if (order.deliveryType === 'EXPEDITION') {
    // Créer un mouvement de traçabilité sans modifier le stock
    // quantite: 0 (pas de changement)
  }
}
```

---

### **Correction 3 : Livreur voit les EXPEDITION après REMISE** ✅

**Fichier** : `routes/delivery.routes.js` (lignes 203-215)

**Besoin** : Le livreur doit voir les EXPEDITION après que le gestionnaire de stock ait confirmé la REMISE.

**Avant** :
```javascript
// Exclure les EXPEDITION (elles ont leur propre section dans le dashboard)
if (order.deliveryType === 'EXPEDITION') return false;
```

**Après** :
```javascript
// ✅ INCLURE les EXPEDITION (le livreur doit les voir après REMISE confirmée)
// Les EXPEDITION passent par le système de REMISE pour la traçabilité
// Pas de RETOUR car le client a déjà payé 100%
```

---

### **Correction 4 : Empêcher double réduction stock EXPEDITION** ✅

**Fichier** : `routes/order.routes.js` (lignes 296-342)

**Problème** : Quand une EXPEDITION passait à LIVREE, le code essayait de réduire le stock **une 2ème fois**.

**Avant** :
```javascript
if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
  // ... réduire stockLocalReserve ...
} else {
  // Réduire stockActuel (comportement par défaut)
  // ❌ PROBLÈME : Ça incluait les EXPEDITION !
}
```

**Après** :
```javascript
if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
  // ... réduire stockLocalReserve ...
} 
// 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
else if (order.deliveryType === 'EXPEDITION') {
  // ✅ Pas de réduction de stock
}
else if (order.deliveryType !== 'EXPRESS') {
  // Autres types seulement
}
```

---

## 📊 **LOGIQUE FINALE DES 3 TYPES**

### **🚚 TYPE 1 : LOCAL**

```
1. Création → Stock : ❌ Aucun changement
2. Validation → Stock : ❌ Aucun changement
3. Assignation → Stock : ❌ Aucun changement
4. REMISE confirmée → Stock : ✅ stockActuel -X, stockLocalReserve +X
5. Livraison → Stock : ✅ stockLocalReserve -X
6. RETOUR confirmé → Stock : ✅ stockLocalReserve -X, stockActuel +X
```

**Caractéristiques** :
- Stock se déplace lors de la **REMISE**
- Stock diminue lors de la **LIVRAISON**
- Stock revient lors du **RETOUR**

---

### **📮 TYPE 2 : EXPEDITION**

```
1. Création (paiement 100%) → Stock : ✅ stockActuel -X immédiatement
2. Assignation livreur → Stock : ❌ Aucun changement (déjà réduit)
3. REMISE confirmée → Stock : ❌ Aucun changement (traçabilité seulement)
4. Livraison/Expédition → Stock : ❌ Aucun changement (déjà réduit)
5. RETOUR → ❌ N'existe PAS (client a payé 100%)
```

**Caractéristiques** :
- ✅ Client paie 100% Mobile Money → Stock réduit **immédiatement**
- ✅ Passe par la **REMISE** pour traçabilité (qui remet quoi à qui)
- ❌ **PAS de RETOUR** (client a déjà payé, pas de refus possible)
- ✅ Livreur voit l'EXPEDITION après REMISE confirmée

---

### **⚡ TYPE 3 : EXPRESS**

```
1. Création (paiement 10%) → Stock : ✅ stockActuel -X, stockExpress +X
2. Arrivée en agence → Stock : ❌ Aucun changement (reste en stockExpress)
3. Notification client → Stock : ❌ Aucun changement
4. Retrait final (paiement 90%) → Stock : ✅ stockExpress -X
```

**Caractéristiques** :
- Stock se déplace vers `stockExpress` lors de la création
- Stock reste réservé jusqu'au retrait
- Stock diminue lors du paiement final

---

## 🔄 **WORKFLOW EXPEDITION COMPLET**

### **Étape 1 : Appelant crée EXPEDITION**

**Prérequis** : Client a payé 100% par Mobile Money

**Actions** :
1. Appelant va dans une commande (NOUVELLE ou À_APPELER)
2. Clique sur "Créer EXPÉDITION"
3. Saisit :
   - Montant payé : **100% du total**
   - Mode paiement : Mobile Money
   - Référence paiement : Code de transaction
4. Valide

**Résultat** :
- ✅ Statut : `EXPEDITION`
- ✅ Stock : `stockActuel` diminue **immédiatement**
- ✅ Mouvement créé : `RESERVATION` (quantité -X)

---

### **Étape 2 : Gestionnaire assigne un livreur**

**Route spécifique** : `POST /api/orders/:id/expedition/assign`

**Actions** :
1. Gestionnaire va dans "Expéditions & EXPRESS"
2. Sélectionne l'EXPEDITION
3. Clique "Assigner livreur"
4. Choisit le livreur

**Résultat** :
- ✅ Statut : `ASSIGNEE`
- ✅ DeliveryList créée
- ❌ Stock : Aucun changement (déjà réduit)

---

### **Étape 3 : Gestionnaire Stock confirme REMISE**

**Page** : "Tournées" > Bouton "Confirmer la remise"

**Actions** :
1. Gestionnaire de Stock voit la tournée
2. Prépare le colis (stock normal déjà réduit)
3. Remet le colis au livreur
4. Clique "Confirmer la remise"
5. Saisit le nombre de colis remis

**Résultat** :
- ✅ `TourneeStock.colisRemisConfirme = true`
- ✅ Mouvement créé : `RESERVATION` (quantité 0, traçabilité uniquement)
- ❌ Stock : **Aucun changement** (déjà réduit à l'étape 1)

---

### **Étape 4 : Livreur voit et confirme**

**Après REMISE confirmée** :
- ✅ Le livreur **voit** l'EXPEDITION dans "Mes livraisons"
- ✅ Il peut cliquer "Traiter la livraison"
- ✅ Il saisit le code d'expédition (obligatoire)
- ✅ Il peut ajouter une photo du reçu (facultatif)

**Résultat** :
- ✅ Statut : `LIVREE`
- ✅ Code d'expédition enregistré
- ❌ Stock : **Aucun changement** (déjà réduit à l'étape 1)

---

### **Étape 5 : PAS de RETOUR**

**Important** : Les EXPEDITION **ne passent JAMAIS** par la confirmation de RETOUR car :
- ✅ Client a déjà payé 100%
- ✅ Pas de refus possible
- ✅ Colis déjà expédié

---

## ✅ **ROUTES MODIFIÉES**

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| `routes/order.routes.js` | 286-322 | Suppression double logique LOCAL |
| `routes/order.routes.js` | 296-342 | Empêcher double réduction EXPEDITION |
| `routes/stock.routes.js` | 256-295 | Inclure EXPEDITION dans REMISE (sans déplacer stock) |
| `routes/delivery.routes.js` | 203-215 | Livreur voit EXPEDITION après REMISE |

---

## 🚨 **CE QUI RESTE À FAIRE**

### **1. Corriger le stock négatif actuel** ⚠️

**Produit** : Gaine Tourmaline Chauffante

**Problème** : `stockLocalReserve = -50`

**Solution** : Ajustement manuel via interface Admin

```
1. Connexion Admin
2. "Produits" > "Gaine Tourmaline Chauffante"
3. "Ajuster le stock"
4. Type : Correction
5. Quantité : +50
6. Motif : "Correction double logique - Stock négatif corrigé"
7. Valider
```

---

### **2. Redémarrer le backend** 🔄

```bash
npm run dev
```

---

### **3. Tester le nouveau workflow** ✅

**Test LOCAL** :
1. Créer commande LOCAL
2. Valider
3. Assigner au livreur
4. **Gestionnaire Stock** : Confirmer REMISE → Stock doit se déplacer
5. Livreur : Marquer LIVREE → Stock en livraison doit diminuer
6. **Gestionnaire Stock** : Confirmer RETOUR → Stock doit revenir

**Test EXPEDITION** :
1. Créer EXPÉDITION (paiement 100%)
2. **Vérifier** : Stock diminue immédiatement
3. Assigner au livreur (route spécifique)
4. **Gestionnaire Stock** : Confirmer REMISE (traçabilité)
5. **Vérifier** : Stock ne bouge pas (déjà réduit)
6. Livreur voit l'EXPEDITION
7. Livreur confirme avec code d'expédition
8. **Vérifier** : Stock ne bouge toujours pas

---

## 📚 **DOCUMENTATION MISE À JOUR**

Pensez à mettre à jour ces fichiers :
- ✅ `ARCHITECTURE_ET_REGLES_METIER.md` - Ajouter section EXPEDITION
- ✅ `WORKFLOW_EXPEDITION_COMPLET.md` - Mettre à jour avec nouvelle logique
- ✅ `GUIDE_GESTIONNAIRE_STOCK_EXPEDITIONS.md` - Clarifier REMISE EXPEDITION

---

## 🎉 **RÉSULTAT FINAL**

### **Avant** ❌
```
Stock disponible    : 77
Stock EXPRESS       : 10
Stock en livraison  : -50  ← NÉGATIF !
Stock total         : 37
```

### **Après correction manuelle** ✅
```
Stock disponible    : 77
Stock EXPRESS       : 10
Stock en livraison  : 0    ← CORRIGÉ
Stock total         : 87
```

---

## ✅ **AVANTAGES DE LA NOUVELLE LOGIQUE**

1. ✅ **Plus de stock négatif** - Une seule logique de déplacement pour LOCAL
2. ✅ **EXPEDITION traçable** - Passe par REMISE pour savoir qui a remis quoi
3. ✅ **EXPEDITION visible** - Livreur voit les EXPEDITION après REMISE
4. ✅ **Pas de double réduction** - Stock EXPEDITION réduit qu'une seule fois
5. ✅ **Logique cohérente** - Chaque type a son propre workflow clair

---

**Date de correction** : 26 Décembre 2025  
**Version** : 1.0  
**Status** : ✅ Correction appliquée - En attente de test

