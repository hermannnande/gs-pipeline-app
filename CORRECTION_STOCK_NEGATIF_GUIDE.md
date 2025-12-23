# 🔧 CORRECTION DU STOCK EN LIVRAISON NÉGATIF

## 🎯 PROBLÈME

Des commandes ont été marquées **LIVREE** avant l'implémentation de la fonctionnalité "Confirmation de remise", causant un **stock en livraison négatif**.

**Exemple :**
```
Crème Anti Cerne
├── Stock disponible : 11
├── Stock en livraison : -33 ❌ NÉGATIF !
└── Stock total : -12
```

---

## 💡 CAUSE

```
AVANT (anciennes commandes) :
1. Gestionnaire assigne des commandes
   → Stock ne bouge pas
   
2. ❌ Pas de confirmation de remise (fonctionnalité n'existait pas)
   → Stock en livraison reste à 0
   
3. Livreur marque LIVREE
   → Stock en livraison : 0 - 1 - 1 - 1... = -33 ❌
```

---

## ✅ SOLUTION

Le script `fix-negative-stock-livraison.js` va :

1. **Trouver** toutes les commandes LIVREE où la remise n'a jamais été confirmée
2. **Corriger** le stock en ajoutant les quantités manquantes dans `stockLocalReserve`
3. **Créer** des mouvements de correction pour tracer l'opération
4. **Rétablir** la cohérence du stock

---

## 🚀 UTILISATION

### **Étape 1 : Analyser le problème (sans modifier)**

```bash
node prisma/fix-negative-stock-livraison.js
```

**Résultat :**
```
📊 Commandes trouvées : 33

📦 RÉSUMÉ DES PRODUITS IMPACTÉS :

┌─────────────────────────────────────────────────┐
│ Crème Anti Cerne                                │
│ Code: CREME_ANTI_CERNE                          │
│ ───────────────────────────────────────────────│
│ Stock disponible actuel    :    11              │
│ Stock en livraison actuel  :   -33              │
│ Quantité à corriger        :    33              │
│ Nombre de commandes        :    33              │
└─────────────────────────────────────────────────┘

❌ Correction annulée.
💡 Pour exécuter la correction, utilisez :
   node prisma/fix-negative-stock-livraison.js --confirm
```

---

### **Étape 2 : Vérifier les détails**

Le script affiche :
- ✅ Tous les produits impactés
- ✅ Le stock actuel de chaque produit
- ✅ La quantité à corriger
- ✅ La liste des commandes concernées

**Vérifiez que les chiffres sont corrects avant de continuer !**

---

### **Étape 3 : Appliquer la correction**

Une fois vérifié, exécutez avec `--confirm` :

```bash
node prisma/fix-negative-stock-livraison.js --confirm
```

**Résultat :**
```
🔧 DÉBUT DE LA CORRECTION...

✅ Crème Anti Cerne : Stock en livraison corrigé (-33 → 0)

✅ CORRECTION TERMINÉE AVEC SUCCÈS !

📊 RÉSUMÉ DES CORRECTIONS :
┌─────────────────────────────────────────────────┐
│ 1. Crème Anti Cerne                             │
│    Quantité corrigée     :    33 unités         │
│    Stock avant           :   -33 unités         │
│    Stock après           :     0 unités         │
│    Commandes traitées    :    33                │
└─────────────────────────────────────────────────┘

🔍 VÉRIFICATION DES STOCKS APRÈS CORRECTION :

📦 Crème Anti Cerne
   Stock disponible       : 11
   Stock en livraison     : 0 ✅
   Stock EXPRESS          : 10
   Stock total            : 21

🎉 Le stock est maintenant cohérent !
```

---

## 📊 CE QUE LE SCRIPT FAIT

### **1. Trouve les commandes problématiques**

```sql
Critères :
- status = 'LIVREE'
- deliveryType = 'LOCAL'
- productId existe
- ET (
    deliveryListId = null
    OU tourneeStock.colisRemisConfirme = false
    OU tourneeStock n'existe pas
  )
```

### **2. Corrige le stock**

```javascript
Pour chaque produit impacté :
  stockLocalReserve = stockLocalReserve + quantité_manquante

Exemple :
  Avant : stockLocalReserve = -33
  Correction : -33 + 33 = 0
  Après : stockLocalReserve = 0 ✅
```

### **3. Crée un mouvement de correction**

```javascript
Type: CORRECTION
Motif: "CORRECTION AUTOMATIQUE - Anciennes livraisons (33 commandes) 
        effectuées avant l'implémentation de la confirmation de remise."
```

---

## ⚠️ IMPORTANT

### **Ce script est SÛRE car :**
1. ✅ Il ne supprime aucune donnée
2. ✅ Il affiche un résumé avant de corriger
3. ✅ Il nécessite `--confirm` pour s'exécuter
4. ✅ Il crée des mouvements de stock pour tracer l'opération
5. ✅ Il fonctionne dans une transaction (tout ou rien)

### **Ce script NE modifie PAS :**
- ❌ Le stock disponible (`stockActuel`)
- ❌ Le stock EXPRESS (`stockExpress`)
- ❌ Les commandes existantes
- ❌ Les tournées existantes

### **Ce script modifie UNIQUEMENT :**
- ✅ Le stock en livraison (`stockLocalReserve`)
- ✅ Crée des mouvements de type `CORRECTION`

---

## 🎯 APRÈS LA CORRECTION

Une fois le script exécuté, **le système continue normalement** avec la logique actuelle :

```
MAINTENANT (nouvelles commandes) :

1. Gestionnaire assigne
   → Stock ne bouge pas ✅

2. Gestionnaire Stock confirme REMIS ⚡
   → Stock disponible -X
   → Stock en livraison +X

3. Livreur marque LIVREE
   → Stock en livraison -1

4. Gestionnaire Stock confirme RETOUR
   → Stock en livraison -X
   → Stock disponible +X
```

**✅ Aucun impact sur les nouvelles commandes !**

---

## 📝 EXEMPLE COMPLET

### **Avant correction :**
```
Crème Anti Cerne (CREME_ANTI_CERNE)
├── Stock disponible       : 11
├── Stock en livraison     : -33 ❌
├── Stock EXPRESS          : 10
└── Stock total            : -12 ❌
```

### **Après correction :**
```
Crème Anti Cerne (CREME_ANTI_CERNE)
├── Stock disponible       : 11
├── Stock en livraison     : 0 ✅
├── Stock EXPRESS          : 10
└── Stock total            : 21 ✅
```

---

## 🔍 VÉRIFICATION APRÈS CORRECTION

### **Dans l'interface :**
1. Allez dans **"Gestion des Produits"**
2. Cherchez "Crème Anti Cerne"
3. Vérifiez que le stock en livraison est maintenant **0 ou positif** ✅

### **Dans l'historique des mouvements :**
1. Allez dans **"Mouvements de Stock"**
2. Cherchez "CORRECTION"
3. Vous verrez le mouvement créé par le script avec le motif complet

---

## 🚨 EN CAS DE PROBLÈME

Si après correction, le stock est toujours négatif :

1. **Vérifiez** qu'il n'y a pas eu de nouvelles livraisons pendant la correction
2. **Relancez** le script (il trouvera les nouvelles commandes problématiques)
3. **Contactez** l'administrateur système

---

## 💾 SAUVEGARDE

Le script crée automatiquement des mouvements de correction dans la base de données, donc **tout est tracé** :

- ✅ Qui a exécuté la correction (Admin ID: 1)
- ✅ Quand la correction a été faite (date/heure)
- ✅ Quel produit a été corrigé
- ✅ Combien d'unités ont été ajoutées
- ✅ Le stock avant et après

---

## ✅ RÉSUMÉ

**Ce script :**
1. ✅ Trouve les anciennes commandes LIVREE sans confirmation de remise
2. ✅ Corrige le stock en livraison négatif
3. ✅ Ne modifie PAS le stock disponible
4. ✅ Crée des mouvements de correction pour tracer
5. ✅ S'exécute UNE SEULE FOIS
6. ✅ Le système continue normalement après

**Après correction, plus de stock négatif ! 🎉**

---

**Date :** 23 décembre 2025  
**Version :** 1.0  
**Impact :** Correction du stock en livraison négatif

