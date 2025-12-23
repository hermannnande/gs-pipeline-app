# 🚀 EXÉCUTER LE DIAGNOSTIC SUR RAILWAY

## ⚠️ IMPORTANT
Ce script doit être exécuté sur **Railway** (production) car il a besoin d'accéder à la base de données de production.

---

## 📋 MÉTHODE 1 : Via Railway CLI (Recommandé)

### **Prérequis**
- Railway CLI installé : https://docs.railway.app/develop/cli

### **Étapes**

1. **Se connecter à Railway**
```bash
railway login
```

2. **Lier au projet**
```bash
railway link
```

3. **Exécuter le diagnostic**
```bash
railway run node prisma/diagnostic-stock-negatif.js
```

---

## 📋 MÉTHODE 2 : Via Railway Dashboard

### **Étapes**

1. **Aller sur Railway**
   - https://railway.app
   - Sélectionnez votre projet GS Pipeline

2. **Ouvrir le terminal**
   - Cliquez sur votre service backend
   - Allez dans l'onglet "Shell" ou "Terminal"

3. **Exécuter le script**
```bash
node prisma/diagnostic-stock-negatif.js
```

---

## 📋 MÉTHODE 3 : SSH/Connexion directe

Si Railway offre un accès SSH, vous pouvez vous connecter directement et exécuter le script.

---

## 📊 CE QUE VOUS VERREZ

Le script va afficher :

```
🔍 DIAGNOSTIC APPROFONDI DU STOCK NÉGATIF

═══════════════════════════════════════════════════════════════

📊 Produits avec stock négatif : 1

┌─────────────────────────────────────────────────────────────┐
│ 📦 Crème Anti Cerne                                         │
│ Code: CREME_ANTI_CERNE                                      │
├─────────────────────────────────────────────────────────────┤
│ Stock disponible         :     11 unités                    │
│ Stock EXPRESS (réservé)  :     10 unités                    │
│ Stock en livraison       :    -33 unités ❌                 │
│ ──────────────────────────────────────────────────────────  │
│ Stock total (calculé)    :    -12 unités                    │
└─────────────────────────────────────────────────────────────┘

📋 HISTORIQUE COMPLET DES MOUVEMENTS DE STOCK :
[Liste de tous les mouvements...]

📦 COMMANDES LIVRÉES POUR CE PRODUIT :
[Liste de toutes les commandes...]

🧮 CALCUL DU STOCK THÉORIQUE :
[Analyse détaillée...]

💊 RECOMMANDATION DE CORRECTION :
[Solution proposée...]
```

---

## ✅ APRÈS LE DIAGNOSTIC

Une fois le diagnostic terminé et que vous avez vu le résultat, vous pourrez exécuter la correction :

```bash
railway run node prisma/fix-negative-stock-livraison.js --confirm
```

---

## 🆘 SI VOUS N'AVEZ PAS ACCÈS À RAILWAY CLI

**Alternative :** Exécutez depuis votre machine locale mais avec la DATABASE_URL de production.

1. **Récupérez votre DATABASE_URL de Railway**
   - Allez dans Railway > Variables
   - Copiez la valeur de `DATABASE_URL`

2. **Créez un fichier `.env.local`**
```bash
DATABASE_URL="votre_url_de_production_ici"
```

3. **Exécutez avec cette variable**
```bash
set DATABASE_URL="votre_url_de_production_ici" && node prisma/diagnostic-stock-negatif.js
```

---

## 📞 BESOIN D'AIDE ?

Si vous avez des difficultés pour exécuter sur Railway, dites-moi et je vous guiderai pas à pas ! 🚀

