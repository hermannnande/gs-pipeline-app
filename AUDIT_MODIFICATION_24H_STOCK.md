# 🔍 AUDIT - MODIFICATION LIVRAISON DANS LES 24H ET MOUVEMENTS DE STOCK

**Date :** 26 Décembre 2025  
**Audité par :** Assistant IA  
**Demandé par :** Nande Hermann (ADMIN)

---

## 🎯 **OBJECTIF DE L'AUDIT**

Vérifier la logique de mouvement de stock lorsque :
1. Un livreur livre un colis (statut → LIVREE)
2. Le livreur se rend compte d'une erreur
3. Le livreur modifie la confirmation dans les 24 heures (LIVREE → REFUSEE/ANNULEE_LIVRAISON)

**Question critique :** Le stock est-il correctement géré lors de ces modifications ?

---

## 🔍 **ANALYSE DU CODE**

### **📂 Fichier analysé : `routes/order.routes.js`**

### **Ligne 219-411 : Route `PUT /api/orders/:id/status`**

Cette route gère TOUS les changements de statut, y compris les corrections dans les 24h.

---

## ✅ **LOGIQUE ACTUELLE - CAS 1 : LIVREE**

### **Scénario : Livreur marque une commande LIVREE**

```javascript
// Ligne 291-351
// RÈGLE MÉTIER 1 : Décrémenter le stock quand la commande passe à LIVRÉE
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({ where: { id: order.productId } });

  if (product) {
    // 📦 LOCAL : Si la commande était ASSIGNEE, réduire stockLocalReserve
    if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
      const stockLocalReserveAvant = product.stockLocalReserve;
      const stockLocalReserveApres = stockLocalReserveAvant - order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockLocalReserve: stockLocalReserveApres }
      });

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'LIVRAISON_LOCAL',
          quantite: -order.quantite,
          stockAvant: stockLocalReserveAvant,
          stockApres: stockLocalReserveApres,
          orderId: order.id,
          effectuePar: user.id,
          motif: `Livraison locale ${order.orderReference} - ${order.clientNom}`
        }
      });
    }
    // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
    else if (order.deliveryType === 'EXPEDITION') {
      // ✅ Pas de réduction de stock pour EXPEDITION
    }
    // ⚡ EXPRESS ou autres : comportement par défaut
    else if (order.deliveryType !== 'EXPRESS') {
      // Réduire stockActuel pour les cas non gérés spécifiquement
      // ...
    }
  }
}
```

### **✅ RÉSULTAT POUR LOCAL :**
```
Statut : ASSIGNEE → LIVREE
Stock avant : stockLocalReserve = 50
Action : stockLocalReserve - quantite
Stock après : stockLocalReserve = 45 (si quantite = 5)
Mouvement créé : LIVRAISON_LOCAL (-5)
```

**✅ CORRECT !** Le stock en livraison diminue quand le livreur confirme.

---

## ✅ **LOGIQUE ACTUELLE - CAS 2 : CORRECTION (LIVREE → REFUSEE/ANNULEE)**

### **Scénario : Livreur corrige son erreur dans les 24h**

```javascript
// Ligne 356-387
// RÈGLE MÉTIER 2 : Réincrémenter le stock si la commande était LIVRÉE 
// et change vers un autre statut
if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({ where: { id: order.productId } });

  if (product) {
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant + order.quantite; // RÉINCRÉMENTER

    // Mettre à jour le stock du produit
    await tx.product.update({
      where: { id: order.productId },
      data: { stockActuel: stockApres }
    });

    // Créer le mouvement de stock (RETOUR)
    await tx.stockMovement.create({
      data: {
        productId: order.productId,
        type: 'RETOUR',
        quantite: order.quantite, // Positif car on rajoute
        stockAvant,
        stockApres,
        orderId: order.id,
        effectuePar: user.id,
        motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
      }
    });
  }
}
```

### **🚨 PROBLÈME IDENTIFIÉ !**

#### **Pour une commande LOCAL :**

**Étape 1 : Livreur marque LIVREE**
```
Statut : ASSIGNEE → LIVREE
stockLocalReserve : 50 → 45 (-5)  ✅
stockActuel : 100 (pas changé)    ✅
```

**Étape 2 : Livreur corrige dans les 24h (LIVREE → REFUSEE)**
```
Statut : LIVREE → REFUSEE
❌ stockActuel : 100 → 105 (+5)  ← MAUVAIS STOCK !
✅ stockLocalReserve : 45 (pas changé)  ← DEVRAIT REVENIR À 50 !
```

**❌ ERREUR :** Le stock est remis dans `stockActuel` au lieu de `stockLocalReserve` !

---

## 🚨 **BUG CRITIQUE DÉTECTÉ**

### **Problème :**

Lors de la correction d'une livraison LOCAL (LIVREE → REFUSEE/ANNULEE) :
- Le stock est ajouté à `stockActuel` (magasin)
- Mais il devrait être ajouté à `stockLocalReserve` (en livraison)
- **Car le colis est toujours chez le livreur !**

### **Impact :**

1. **Stock magasin (`stockActuel`) augmenté à tort**
   - Le colis n'est pas revenu au magasin
   - Le stock magasin est faussé

2. **Stock en livraison (`stockLocalReserve`) pas restauré**
   - Le colis est toujours chez le livreur
   - Le stock en livraison devrait être recrémenté

3. **Incohérence totale**
   - Le stock total reste correct par hasard
   - Mais les compartiments sont faux

---

## 🔍 **ANALYSE PAR TYPE DE LIVRAISON**

### **1️⃣ LOCAL (Livraison locale)**

| Scénario | Statut initial | Statut final | Stock actuel | Stock en livraison | Correct ? |
|----------|---------------|--------------|--------------|-------------------|-----------|
| Livraison confirmée | ASSIGNEE | LIVREE | 100 | 50 → 45 | ✅ OUI |
| Correction < 24h | LIVREE | REFUSEE | 100 → 105 | 45 | ❌ NON |

**Devrait être :**
| Scénario | Statut initial | Statut final | Stock actuel | Stock en livraison | Correct ? |
|----------|---------------|--------------|--------------|-------------------|-----------|
| Correction < 24h | LIVREE | REFUSEE | 100 | 45 → 50 | ✅ OUI |

### **2️⃣ EXPEDITION (Envoi transporteur)**

| Scénario | Statut initial | Statut final | Stock actuel | Correct ? |
|----------|---------------|--------------|--------------|-----------|
| Livraison confirmée | ASSIGNEE/EXPEDITION | LIVREE | 100 (déjà réduit à création) | ✅ OUI |
| Correction < 24h | LIVREE | REFUSEE | 100 → 105 | ⚠️ À VÉRIFIER |

**Question :** Si une EXPEDITION est annulée après confirmation, doit-on remettre le stock ?
- ✅ Si le colis revient physiquement : OUI
- ❌ Si le colis est perdu/en transit : NON

**Actuellement :** Le stock est remis automatiquement → Peut-être OK si le colis revient.

### **3️⃣ EXPRESS (Retrait agence avec 10% payé)**

| Scénario | Statut initial | Statut final | Stock EXPRESS | Correct ? |
|----------|---------------|--------------|---------------|-----------|
| Paiement 10% | VALIDEE | EXPRESS | 50 → 55 | ✅ OUI |
| Retrait final | EXPRESS_ARRIVE | EXPRESS_LIVRE | 55 → 50 | ✅ OUI |
| Annulation | EXPRESS | ANNULEE | 55 (pas changé) | ⚠️ À VÉRIFIER |

**Pas de logique de correction dans les 24h pour EXPRESS actuellement.**

---

## 🛠️ **CORRECTION NÉCESSAIRE**

### **Problème 1 : Correction LOCAL (LIVREE → REFUSEE/ANNULEE)**

#### **Code actuel (INCORRECT) :**

```javascript
// Ligne 356-387
if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
  // ❌ Remet dans stockActuel (FAUX pour LOCAL)
  await tx.product.update({
    where: { id: order.productId },
    data: { stockActuel: stockApres }  // ← ERREUR ICI
  });
}
```

#### **Code corrigé (CORRECT) :**

```javascript
// Ligne 356-387
if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({ where: { id: order.productId } });

  if (product) {
    // 📦 LOCAL : Remettre dans stockLocalReserve (le colis est encore chez le livreur)
    if (order.deliveryType === 'LOCAL') {
      const stockLocalReserveAvant = product.stockLocalReserve;
      const stockLocalReserveApres = stockLocalReserveAvant + order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockLocalReserve: stockLocalReserveApres }
      });

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'CORRECTION_LIVRAISON_LOCAL',
          quantite: order.quantite, // Positif car on rajoute
          stockAvant: stockLocalReserveAvant,
          stockApres: stockLocalReserveApres,
          orderId: order.id,
          effectuePar: user.id,
          motif: `Correction livraison LOCAL ${order.orderReference} - ${order.status} → ${status} (< 24h) - Colis encore chez livreur`
        }
      });
    }
    // 📮 EXPEDITION : Remettre dans stockActuel (le colis peut revenir)
    else if (order.deliveryType === 'EXPEDITION') {
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant + order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockActuel: stockApres }
      });

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'RETOUR_EXPEDITION',
          quantite: order.quantite,
          stockAvant,
          stockApres,
          orderId: order.id,
          effectuePar: user.id,
          motif: `Correction EXPEDITION ${order.orderReference} - ${order.status} → ${status} (< 24h)`
        }
      });
    }
    // ⚡ EXPRESS : Remettre dans stockExpress
    else if (order.deliveryType === 'EXPRESS') {
      const stockExpressAvant = product.stockExpress || 0;
      const stockExpressApres = stockExpressAvant + order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockExpress: stockExpressApres }
      });

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'CORRECTION_EXPRESS',
          quantite: order.quantite,
          stockAvant: stockExpressAvant,
          stockApres: stockExpressApres,
          orderId: order.id,
          effectuePar: user.id,
          motif: `Correction EXPRESS ${order.orderReference} - ${order.status} → ${status} (< 24h)`
        }
      });
    }
    // 🔹 Autres types : Comportement par défaut (stockActuel)
    else {
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant + order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockActuel: stockApres }
      });

      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'RETOUR',
          quantite: order.quantite,
          stockAvant,
          stockApres,
          orderId: order.id,
          effectuePar: user.id,
          motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
        }
      });
    }
  }
}
```

---

## 📋 **NOUVEAUX TYPES DE MOUVEMENTS À AJOUTER**

### **Dans `prisma/schema.prisma` :**

```prisma
enum StockMovementType {
  APPROVISIONNEMENT
  AJUSTEMENT
  RESERVATION_LOCAL
  LIVRAISON_LOCAL
  RETOUR_LOCAL
  RESERVATION
  LIVRAISON
  RETOUR
  RESERVATION_EXPRESS
  RETRAIT_EXPRESS
  CORRECTION
  CORRECTION_LIVRAISON_LOCAL   // ✅ NOUVEAU
  RETOUR_EXPEDITION             // ✅ NOUVEAU
  CORRECTION_EXPRESS            // ✅ NOUVEAU
}
```

---

## 🧪 **TESTS À EFFECTUER**

### **Test 1 : Correction LOCAL dans les 24h**

```
1. Gestionnaire Stock confirme REMISE (10 colis LOCAL)
   → stockActuel : 100 → 90
   → stockLocalReserve : 0 → 10

2. Livreur marque 5 colis LIVREE
   → stockActuel : 90
   → stockLocalReserve : 10 → 5

3. Livreur se rend compte d'une erreur (< 24h) → Change 1 LIVREE vers REFUSEE
   → stockActuel : 90 (PAS CHANGÉ) ✅
   → stockLocalReserve : 5 → 6 ✅

4. Gestionnaire Stock confirme RETOUR (6 colis restants)
   → stockActuel : 90 → 96 ✅
   → stockLocalReserve : 6 → 0 ✅
```

### **Test 2 : Correction EXPEDITION dans les 24h**

```
1. Appelant crée EXPEDITION (paiement 100%)
   → stockActuel : 100 → 95

2. Livreur marque LIVREE (expédié)
   → stockActuel : 95 (PAS CHANGÉ) ✅

3. Livreur se rend compte que l'expédition a échoué (< 24h) → Change LIVREE vers REFUSEE
   → stockActuel : 95 → 100 ✅ (Le colis revient)
```

### **Test 3 : Correction EXPRESS dans les 24h**

```
1. Appelant crée EXPRESS (paiement 10%)
   → stockActuel : 100 → 95
   → stockExpress : 0 → 5

2. Client retire (paiement 90%)
   → stockActuel : 95 (PAS CHANGÉ)
   → stockExpress : 5 → 0

3. Si annulation < 24h (cas rare)
   → stockActuel : 95 (PAS CHANGÉ)
   → stockExpress : 0 → 5 ✅
```

---

## ⚠️ **IMPACT DU BUG ACTUEL**

### **Symptômes possibles :**

1. **Stock disponible gonflé artificiellement**
   - Chaque correction LOCAL ajoute du stock au magasin
   - Alors que le colis est encore chez le livreur

2. **Stock en livraison sous-estimé**
   - Les colis corrigés ne reviennent pas dans stockLocalReserve
   - Le système pense qu'il y a moins de colis chez les livreurs

3. **Incohérence lors du RETOUR**
   - Lors de la confirmation RETOUR, le Gestionnaire Stock compte les colis physiques
   - Mais le système pense qu'il y en a moins
   - Peut créer des écarts

### **Exemple concret :**

```
Situation :
- 10 colis LOCAL remis à Hassan
- Hassan marque 5 LIVREE
- Hassan se rend compte d'une erreur, change 2 LIVREE vers REFUSEE
- Hassan a maintenant : 3 LIVREE + 5 ASSIGNEE + 2 REFUSEE = 10 colis physiques

Stock système (BUG ACTUEL) :
- stockActuel : 90 + 2 = 92 ❌ (faux, aucun colis n'est revenu)
- stockLocalReserve : 5 + 0 = 5 ❌ (faux, Hassan a 7 colis non livrés)

Stock système (CORRIGÉ) :
- stockActuel : 90 ✅ (correct, aucun colis revenu)
- stockLocalReserve : 5 + 2 = 7 ✅ (correct, Hassan a 7 colis non livrés)
```

---

## 📊 **GRAVITÉ DU BUG**

| Critère | Évaluation | Détails |
|---------|-----------|---------|
| **Fréquence** | 🟡 MOYENNE | Se produit à chaque correction < 24h |
| **Impact stock** | 🔴 ÉLEVÉ | Crée des incohérences dans les compartiments |
| **Impact business** | 🟡 MOYEN | Le stock total reste cohérent, mais les détails sont faux |
| **Détection** | 🟢 FAIBLE | Difficile à détecter (nécessite audit détaillé) |
| **Correction** | 🟢 SIMPLE | Modification locale dans 1 fichier |

**Priorité : 🔴 HAUTE** (Correction recommandée immédiatement)

---

## ✅ **RÉSUMÉ DE L'AUDIT**

### **Fonctionnalité 24h :**
- ✅ Délai de 24h correctement implémenté (frontend)
- ✅ Vérification du délai avant modification
- ✅ Affichage du temps restant

### **Mouvement de stock :**
- ✅ LIVREE : Stock correctement réduit
- ❌ Correction LIVREE → REFUSEE : **BUG CRITIQUE DÉTECTÉ**
  - LOCAL : Stock remis dans le mauvais compartiment
  - EXPEDITION : Peut-être OK (à confirmer)
  - EXPRESS : Pas géré

### **Recommandations :**

1. **🔴 URGENT :** Corriger la logique de correction pour LOCAL
2. **🟡 IMPORTANT :** Vérifier la logique EXPEDITION
3. **🟡 IMPORTANT :** Ajouter la logique EXPRESS
4. **🟢 AMÉLIORATION :** Ajouter des tests automatisés

---

## 🚀 **PROCHAINES ÉTAPES**

1. ✅ Audit terminé
2. ⏳ Correction du code (à faire)
3. ⏳ Ajout des nouveaux types de mouvements (à faire)
4. ⏳ Tests manuels (à faire)
5. ⏳ Déploiement en production (à faire)

---

**Rapport d'audit généré le 26 Décembre 2025**  
**Par : Assistant IA - GS Pipeline**


