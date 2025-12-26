# 🚨 AUDIT - BUG INVERSE : REFUSEE/ANNULEE → LIVREE

**Date :** 26 Décembre 2025  
**Audité par :** Assistant IA  
**Demandé par :** Nande Hermann (ADMIN)

---

## 🎯 **NOUVEAU BUG CRITIQUE IDENTIFIÉ !**

### **Scénario problématique :**

1. Livreur marque une commande **REFUSEE**
2. Livreur se rend compte de son erreur (< 24h)
3. Client a finalement accepté, il change vers **LIVREE**

**Question :** Le stock est-il correctement géré ?

**Réponse :** ❌ **NON ! BUG DÉTECTÉ !**

---

## 🔍 **ANALYSE DU CODE ACTUEL**

### **Fichier :** `routes/order.routes.js`
### **Lignes :** 290-351

### **RÈGLE MÉTIER 1 : Passage à LIVREE**

```javascript
// Ligne 291
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  
  // Ligne 298 : Condition pour LOCAL
  if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
    // Réduire stockLocalReserve
  }
}
```

**❌ PROBLÈME : Condition trop restrictive !**

La condition vérifie **UNIQUEMENT** :
```javascript
if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL')
```

Cela signifie que le stock ne se réduit **QUE** si le statut précédent était **ASSIGNEE** !

---

## 🚨 **LES CAS PROBLÉMATIQUES**

### **Cas 1 : REFUSEE → LIVREE**

```
Étape 1 : Livreur marque REFUSEE
- Statut : ASSIGNEE → REFUSEE
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ✅

Étape 2 : Livreur corrige vers LIVREE (< 24h)
- Statut : REFUSEE → LIVREE
- Code vérifie : if (order.status === 'ASSIGNEE') ❌ FAUX !
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ❌ ERREUR !

Résultat : Le stock n'est jamais réduit !
```

### **Cas 2 : ANNULEE_LIVRAISON → LIVREE**

```
Étape 1 : Livreur marque ANNULEE_LIVRAISON
- Statut : ASSIGNEE → ANNULEE_LIVRAISON
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ✅

Étape 2 : Livreur corrige vers LIVREE (< 24h)
- Statut : ANNULEE_LIVRAISON → LIVREE
- Code vérifie : if (order.status === 'ASSIGNEE') ❌ FAUX !
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ❌ ERREUR !

Résultat : Le stock n'est jamais réduit !
```

### **Cas 3 : RETOURNE → LIVREE (moins fréquent)**

```
Étape 1 : Commande marquée RETOURNE
- Statut : ASSIGNEE → RETOURNE
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ✅

Étape 2 : Livreur corrige vers LIVREE (< 24h)
- Statut : RETOURNE → LIVREE
- Code vérifie : if (order.status === 'ASSIGNEE') ❌ FAUX !
- stockLocalReserve : 10 (PAS DE CHANGEMENT) ❌ ERREUR !

Résultat : Le stock n'est jamais réduit !
```

---

## 📊 **IMPACT DU BUG**

### **Conséquences :**

1. **Stock en livraison surestimé**
   - Le stock reste chez le livreur virtuellement
   - Mais le colis a été livré

2. **Stock ne diminue jamais**
   - Accumulation de stock fantôme

3. **Lors du RETOUR**
   - Gestionnaire Stock compte les colis physiques
   - Le système pense qu'il y a plus de colis
   - Écart créé artificiellement

### **Exemple concret :**

```
Hassan a 10 colis LOCAL :

1. Hassan marque 5 LIVREE (depuis ASSIGNEE)
   → stockLocalReserve : 10 → 5 ✅

2. Hassan marque 3 REFUSEE
   → stockLocalReserve : 5 (pas changé) ✅

3. Hassan se rend compte d'une erreur : 2 REFUSEE étaient en fait livrés
   → Change 2 REFUSEE → LIVREE
   → stockLocalReserve : 5 (pas changé) ❌ ERREUR !
   → Devrait être : 5 → 3

4. Hassan a maintenant :
   - 7 colis LIVREE physiquement
   - 1 REFUSEE physique
   - 2 ASSIGNEE physiques
   - Total : 10 colis

Stock système (BUG ACTUEL) :
- stockLocalReserve : 5 ❌ (faux, devrait être 3)
- Colis réellement chez Hassan : 3 (1 REFUSEE + 2 ASSIGNEE)

5. Lors du RETOUR :
   - Gestionnaire compte : 3 colis physiques
   - Système pense : 5 colis en livraison
   - Écart : -2 colis (système pense qu'il manque 2 colis)
```

---

## ✅ **SOLUTION**

### **Problème :**

La condition est trop restrictive :
```javascript
if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL')
```

Elle ne gère **QUE** le cas **ASSIGNEE → LIVREE**.

### **Solution :**

Élargir la condition pour inclure **TOUS** les statuts intermédiaires :

```javascript
// Liste des statuts où le colis est encore chez le livreur
const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];

if (statusAvecLivreur.includes(order.status) && order.deliveryType === 'LOCAL')
```

---

## 🛠️ **CODE CORRIGÉ**

### **Ancienne logique (INCORRECTE) :**

```javascript
// Ligne 290-351
// RÈGLE MÉTIER 1 : Décrémenter le stock quand la commande passe à LIVRÉE
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });

  if (product) {
    // 📦 LOCAL : Si la commande était ASSIGNEE (livraison locale), réduire stockLocalReserve
    if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL') {
      // ❌ TROP RESTRICTIF : Ne gère que ASSIGNEE → LIVREE
      const stockLocalReserveAvant = product.stockLocalReserve;
      const stockLocalReserveApres = stockLocalReserveAvant - order.quantite;
      // ... mise à jour stock
    }
  }
}
```

### **Nouvelle logique (CORRECTE) :**

```javascript
// RÈGLE MÉTIER 1 : Décrémenter le stock quand la commande passe à LIVRÉE
if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
  const product = await tx.product.findUnique({
    where: { id: order.productId }
  });

  if (product) {
    // 📦 LOCAL : Si le colis était chez le livreur (peu importe le statut)
    const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
    
    if (statusAvecLivreur.includes(order.status) && order.deliveryType === 'LOCAL') {
      // ✅ Gère tous les cas : ASSIGNEE/REFUSEE/ANNULEE/RETOURNE → LIVREE
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
    }
    // 📮 EXPEDITION : Stock déjà réduit lors de la création, ne rien faire
    else if (order.deliveryType === 'EXPEDITION') {
      // ✅ Pas de réduction de stock pour EXPEDITION
    }
    // ⚡ EXPRESS ou autres : comportement par défaut
    else if (order.deliveryType !== 'EXPRESS') {
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
}
```

---

## 🧪 **TEST À EFFECTUER**

### **Test : REFUSEE → LIVREE (< 24h)**

```
Préparation :
- Stock disponible : 100
- Stock en livraison : 0

Étape 1 : Créer commande LOCAL → Assigner → REMISE
→ Stock disponible : 99
→ Stock en livraison : 1

Étape 2 : Livreur marque REFUSEE
→ Stock disponible : 99 (pas changé)
→ Stock en livraison : 1 (pas changé)

Étape 3 : Livreur corrige vers LIVREE (< 24h)
→ Stock disponible : 99 (pas changé) ✅
→ Stock en livraison : 0 (1 - 1) ✅ CRITIQUE !

Résultat attendu :
✅ Stock en livraison réduit
✅ Mouvement LIVRAISON_LOCAL créé
✅ Motif : "REFUSEE → LIVREE"
```

---

## 📋 **STATUTS CONCERNÉS**

### **Statuts où le colis est chez le livreur :**

| Statut | Description | Colis chez livreur ? |
|--------|-------------|---------------------|
| ASSIGNEE | Assigné au livreur | ✅ Oui |
| REFUSEE | Refusé par le client | ✅ Oui |
| ANNULEE_LIVRAISON | Annulé pendant livraison | ✅ Oui |
| RETOURNE | Marqué pour retour | ✅ Oui |

**Tous ces statuts doivent être gérés lors du passage à LIVREE !**

---

## 📊 **GRAVITÉ DU BUG**

| Critère | Évaluation | Détails |
|---------|-----------|---------|
| **Fréquence** | 🟡 MOYENNE | Se produit lors de corrections REFUSEE/ANNULEE → LIVREE |
| **Impact stock** | 🔴 ÉLEVÉ | Stock en livraison surestimé, écarts lors du retour |
| **Impact business** | 🟡 MOYEN | Peut créer des écarts difficiles à expliquer |
| **Détection** | 🔴 DIFFICILE | Nécessite audit manuel des écarts |
| **Correction** | 🟢 SIMPLE | Modification d'une condition |

**Priorité : 🔴 HAUTE** (Correction recommandée immédiatement)

---

## ⚠️ **BUGS IDENTIFIÉS AUJOURD'HUI**

### **Bug 1 : Stock négatif (✅ corrigé)**
- Double logique de stock
- Script de recalcul créé
- Déployé et validé

### **Bug 2 : Correction LIVREE → REFUSEE (✅ corrigé)**
- Stock retournait dans mauvais compartiment
- Logique intelligente par type de livraison
- Déployé et en test

### **Bug 3 : Correction REFUSEE → LIVREE (❌ À CORRIGER)**
- Stock ne se réduit pas
- Condition trop restrictive
- **À corriger maintenant**

---

## 🎯 **RÉSUMÉ**

### **Problème actuel :**

```
Condition actuelle :
if (order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL')
→ Ne gère QUE ASSIGNEE → LIVREE

Cas non gérés :
- REFUSEE → LIVREE ❌
- ANNULEE_LIVRAISON → LIVREE ❌
- RETOURNE → LIVREE ❌
```

### **Solution :**

```
Nouvelle condition :
const statusAvecLivreur = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
if (statusAvecLivreur.includes(order.status) && order.deliveryType === 'LOCAL')
→ Gère TOUS les cas où le colis est chez le livreur
```

### **Impact :**

✅ Stock toujours cohérent  
✅ Correction dans les 24h fonctionne dans les 2 sens  
✅ Aucun écart artificiel lors du retour

---

## 🚀 **ACTION RECOMMANDÉE**

**Corriger immédiatement ce bug car :**

1. Il est symétrique au bug #2 (LIVREE → REFUSEE)
2. La correction est simple (1 ligne à modifier)
3. Impact potentiel élevé sur les écarts de stock
4. Facile à tester en même temps que le bug #2

---

**Voulez-vous que je corrige ce bug maintenant ? 😊**

**Rapport d'audit généré le 26 Décembre 2025**  
**Par : Assistant IA - GS Pipeline**


