# 🌐 EXÉCUTION DE LA CORRECTION DE STOCK EN LIGNE (RAILWAY)

**Date :** 26 Décembre 2025  
**Objectif :** Corriger le stock en livraison directement sur le serveur de production Railway

---

## 🎯 **NOUVELLE MÉTHODE - API MAINTENANCE**

Au lieu d'exécuter un script local, j'ai créé une **API de maintenance** qui s'exécute directement sur Railway.

---

## 📍 **ROUTES CRÉÉES**

### **1️⃣ Vérifier la cohérence (sans corriger)**

**Endpoint :** `GET /api/maintenance/check-stock-coherence`  
**Rôle requis :** ADMIN ou GESTIONNAIRE_STOCK  
**Description :** Affiche toutes les incohérences sans modifier la base de données

**Réponse :**
```json
{
  "success": true,
  "coherent": false,
  "totalProduits": 15,
  "produitsIncoherents": 1,
  "incoherences": [
    {
      "code": "GAINE_TOURMALINE",
      "nom": "Gaine Tourmaline Chauffante",
      "stockBDD": -16,
      "stockReel": 5,
      "difference": 21,
      "nbCommandes": 2,
      "commandes": [
        {
          "reference": "CMD-2025-123",
          "quantite": 3,
          "livreur": "Moussa Diallo"
        },
        {
          "reference": "CMD-2025-124",
          "quantite": 2,
          "livreur": "Aminata Sow"
        }
      ]
    }
  ]
}
```

---

### **2️⃣ Corriger automatiquement**

**Endpoint :** `POST /api/maintenance/fix-stock-local-reserve`  
**Rôle requis :** ADMIN uniquement  
**Description :** Recalcule et corrige le stock en livraison basé sur les commandes réelles

**Réponse :**
```json
{
  "success": true,
  "message": "✅ 1 produit(s) corrigé(s) avec succès.",
  "productsFixed": [
    {
      "code": "GAINE_TOURMALINE",
      "nom": "Gaine Tourmaline Chauffante",
      "avant": -16,
      "apres": 5,
      "difference": 21,
      "commandes": [
        {
          "reference": "CMD-2025-123",
          "quantite": 3,
          "livreur": "Moussa Diallo"
        },
        {
          "reference": "CMD-2025-124",
          "quantite": 2,
          "livreur": "Aminata Sow"
        }
      ]
    }
  ]
}
```

---

## 🚀 **COMMENT EXÉCUTER EN LIGNE**

### **Méthode 1 : Via PowerShell/Terminal (RECOMMANDÉ)**

**Étape 1 : Vérifier d'abord (sans corriger)**

```powershell
# Remplacez YOUR_JWT_TOKEN par votre token d'authentification Admin
$token = "YOUR_JWT_TOKEN"
$url = "https://gs-pipeline-app-production.up.railway.app/api/maintenance/check-stock-coherence"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

**Étape 2 : Corriger si nécessaire**

```powershell
$token = "YOUR_JWT_TOKEN"
$url = "https://gs-pipeline-app-production.up.railway.app/api/maintenance/fix-stock-local-reserve"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers | ConvertTo-Json -Depth 10
```

---

### **Méthode 2 : Via l'interface Frontend (À CRÉER)**

Je peux créer une page Admin dédiée avec des boutons :
- 🔍 "Vérifier la cohérence du stock"
- 🔧 "Corriger automatiquement"

---

### **Méthode 3 : Via Postman/Insomnia**

**1. Vérification :**
```
GET https://gs-pipeline-app-production.up.railway.app/api/maintenance/check-stock-coherence
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

**2. Correction :**
```
POST https://gs-pipeline-app-production.up.railway.app/api/maintenance/fix-stock-local-reserve
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 **OBTENIR LE TOKEN D'AUTHENTIFICATION**

### **Option A : Via l'interface Frontend**

1. Connectez-vous sur https://gs-pipeline-app.vercel.app
2. Ouvrez les DevTools (F12)
3. Onglet "Application" → "Local Storage"
4. Copiez la valeur de `token`

### **Option B : Via API**

```powershell
$body = @{
    email = "admin@gs.com"
    password = "votre_mot_de_passe"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "https://gs-pipeline-app-production.up.railway.app/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token: $token"
```

---

## 📋 **CE QUE FAIT LA CORRECTION**

1. ✅ Analyse TOUS les produits
2. ✅ Pour chaque produit, calcule le stock réel en comptant les commandes :
   - Status = `ASSIGNEE`
   - DeliveryType = `LOCAL`
3. ✅ Compare avec le stock en base de données
4. ✅ Si différence détectée :
   - Corrige le `stockLocalReserve`
   - Crée un mouvement de stock pour traçabilité
   - Affiche les détails des commandes
5. ✅ Respecte les livraisons en cours
6. ✅ Ne touche PAS à `stockActuel` ni `stockExpress`

---

## ⚠️ **SÉCURITÉ**

- ✅ Route protégée : ADMIN uniquement pour la correction
- ✅ Vérification accessible : ADMIN et GESTIONNAIRE_STOCK
- ✅ Tous les mouvements sont tracés
- ✅ Basé sur les commandes réelles
- ✅ Ne peut pas créer d'incohérence

---

## 📊 **LOGS SUR RAILWAY**

Après l'exécution, vous verrez dans les logs Railway :

```
🔍 Début de l'analyse du stock en livraison...
📦 15 produit(s) analysé(s).
⚠️  1 produit(s) avec incohérence détecté(s).
🔧 Correction de [GAINE_TOURMALINE] Gaine Tourmaline Chauffante...
   ✅ -16 → 5 (+21)
✅ Correction terminée avec succès!
```

---

## 🎨 **PROCHAINE ÉTAPE (OPTIONNELLE)**

Voulez-vous que je crée une **interface Admin** avec des boutons pour :
- 🔍 Vérifier la cohérence du stock
- 🔧 Corriger automatiquement
- 📊 Voir l'historique des corrections

Cela éviterait d'utiliser des commandes PowerShell.

---

## 📁 **FICHIERS CRÉÉS**

```
📂 GS cursor/
├── 📂 routes/
│   └── 🆕 maintenance.routes.js       ← Routes API de maintenance
├── server.js                           ← Mis à jour (route ajoutée)
└── 📘 EXECUTER_CORRECTION_STOCK_EN_LIGNE.md  ← Ce document
```

---

## ✅ **MAINTENANT JE VAIS POUSSER SUR RAILWAY**

Une fois les fichiers poussés sur GitHub, Railway va automatiquement :
1. ✅ Détecter les changements
2. ✅ Redéployer le backend
3. ✅ La nouvelle API sera disponible en quelques minutes

**Vous pourrez alors exécuter la correction directement en production !** 🚀


