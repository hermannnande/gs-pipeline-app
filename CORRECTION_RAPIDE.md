# ⚡ GUIDE RAPIDE - CORRECTION DU STOCK NÉGATIF

## 🎯 PROBLÈME
Votre stock en livraison est **négatif** (-33) à cause d'anciennes commandes livrées avant l'implémentation de la confirmation de remise.

---

## ✅ SOLUTION EN 3 ÉTAPES

### **1️⃣ ANALYSER (sans modifier)**
```bash
node prisma/fix-negative-stock-livraison.js
```

**Vous verrez :**
- Combien de commandes sont concernées
- Quels produits sont impactés
- Le stock avant et après correction

---

### **2️⃣ VÉRIFIER**
Le script affiche un résumé complet. **Vérifiez que les chiffres sont corrects !**

**Exemple de résumé :**
```
📦 RÉSUMÉ DES PRODUITS IMPACTÉS :
┌─────────────────────────────────────────────────┐
│ Crème Anti Cerne                                │
│ Stock disponible actuel    :    11              │
│ Stock en livraison actuel  :   -33              │
│ Quantité à corriger        :    33              │
│ Nombre de commandes        :    33              │
└─────────────────────────────────────────────────┘
```

---

### **3️⃣ CORRIGER**
Si tout est correct, exécutez avec `--confirm` :

```bash
node prisma/fix-negative-stock-livraison.js --confirm
```

**Résultat :**
```
✅ Crème Anti Cerne : Stock en livraison corrigé (-33 → 0)

🎉 Le stock est maintenant cohérent !

📦 Crème Anti Cerne
   Stock disponible       : 11
   Stock en livraison     : 0 ✅
   Stock EXPRESS          : 10
   Stock total            : 21
```

---

## ⚠️ IMPORTANT

### **Ce que le script fait :**
✅ Corrige le stock en livraison négatif  
✅ Crée des mouvements de correction  
✅ NE modifie PAS le stock disponible  
✅ NE modifie PAS les commandes  

### **Après correction :**
✅ Le stock redevient positif  
✅ Le système continue normalement  
✅ Les nouvelles commandes fonctionnent comme prévu  

---

## 📝 EXEMPLE

**AVANT :**
```
Stock disponible   : 11
Stock en livraison : -33 ❌
Stock total        : -12 ❌
```

**APRÈS :**
```
Stock disponible   : 11
Stock en livraison : 0 ✅
Stock total        : 21 ✅
```

---

## 🚀 EXÉCUTION

**Sur votre serveur Railway :**

1. Connectez-vous à Railway
2. Ouvrez le terminal
3. Exécutez :
   ```bash
   node prisma/fix-negative-stock-livraison.js --confirm
   ```

**En local :**

1. Ouvrez un terminal
2. Allez dans le dossier du projet
3. Exécutez :
   ```bash
   node prisma/fix-negative-stock-livraison.js --confirm
   ```

---

## ✅ VÉRIFICATION

Après correction, vérifiez dans l'interface :
1. Allez dans **"Gestion des Produits"**
2. Cherchez "Crème Anti Cerne"
3. Le stock en livraison doit être **0 ou positif** ✅

---

**C'est tout ! Simple et sûr. 🎉**

