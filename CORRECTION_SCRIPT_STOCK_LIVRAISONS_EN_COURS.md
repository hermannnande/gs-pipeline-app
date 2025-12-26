# ⚠️ CORRECTION IMPORTANTE - SCRIPT DE STOCK (LIVRAISONS EN COURS)

**Date :** 26 Décembre 2025  
**Raison :** Le script initial mettait tout à 0, sans tenir compte des livraisons réellement en cours

---

## 🔴 **PROBLÈME IDENTIFIÉ**

Vous avez signalé : **"Il y a des livraisons en cours actuellement"**

**C'était CRITIQUE car :**
- ❌ Le script initial mettait `stockLocalReserve` à **0** pour tous les produits négatifs
- ❌ Cela aurait créé une **incohérence** avec les commandes réellement en cours de livraison
- ❌ Les livreurs auraient eu du stock physiquement, mais le système aurait affiché 0

**Exemple du problème évité :**
```
Produit: Gaine Tourmaline
- Stock BDD: -16 (incohérent)
- Livraisons réelles en cours: 5 unités chez les livreurs

❌ Ancien script: -16 → 0 (FAUX! Il y a 5 unités dehors)
✅ Nouveau script: -16 → 5 (CORRECT! Basé sur les commandes réelles)
```

---

## ✅ **SOLUTION APPLIQUÉE**

### **Nouveau comportement du script :**

Au lieu de mettre tout à 0, le script va maintenant :

1. **📊 Analyser TOUS les produits** (pas seulement les négatifs)

2. **🔍 Calculer le stock LOCAL RÉEL** :
   ```sql
   Stock RÉEL = Somme des quantités des commandes avec:
     - status = 'ASSIGNEE'
     - deliveryType = 'LOCAL'
   ```

3. **⚖️ Comparer** : Stock BDD vs Stock RÉEL

4. **🔧 Corriger uniquement si différence** :
   - Si BDD = -16 et RÉEL = 5 → Corriger à 5 ✅
   - Si BDD = 0 et RÉEL = 0 → Rien à faire ✅
   - Si BDD = 10 et RÉEL = 8 → Corriger à 8 ✅

5. **📋 Afficher les détails** :
   - Liste des commandes en livraison
   - Nom des livreurs
   - Quantités

---

## 💻 **COMPARAISON DU CODE**

### **❌ ANCIEN (Dangereux avec livraisons en cours) :**

```javascript
// Trouver seulement les négatifs
const productsWithNegativeStock = await prisma.product.findMany({
  where: { stockLocalReserve: { lt: 0 } }
});

// Mettre tout à 0
await prisma.product.update({
  where: { id: product.id },
  data: { stockLocalReserve: 0 }  // ❌ Ignore les livraisons réelles
});
```

### **✅ NOUVEAU (Sécurisé) :**

```javascript
// Analyser TOUS les produits
const allProducts = await prisma.product.findMany({
  include: {
    orders: {
      where: {
        status: 'ASSIGNEE',
        deliveryType: 'LOCAL'
      }
    }
  }
});

// Calculer le stock RÉEL basé sur les commandes
const realStockLocalReserve = product.orders.reduce((sum, order) => {
  return sum + (order.quantite || 0);
}, 0);

// Corriger seulement si différence
if (realStockLocalReserve !== currentStockLocalReserve) {
  await prisma.product.update({
    where: { id: product.id },
    data: { stockLocalReserve: realStockLocalReserve }  // ✅ Basé sur la réalité
  });
}
```

---

## 📊 **EXEMPLE DE SORTIE DU NOUVEAU SCRIPT**

```
🔍 Analyse du stock en livraison et recalcul basé sur les livraisons réelles...

📦 15 produit(s) trouvé(s) au total.

⚠️  1 produit(s) avec incohérence de stock détecté(s):

  - [GAINE_TOURMALINE] Gaine Tourmaline Chauffante
    Stock actuel (magasin): 34
    Stock en livraison (BDD): -16 ⚠️ NÉGATIF
    Stock en livraison (RÉEL): 5 ✅
    Différence: +21
    📋 2 commande(s) en livraison:
       • #CMD-2025-123 - 3 unité(s) - Moussa Diallo
       • #CMD-2025-124 - 2 unité(s) - Aminata Sow

🔧 Correction de [GAINE_TOURMALINE] Gaine Tourmaline Chauffante...
   ✅ -16 → 5 (+21)

✅ Correction terminée avec succès!
✅ Tous les stocks en livraison sont cohérents avec les commandes réelles.
```

**Explication :**
- Le produit avait **-16** en base (à cause du bug de double logique)
- Mais il y a **réellement 5 unités** chez les livreurs (3 + 2)
- Le script corrige à **5**, pas à 0 ! ✅

---

## 🚀 **MAINTENANT VOUS POUVEZ EXÉCUTER LE SCRIPT EN TOUTE SÉCURITÉ**

```powershell
cd "C:\Users\nande\Desktop\GS cursor"
node scripts/fix-stock-en-livraison-negatif.js
```

**Garanties :**
- ✅ Le script respecte les livraisons en cours
- ✅ Il ne met PAS tout à 0
- ✅ Il recalcule basé sur les commandes ASSIGNEE réelles
- ✅ Il affiche tous les détails pour vérification
- ✅ Il trace tout dans les mouvements de stock

---

## 📋 **VÉRIFICATION MANUELLE (OPTIONNELLE)**

Si vous voulez vérifier avant d'exécuter le script :

```sql
-- Voir les commandes en livraison pour un produit
SELECT 
  o.orderReference,
  o.quantite,
  o.status,
  o.deliveryType,
  u.nom AS livreur_nom,
  u.prenom AS livreur_prenom
FROM "Order" o
LEFT JOIN "User" u ON o.delivererId = u.id
WHERE o.productId = [ID_DU_PRODUIT]
  AND o.status = 'ASSIGNEE'
  AND o.deliveryType = 'LOCAL';

-- Calculer le total
SELECT 
  p.code,
  p.nom,
  p.stockLocalReserve AS stock_bdd,
  SUM(o.quantite) AS stock_reel
FROM "Product" p
LEFT JOIN "Order" o ON p.id = o.productId 
  AND o.status = 'ASSIGNEE' 
  AND o.deliveryType = 'LOCAL'
GROUP BY p.id, p.code, p.nom, p.stockLocalReserve
HAVING p.stockLocalReserve != COALESCE(SUM(o.quantite), 0);
```

---

## 🎓 **LEÇON APPRISE**

**Toujours tenir compte du contexte métier avant de corriger des données !**

- ❌ Ne jamais supposer qu'un stock négatif = 0
- ✅ Toujours recalculer basé sur les transactions réelles
- ✅ Afficher les détails pour permettre la vérification humaine
- ✅ Tracer toutes les corrections

---

## ✅ **STATUT**

- [x] Script corrigé
- [x] Documentation mise à jour
- [x] Fichiers poussés sur GitHub
- [ ] Script à exécuter par l'utilisateur
- [ ] Vérification des résultats

---

**Vous pouvez maintenant exécuter le script en toute confiance !** 🚀


