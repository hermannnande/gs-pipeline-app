# 🔍 AUDIT COMPLET - AJUSTEMENT DE STOCK

**Date :** 26 Décembre 2025  
**Objectif :** Comprendre comment ajuster le stock et corriger le stock négatif actuel

---

## 📊 **1. ÉTAT DES LIEUX**

### **Problème actuel :**
```
Produit : Gaine Tourmaline Chauffante
- Stock actuel (magasin)    : 34 ✅
- Stock EXPRESS              : 0 ✅
- Stock en livraison (LOCAL) : -16 ❌ NÉGATIF !
```

### **Cause identifiée :**
- ✅ **Double logique de stock** dans le code (corrigée)
- ✅ Stock était réduit 2 fois : à l'assignation ET à la remise
- ✅ Corrections appliquées mais pas encore testées

---

## 🎯 **2. LES 3 TYPES DE STOCK**

Votre système gère 3 compartiments de stock distincts :

| Type de stock | Champ DB | Quand il change | Géré par |
|--------------|----------|-----------------|----------|
| **Stock disponible** | `stockActuel` | Approvisionnement, Livraison EXPRESS/EXPEDITION | Automatique + Manuel |
| **Stock en livraison LOCAL** | `stockLocalReserve` | REMISE confirmée, RETOUR confirmé | **Automatique uniquement** |
| **Stock EXPRESS réservé** | `stockExpress` | Commande EXPRESS créée, Arrivée confirmée | **Automatique uniquement** |

**Stock total physique = stockActuel + stockLocalReserve + stockExpress**

---

## ✅ **3. COMMENT AJUSTER LE STOCK MAINTENANT**

### **🔧 Méthode 1 : Interface Admin (POUR `stockActuel` UNIQUEMENT)**

**Accès :**
1. Connexion avec compte **ADMIN** ou **GESTIONNAIRE_STOCK**
2. Menu : **Gestion Stock → Produits**
3. Rechercher le produit
4. Bouton **"Ajuster le stock"**

**Formulaire :**
```
Type d'ajustement :
  ✅ APPROVISIONNEMENT (+) : Ajouter du stock neuf
  ✅ CORRECTION (+/-)      : Corriger une erreur
  ✅ PERTE (-)             : Perte, casse, vol

Quantité : [Ex: 50 ou -10]
Motif : [OBLIGATOIRE - Ex: "Réception fournisseur"]
```

**Route API utilisée :**
```
POST /api/products/:id/stock/adjust
Body: { quantite, type, motif }
```

**⚠️ LIMITATION :** Cette interface ajuste **UNIQUEMENT** le `stockActuel`, pas le `stockLocalReserve` ou `stockExpress`.

---

### **🔧 Méthode 2 : Script Node.js (POUR CORRIGER LE NÉGATIF)**

**Problème :** Le stock en livraison (`stockLocalReserve`) est négatif et ne peut pas être ajusté via l'interface.

**Solution :** Exécuter le script de correction automatique.

**Commande :**
```powershell
cd "C:\Users\nande\Desktop\GS cursor"
node scripts/fix-stock-en-livraison-negatif.js
```

**Ce que fait le script :**
1. ✅ Identifie tous les produits avec `stockLocalReserve < 0`
2. ✅ Affiche la liste des produits concernés
3. ✅ Corrige automatiquement en mettant à `0`
4. ✅ Crée un mouvement de stock pour tracer la correction
5. ✅ Vérifie que tout est OK

**Exemple de sortie :**
```
🔍 Recherche des produits avec stockLocalReserve négatif...

❌ 1 produit(s) avec stockLocalReserve négatif trouvé(s):

  - [GAINE_TOURMALINE] Gaine Tourmaline Chauffante
    Stock actuel: 34
    Stock en livraison (LOCAL): -16 ⚠️
    Stock EXPRESS: 0

🔧 Correction de [GAINE_TOURMALINE] Gaine Tourmaline Chauffante...
   ✅ -16 → 0

✅ Correction terminée avec succès!
```

---

### **🔧 Méthode 3 : SQL Direct (POUR EXPERTS UNIQUEMENT)**

Si vous avez accès direct à PostgreSQL :

```sql
-- 1. Vérifier l'état
SELECT id, code, nom, stockActuel, stockLocalReserve, stockExpress
FROM "Product"
WHERE code = 'GAINE_TOURMALINE';

-- 2. Corriger le négatif
UPDATE "Product"
SET stockLocalReserve = 0
WHERE code = 'GAINE_TOURMALINE' 
  AND stockLocalReserve < 0;

-- 3. Vérifier
SELECT id, code, nom, stockActuel, stockLocalReserve, stockExpress
FROM "Product"
WHERE code = 'GAINE_TOURMALINE';
```

---

## 🚀 **4. PROCÉDURE RECOMMANDÉE POUR CORRIGER LE NÉGATIF**

### **Étape 1 : Exécuter le script de correction**
```powershell
node scripts/fix-stock-en-livraison-negatif.js
```

### **Étape 2 : Vérifier dans l'interface**
1. Connexion ADMIN ou GESTIONNAIRE_STOCK
2. Menu : **Gestion Stock → Produits**
3. Chercher "Gaine Tourmaline"
4. Vérifier que **"Stock en livraison"** = 0 ✅

### **Étape 3 : Tester le nouveau workflow**
1. Créer une commande LOCAL
2. L'assigner à un livreur
3. GESTIONNAIRE_STOCK confirme la **REMISE** → `stockLocalReserve` augmente
4. Livreur livre ou retourne
5. GESTIONNAIRE_STOCK confirme **RETOUR** si nécessaire → `stockLocalReserve` diminue

---

## 📋 **5. RÈGLES MÉTIER - QUAND AJUSTER MANUELLEMENT ?**

### **✅ Ajustement manuel AUTORISÉ pour `stockActuel` :**
- 📦 **Approvisionnement fournisseur** : +50 unités reçues
- 🔍 **Inventaire physique** : Correction après comptage
- 💔 **Perte, casse, vol** : -5 unités perdues
- 🔧 **Correction d'erreur** : Erreur de saisie

### **❌ Ajustement manuel INTERDIT pour `stockLocalReserve` et `stockExpress` :**
Ces stocks sont **gérés automatiquement** par le système selon le workflow :

**Pour `stockLocalReserve` :**
- ✅ REMISE confirmée → Stock sort (+)
- ✅ RETOUR confirmé → Stock rentre (-)

**Pour `stockExpress` :**
- ✅ Commande EXPRESS créée → Réservation 10% (+)
- ✅ EXPRESS_ARRIVE + LIVREE → Réduction définitive (-)
- ✅ EXPRESS_ARRIVE + REFUSEE → Libération du stock (-)

**⚠️ Exception :** En cas de bug technique (comme actuellement), vous pouvez utiliser le script de correction.

---

## 📊 **6. MOUVEMENTS DE STOCK TRACÉS**

Chaque ajustement crée un enregistrement dans `StockMovement` :

```typescript
{
  type: 'APPROVISIONNEMENT' | 'CORRECTION' | 'PERTE' | ...,
  quantite: +50 ou -10,
  stockAvant: 34,
  stockApres: 84,
  effectuePar: userId,
  motif: "Réception fournisseur X",
  createdAt: timestamp
}
```

**Consulter l'historique :**
- Interface Admin → Produits → Détail produit → Onglet "Mouvements"

---

## 🔮 **7. AMÉLIORATION FUTURE (OPTIONNELLE)**

### **Proposition :** Ajouter un paramètre `stockType` à l'API

**Permettrait d'ajuster les 3 types de stock via l'interface :**

```json
POST /api/products/:id/stock/adjust
{
  "quantite": -16,
  "type": "CORRECTION",
  "motif": "Correction bug",
  "stockType": "LOCAL_RESERVE"  // NOUVEAU
}
```

**Priorité : BASSE** ⚠️  
Utile uniquement pour débugger des incohérences. Le flux automatique doit tout gérer.

**Document détaillé :** `PROPOSITION_AMELIORATION_API_STOCK.md`

---

## 📁 **8. FICHIERS CRÉÉS POUR CET AUDIT**

```
📂 GS cursor/
├── scripts/
│   └── fix-stock-en-livraison-negatif.js      ← Script de correction
├── AUDIT_AJUSTEMENT_STOCK_COMPLET.md          ← Ce document
├── PROPOSITION_AMELIORATION_API_STOCK.md      ← Amélioration future
└── routes/
    ├── product.routes.js                      ← API actuelle
    └── stock.routes.js                        ← REMISE/RETOUR
```

---

## ✅ **9. CHECKLIST - ACTIONS IMMÉDIATES**

- [ ] **Exécuter le script de correction :**
  ```powershell
  node scripts/fix-stock-en-livraison-negatif.js
  ```

- [ ] **Vérifier dans l'interface que le stock est corrigé**

- [ ] **Tester le nouveau workflow LOCAL :**
  - [ ] Créer une commande LOCAL
  - [ ] L'assigner à un livreur
  - [ ] Confirmer REMISE (GESTIONNAIRE_STOCK)
  - [ ] Vérifier que `stockLocalReserve` augmente
  - [ ] Livrer ou retourner
  - [ ] Confirmer RETOUR si applicable
  - [ ] Vérifier que `stockLocalReserve` diminue

- [ ] **Tester le workflow EXPEDITION :**
  - [ ] Créer une commande EXPEDITION
  - [ ] Vérifier que `stockActuel` diminue immédiatement
  - [ ] L'assigner à un livreur
  - [ ] Confirmer REMISE (pour traçabilité)
  - [ ] Vérifier que `stockLocalReserve` ne change pas
  - [ ] Livrer
  - [ ] Vérifier qu'il n'y a pas d'étape RETOUR

- [ ] **Tester le workflow EXPRESS :**
  - [ ] Créer une commande EXPRESS
  - [ ] Vérifier que `stockExpress` augmente (10% réservé)
  - [ ] Confirmer arrivée (EXPRESS_ARRIVE)
  - [ ] Livrer (EXPRESS_LIVRE)
  - [ ] Vérifier que `stockActuel` diminue et `stockExpress` diminue

---

## 🎓 **10. RÉSUMÉ POUR FORMATION ÉQUIPE**

### **Pour ADMIN / GESTIONNAIRE_STOCK :**

**Vous pouvez ajuster le stock disponible (`stockActuel`) via l'interface :**
- 📦 Approvisionnement : Réception fournisseur
- 🔍 Inventaire : Correction après comptage physique
- 💔 Perte/Casse : Produits endommagés

**Vous NE DEVEZ PAS ajuster manuellement :**
- 🚚 Stock en livraison (LOCAL) → Géré par REMISE/RETOUR
- 📮 Stock EXPRESS → Géré par le système automatiquement

### **Pour GESTIONNAIRE_STOCK :**

**Votre rôle clé :**
1. ✅ Confirmer les **REMISES** → Stock sort vers les livreurs
2. ✅ Confirmer les **RETOURS** → Stock rentre en magasin

**Ces 2 actions gèrent automatiquement le `stockLocalReserve`.**

---

## 📞 **11. EN CAS DE PROBLÈME**

**Si le stock devient incohérent :**

1. ✅ **Identifier le type de stock concerné :**
   - `stockActuel` → Ajuster via l'interface
   - `stockLocalReserve` → Exécuter le script de correction
   - `stockExpress` → Vérifier les commandes EXPRESS en cours

2. ✅ **Vérifier les mouvements de stock :**
   - Interface → Produits → Détail → Onglet "Mouvements"
   - Analyser les dernières opérations

3. ✅ **Vérifier les commandes en cours :**
   - Pour LOCAL : Commandes ASSIGNEE
   - Pour EXPRESS : Commandes EXPRESS/EXPRESS_ARRIVE

4. ✅ **En dernier recours :**
   - Exécuter le script de correction
   - Contacter le développeur

---

## 🚀 **PROCHAINE ÉTAPE**

**MAINTENANT :**
```powershell
cd "C:\Users\nande\Desktop\GS cursor"
node scripts/fix-stock-en-livraison-negatif.js
```

**ENSUITE :**
Tester le workflow complet pour valider les corrections appliquées.

---

**Fin de l'audit** ✅

