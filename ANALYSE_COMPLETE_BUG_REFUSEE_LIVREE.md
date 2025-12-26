# 🚨 ANALYSE COMPLÈTE - BUG REFUSEE → LIVREE

**Date :** 26 Décembre 2025  
**Analysé par :** Assistant IA  
**Validé par :** Nande Hermann (ADMIN)

---

## 🎯 **CONFIRMATION DU BUG**

### **Scénario : REFUSEE → LIVREE**

L'utilisateur a raison ! Analysons le code **ligne par ligne**.

---

## 🔍 **ANALYSE DU CODE - CAS PAR CAS**

### **RÈGLE MÉTIER 1 : Passage à LIVREE (ligne 290-351)**

```javascript
// Ligne 291
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({ where: { id: order.productId } });

  if (product) {
    // Ligne 298 : CAS 1 - LOCAL depuis ASSIGNEE
    if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
      // ✅ Réduit stockLocalReserve
    }
    
    // Ligne 321 : CAS 2 - EXPEDITION
    else if (order.deliveryType === 'EXPEDITION') {
      // ✅ Ne fait rien (déjà réduit à la création)
    }
    
    // Ligne 327 : CAS 3 - AUTRES (dont REFUSEE → LIVREE !)
    else if (order.deliveryType !== 'EXPRESS') {
      // ❌ Réduit stockActuel (ERREUR !)
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant - order.quantite;
      await tx.product.update({ data: { stockActuel: stockApres } });
    }
  }
}
```

---

## 🚨 **LE PROBLÈME EXACT**

### **Cas : REFUSEE → LIVREE (LOCAL)**

**Flux complet :**

```
Étape 1 : REMISE (Gestionnaire Stock)
- ASSIGNEE → Colis remis au livreur
- stockActuel : 100 → 99
- stockLocalReserve : 0 → 1
- ✅ Stock se déplace vers le livreur

Étape 2 : Livreur marque REFUSEE
- ASSIGNEE → REFUSEE
- stockActuel : 99 (pas changé)
- stockLocalReserve : 1 (pas changé)
- ✅ Stock reste chez le livreur

Étape 3 : Livreur corrige vers LIVREE (< 24h)
- REFUSEE → LIVREE
- Code vérifie ligne 298 : if (order.status === 'ASSIGNEE') ❌ FAUX
- Code vérifie ligne 321 : else if (order.deliveryType === 'EXPEDITION') ❌ FAUX
- Code tombe dans ligne 327 : else if (order.deliveryType !== 'EXPRESS') ✅ VRAI
- ❌ stockActuel : 99 → 98 (ERREUR !)
- ❌ stockLocalReserve : 1 (pas changé - ERREUR !)
```

**Résultat :**
```
Stock disponible : 98 ❌ (réduit à tort)
Stock en livraison : 1 ❌ (devrait être 0)
```

**Ce qui DEVRAIT se passer :**
```
Stock disponible : 99 ✅ (pas changé)
Stock en livraison : 0 ✅ (réduit car livré)
```

---

## 📊 **TOUS LES CAS PROBLÉMATIQUES**

### **Cas 1 : ASSIGNEE → LIVREE (LOCAL)**
```
✅ CORRECT
Ligne 298 : if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL')
→ Réduit stockLocalReserve ✅
```

### **Cas 2 : REFUSEE → LIVREE (LOCAL)**
```
❌ INCORRECT
Ne rentre pas dans ligne 298 (order.status !== 'ASSIGNEE')
Tombe dans ligne 327 (else if)
→ Réduit stockActuel ❌ MAUVAIS !
→ Devrait réduire stockLocalReserve
```

### **Cas 3 : ANNULEE_LIVRAISON → LIVREE (LOCAL)**
```
❌ INCORRECT
Ne rentre pas dans ligne 298 (order.status !== 'ASSIGNEE')
Tombe dans ligne 327 (else if)
→ Réduit stockActuel ❌ MAUVAIS !
→ Devrait réduire stockLocalReserve
```

### **Cas 4 : RETOURNE → LIVREE (LOCAL)**
```
❌ INCORRECT
Ne rentre pas dans ligne 298 (order.status !== 'ASSIGNEE')
Tombe dans ligne 327 (else if)
→ Réduit stockActuel ❌ MAUVAIS !
→ Devrait réduire stockLocalReserve
```

---

## 💡 **LOGIQUE MÉTIER CORRECTE**

### **Principe fondamental :**

**Pour les commandes LOCAL :**

Le stock est dans **stockLocalReserve** dès la **REMISE**, peu importe le statut après :

```
REMISE → stockLocalReserve contient le colis

Statuts possibles chez le livreur :
- ASSIGNEE (en cours de livraison)
- REFUSEE (client a refusé, colis encore chez livreur)
- ANNULEE_LIVRAISON (annulée, colis encore chez livreur)
- RETOURNE (marqué pour retour, colis encore chez livreur)

TOUS ces statuts = colis dans stockLocalReserve !

Quand → LIVREE :
→ Le colis sort définitivement
→ Réduire stockLocalReserve (peu importe le statut précédent)
```

**La question n'est pas "quel était le statut précédent"**  
**La question est : "où est le stock physiquement ?"**

---

## ✅ **SOLUTION COMPLÈTE**

### **Code actuel (INCORRECT) :**

```javascript
// Ligne 297-349
if (product) {
  // 📦 LOCAL : Si la commande était ASSIGNEE (livraison locale), réduire stockLocalReserve
  if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
    // ✅ Réduit stockLocalReserve
  } 
  // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
  else if (order.deliveryType === 'EXPEDITION') {
    // ✅ Ne fait rien
  }
  // ⚡ EXPRESS ou autres : comportement par défaut (ne devrait pas arriver ici normalement)
  else if (order.deliveryType !== 'EXPRESS') {
    // ❌ Réduit stockActuel (ERREUR pour LOCAL avec statut REFUSEE/ANNULEE/RETOURNE)
  }
}
```

### **Code corrigé (CORRECT) :**

```javascript
// Ligne 297-349
if (product) {
  // 📦 LOCAL : Si le colis est chez le livreur (peu importe le statut)
  if (order.deliveryType === 'LOCAL') {
    const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
    
    // Vérifier si le colis était chez le livreur
    if (statusAvecLivreur.includes(order.status)) {
      // ✅ Réduit stockLocalReserve (le colis était chez le livreur)
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
          motif: `Livraison locale ${order.orderReference} - ${order.status} → LIVREE - ${order.clientNom}`
        }
      });
    } else {
      // Cas rare : Le colis n'était PAS chez le livreur (ex: LOCAL mais pas encore remis)
      // Dans ce cas, ne rien faire car pas de REMISE confirmée
      console.warn(`Commande ${order.orderReference} : LOCAL → LIVREE sans REMISE préalable`);
    }
  }
  // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
  else if (order.deliveryType === 'EXPEDITION') {
    // ✅ Pas de réduction de stock pour EXPEDITION (déjà réduit lors du paiement 100%)
  }
  // ⚡ EXPRESS : Géré séparément
  else if (order.deliveryType === 'EXPRESS') {
    // ✅ EXPRESS géré par route dédiée /api/orders/:id/express/finaliser
  }
  // 🔹 Autres types (ne devrait pas arriver)
  else {
    // Réduire stockActuel pour les cas non gérés spécifiquement
    const stockAvant = product.stockActuel;
    const stockApres = stockAvant - order.quantite;

    await tx.product.update({
      where: { id: order.productId },
      data: { stockActuel: stockApres }
    });

    await tx.stockMovement.create({
      data: {
        productId: order.productId,
        type: 'LIVRAISON',
        quantite: -order.quantite,
        stockAvant,
        stockApres,
        orderId: order.id,
        effectuePar: user.id,
        motif: `Livraison commande ${order.orderReference} - ${order.clientNom}`
      }
    });
  }
}
```

---

## 🧪 **TEST COMPLET**

### **Test : REFUSEE → LIVREE**

```
Initial :
- Stock disponible : 100
- Stock en livraison : 0

Étape 1 : REMISE (10 colis)
- Stock disponible : 90
- Stock en livraison : 10

Étape 2 : Livreur marque 5 LIVREE (depuis ASSIGNEE)
- Stock disponible : 90
- Stock en livraison : 5

Étape 3 : Livreur marque 3 REFUSEE
- Stock disponible : 90 (pas changé)
- Stock en livraison : 5 (pas changé)

Étape 4 : Livreur corrige 2 REFUSEE → LIVREE

RÉSULTAT ATTENDU :
- Stock disponible : 90 ✅ (PAS CHANGÉ)
- Stock en livraison : 3 ✅ (5 - 2)
- Mouvement : LIVRAISON_LOCAL (-2)

RÉSULTAT ACTUEL (BUG) :
- Stock disponible : 88 ❌ (90 - 2 - ERREUR !)
- Stock en livraison : 5 ❌ (pas changé - ERREUR !)
- Mouvement : LIVRAISON (-2) avec type générique
```

---

## 📋 **MATRICE COMPLÈTE DES CAS**

| Statut initial | Statut final | Type | Stock actuel | Stock livraison | Correct ? |
|----------------|--------------|------|--------------|-----------------|-----------|
| ASSIGNEE | LIVREE | LOCAL | Pas changé | Diminue | ✅ OUI |
| REFUSEE | LIVREE | LOCAL | Diminue | Pas changé | ❌ NON |
| ANNULEE_LIVRAISON | LIVREE | LOCAL | Diminue | Pas changé | ❌ NON |
| RETOURNE | LIVREE | LOCAL | Diminue | Pas changé | ❌ NON |

**Tous devraient être : Stock actuel pas changé, Stock livraison diminue !**

---

## 🎯 **IMPACT RÉEL**

### **Exemple sur une journée :**

```
Hassan a 20 colis :
- 10 LIVREE (depuis ASSIGNEE) → OK
- 5 REFUSEE → OK
- 3 corriges REFUSEE → LIVREE

Avec le bug :
- stockActuel : 100 → 90 (REMISE) → 87 (correction) ❌
- stockLocalReserve : 0 → 20 (REMISE) → 10 (LIVREE) → 10 (pas changé) ❌

Sans le bug :
- stockActuel : 100 → 90 (REMISE) → 90 (pas changé) ✅
- stockLocalReserve : 0 → 20 (REMISE) → 10 (LIVREE) → 7 (correction) ✅

Différence : 3 unités fantômes créées dans le stock magasin !
```

---

## 💯 **CONCLUSION**

### **Vous aviez 100% raison !**

Le bug fait que :
- ❌ Stock disponible (magasin) diminue
- ❌ Stock en livraison ne change pas

Alors que ça devrait être :
- ✅ Stock disponible ne change pas
- ✅ Stock en livraison diminue

**La correction consiste à :**
1. Vérifier le type de livraison (LOCAL) en premier
2. Si LOCAL, vérifier si le colis était chez le livreur (liste de statuts)
3. Si oui, réduire stockLocalReserve (pas stockActuel)

---

**Prêt à corriger ce bug maintenant ! 🚀**

**Rapport d'analyse complète généré le 26 Décembre 2025**  
**Par : Assistant IA - GS Pipeline**


