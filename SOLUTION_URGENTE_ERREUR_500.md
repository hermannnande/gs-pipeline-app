# 🚨 SOLUTION URGENTE - ERREUR 500 CHANGEMENT STATUT

**Date :** 26 Décembre 2025  
**Problème :** Erreur 500 lors du changement LIVREE → REFUSEE  
**Cause probable :** Nouveau type de mouvement pas encore en base de données

---

## 🎯 **DIAGNOSTIC**

### **Erreur :**
```
Failed to load resource: the server responded with a status of 500
URL: /api/orders/3314/status
```

### **Cause probable :**

Le nouveau type de mouvement `CORRECTION_LIVRAISON_LOCAL` n'existe pas encore dans l'enum de la base de données Railway.

**Ce qui se passe :**
1. Code essaie de créer un mouvement avec type `CORRECTION_LIVRAISON_LOCAL`
2. PostgreSQL rejette car le type n'existe pas dans l'enum
3. Erreur 500 retournée

---

## ✅ **SOLUTION RAPIDE**

### **Option 1 : Migration Prisma sur Railway (RECOMMANDÉ)**

Railway doit exécuter la migration Prisma pour ajouter les nouveaux types.

**Commandes à exécuter sur Railway :**

```bash
# Dans Railway CLI ou via le shell Railway
npx prisma migrate deploy

# Ou régénérer le client
npx prisma generate
npx prisma db push
```

**Via Railway Dashboard :**
1. Aller sur https://railway.app
2. Projet : gs-pipeline-backend
3. Service → Settings → Deploy
4. Forcer un redéploiement : "Redeploy"

---

### **Option 2 : Correction temporaire (TEMPORAIRE)**

En attendant la migration, utiliser les anciens types de mouvements.

**Modifier temporairement le code :**

```javascript
// Ligne 393 : Au lieu de
type: 'CORRECTION_LIVRAISON_LOCAL',

// Utiliser temporairement
type: 'RETOUR_LOCAL',
```

**ATTENTION :** Cette solution est temporaire et moins précise pour la traçabilité.

---

### **Option 3 : Migration SQL directe (SI URGENT)**

Si vous avez accès à la base de données Railway, exécuter cette commande SQL :

```sql
-- Ajouter les nouveaux types à l'enum existant
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'CORRECTION_LIVRAISON_LOCAL';
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'RETOUR_EXPEDITION';
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'CORRECTION_EXPRESS';
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'AJUSTEMENT';
```

**Comment accéder à la base Railway :**
1. Railway Dashboard → Database
2. Connect → Copy connection string
3. Utiliser un client PostgreSQL (pgAdmin, DBeaver, ou `psql`)

---

## 🔧 **SOLUTION COMPLÈTE (RECOMMANDÉ)**

### **Étape 1 : Pousser la migration Prisma**

Je vais créer le fichier de migration.

### **Étape 2 : Railway exécutera automatiquement**

Railway détecte les migrations Prisma et les exécute automatiquement.

---

## ⚡ **ACTION IMMÉDIATE**

**Voulez-vous que je :**

1. **Option A : Créer la migration Prisma propre** (2 minutes)
   - Je crée le fichier de migration
   - Je le pousse sur GitHub
   - Railway l'exécute automatiquement
   - ✅ Solution propre et définitive

2. **Option B : Correction temporaire** (30 secondes)
   - Je change le type vers `RETOUR_LOCAL` temporairement
   - Ça fonctionnera immédiatement
   - ⚠️ Moins précis pour la traçabilité

3. **Option C : Vous donner les commandes SQL** (1 minute)
   - Je vous donne les commandes SQL exactes
   - Vous les exécutez directement sur Railway
   - ✅ Rapide si vous avez accès à la base

---

**Quelle option préférez-vous ? 😊**

En attendant, je vais vérifier si Railway a bien exécuté `prisma generate`...


