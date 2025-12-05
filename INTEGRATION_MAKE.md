# 🔗 INTÉGRATION MAKE → APP WEB (Commandes & Stock)

## 📋 OBJECTIF

Faire en sorte que les commandes qui arrivent sur les pages produits soient automatiquement enregistrées **à la fois** dans :
1. ✅ **Google Sheets** (comme actuellement)
2. ✅ **L'application web** (nouvelle intégration)

---

## 🎯 PRINCIPE GÉNÉRAL

### Flux actuel :
```
Page produit → Formulaire → Webhook Make → Scénario Make → Google Sheets
```

### Nouveau flux enrichi :
```
Page produit → Formulaire → Webhook Make → Scénario Make
                                           ↓
                                   ┌───────┴───────┐
                                   │               │
                           ┌───────▼────┐    ┌────▼────────┐
                           │ Google     │    │ API HTTP    │
                           │ Sheets     │    │ App Web     │
                           └────────────┘    └─────────────┘
```

---

## 🔧 ÉTAPE 1 : CONFIGURATION DE L'APP WEB

### A. Ajouter la clé API dans `.env`

**Ouvrez votre fichier `.env`** et ajoutez cette ligne :

```bash
MAKE_WEBHOOK_API_KEY="votre_cle_api_securisee_changez_moi"
```

**Comment générer une clé sécurisée :**

```bash
# Option 1 : Générer avec OpenSSL
openssl rand -hex 32

# Option 2 : Générer en ligne
# Allez sur https://randomkeygen.com/ et copiez une "Fort Knox Password"

# Exemple de clé :
# MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8"
```

⚠️ **IMPORTANT** : 
- Gardez cette clé **secrète**
- Ne la commitez **jamais** dans Git
- Utilisez la **même clé** dans Make

### B. Redémarrer le serveur backend

```bash
npm run dev
```

Vérifiez dans les logs que le serveur démarre sans erreur.

---

## 📦 ÉTAPE 2 : CONFIGURATION DES PRODUITS

### A. Créer ou vérifier les produits dans l'app

Chaque produit dans l'app doit avoir un **code unique** qui correspond au `product_key` que Make enverra.

**Connexion :**
- Email : `admin@gs-pipeline.com`
- Mot de passe : `admin123`

**Aller dans : Gestion des Produits** 📦

### B. Exemple de produits à créer

| Code (product_key) | Nom du produit | Prix (XOF) | Stock initial |
|-------------------|----------------|------------|---------------|
| `GAINE_TOURMALINE` | Gaine Tourmaline Amincissante | 45000 | 100 |
| `PATCH_CICATRICE` | Patch Anti-Cicatrice | 25000 | 150 |
| `CREME_VISAGE` | Crème Visage Anti-Âge | 35000 | 80 |
| `SERUM_CHEVEUX` | Sérum Pousse Cheveux | 30000 | 120 |

**➡️ Le champ "Code" sera utilisé comme `product_key` par Make**

### C. Créer un produit

1. Cliquez sur **"Ajouter un produit"**
2. Remplissez :
   - **Code** : `GAINE_TOURMALINE` (⚠️ Doit correspondre exactement à ce que Make enverra)
   - **Nom** : `Gaine Tourmaline Amincissante`
   - **Description** : Description du produit
   - **Prix** : `45000`
   - **Stock actuel** : `100`
   - **Seuil d'alerte** : `10`
3. Enregistrer

---

## 🔗 ÉTAPE 3 : CONFIGURATION MAKE

### A. Vérifier l'API de l'app (test)

**Avant de configurer Make, testez que l'API fonctionne :**

```bash
# Test 1 : Vérifier que le webhook est accessible
curl -X GET \
  http://localhost:5000/api/webhook/test \
  -H "X-API-KEY: votre_cle_api_securisee_changez_moi"

# Réponse attendue :
{
  "success": true,
  "message": "Webhook Make fonctionnel !",
  "timestamp": "2025-12-05T12:00:00.000Z"
}

# Test 2 : Lister les produits disponibles
curl -X GET \
  http://localhost:5000/api/webhook/products \
  -H "X-API-KEY: votre_cle_api_securisee_changez_moi"

# Réponse attendue :
{
  "success": true,
  "products": [
    {
      "product_key": "GAINE_TOURMALINE",
      "name": "Gaine Tourmaline Amincissante",
      "price": 45000,
      "stock": 100
    }
  ],
  "count": 1
}
```

### B. Configuration d'un scénario Make

Pour **CHAQUE** page produit, voici la structure du scénario Make :

```
┌────────────────────────────────────────────────────────┐
│  SCÉNARIO MAKE : "GAINE_TOURMALINE"                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1️⃣ Webhook                                           │
│     └─ Reçoit les données du formulaire               │
│                                                        │
│  2️⃣ Google Sheets - Add a row                        │
│     └─ Ajoute la commande dans le fichier Sheets     │
│                                                        │
│  3️⃣ HTTP - Make a request (NOUVEAU)                  │
│     └─ Envoie la commande à l'app web                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### C. Configuration du module HTTP (Étape 3️⃣)

**Type de requête :** `POST`

**URL :**
```
https://votre-domaine.com/api/webhook/make
```

**OU en développement local :**
```
http://localhost:5000/api/webhook/make
```

**Headers à ajouter :**

| Nom | Valeur |
|-----|--------|
| `Content-Type` | `application/json` |
| `X-API-KEY` | `votre_cle_api_securisee_changez_moi` |

**Body (Request content)** - Sélectionnez `Raw` et `JSON` :

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.form.name}}",
  "customer_phone": "{{1.form.phone}}",
  "customer_city": "{{1.form.city}}",
  "customer_commune": "{{1.form.commune}}",
  "customer_address": "{{1.form.address}}",
  "quantity": "{{1.form.quantity}}",
  "source": "PAGE_GAINE_TOURMALINE",
  "make_scenario_name": "{{scenario.name}}",
  "campaign_source": "{{1.form.utm_source}}",
  "campaign_name": "{{1.form.utm_campaign}}",
  "page_url": "{{1.form.page_url}}",
  "raw_payload": {
    "form_data": "{{1.form}}"
  }
}
```

**⚠️ IMPORTANT :** 
- Remplacez `"GAINE_TOURMALINE"` par le **code exact** du produit dans l'app
- Adaptez les mappings `{{1.form.xxx}}` selon les champs de votre formulaire
- Le `1` dans `{{1.form.xxx}}` correspond au numéro du module Webhook (premier module)

---

## 📊 ÉTAPE 4 : MAPPING DES CHAMPS

### Champs obligatoires :

| Champ Make | Champ App | Description | Exemple |
|-----------|-----------|-------------|---------|
| `product_key` | ✅ Obligatoire | Code du produit (doit exister dans l'app) | `"GAINE_TOURMALINE"` |
| `customer_name` | ✅ Obligatoire | Nom du client | `"{{1.form.name}}"` |
| `customer_phone` | ✅ Obligatoire | Téléphone du client | `"{{1.form.phone}}"` |
| `customer_city` | ✅ Obligatoire | Ville du client | `"{{1.form.city}}"` |

### Champs optionnels mais recommandés :

| Champ Make | Champ App | Description | Exemple |
|-----------|-----------|-------------|---------|
| `customer_commune` | Optionnel | Commune du client | `"{{1.form.commune}}"` |
| `customer_address` | Optionnel | Adresse complète | `"{{1.form.address}}"` |
| `quantity` | Optionnel (défaut: 1) | Quantité commandée | `"{{1.form.quantity}}"` |
| `source` | Optionnel | Source de la commande | `"PAGE_GAINE_TOURMALINE"` |
| `make_scenario_name` | Optionnel | Nom du scénario Make | `"{{scenario.name}}"` |
| `campaign_source` | Optionnel | Source campagne (UTM) | `"{{1.form.utm_source}}"` |
| `campaign_name` | Optionnel | Nom campagne (UTM) | `"{{1.form.utm_campaign}}"` |
| `page_url` | Optionnel | URL de la page | `"{{1.form.page_url}}"` |
| `raw_payload` | Optionnel | Données brutes (debug) | `{"form_data": "{{1.form}}"}` |

---

## 🧪 ÉTAPE 5 : TESTER L'INTÉGRATION

### Test 1 : Test manuel avec curl

```bash
curl -X POST \
  http://localhost:5000/api/webhook/make \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: votre_cle_api_securisee_changez_moi" \
  -d '{
    "product_key": "GAINE_TOURMALINE",
    "customer_name": "Test Client",
    "customer_phone": "+2250778123456",
    "customer_city": "Abidjan",
    "customer_commune": "Cocody",
    "quantity": 2,
    "source": "TEST_MANUEL"
  }'
```

**Réponse attendue (200 OK) :**
```json
{
  "success": true,
  "order_id": 123,
  "order_reference": "uuid-xxx-xxx-xxx",
  "product": {
    "id": 1,
    "name": "Gaine Tourmaline Amincissante",
    "code": "GAINE_TOURMALINE"
  },
  "amount": 90000,
  "message": "Commande créée avec succès"
}
```

### Test 2 : Test depuis Make

1. Dans Make, ouvrez votre scénario
2. Cliquez sur **"Run once"**
3. Remplissez le formulaire de test
4. Vérifiez que :
   - ✅ La ligne s'ajoute dans Google Sheets
   - ✅ Le module HTTP retourne `200 OK`
   - ✅ La commande apparaît dans l'app (Dashboard Admin → "À appeler")

### Test 3 : Vérifier dans l'app

1. Connexion Admin : `admin@gs-pipeline.com` / `admin123`
2. Allez dans **"À appeler"** 📞
3. Vous devriez voir la nouvelle commande avec :
   - Nom du client
   - Téléphone
   - Ville
   - Produit : Gaine Tourmaline Amincissante
   - Quantité
   - Montant
   - Statut : NOUVELLE

---

## ❌ GESTION DES ERREURS

### Erreur 401 : Unauthorized

**Cause :** API Key invalide ou manquante

**Solution :**
1. Vérifiez que `X-API-KEY` est bien dans les headers Make
2. Vérifiez que la clé dans Make correspond à celle dans `.env`
3. Redémarrez le serveur backend après modification de `.env`

### Erreur 400 : Unknown product_key

**Cause :** Le `product_key` n'existe pas dans l'app

**Réponse :**
```json
{
  "success": false,
  "error": "Produit inconnu avec product_key: GAINE_TOURMALINE_XXX",
  "hint": "Vérifiez que le produit existe dans l'app avec ce code."
}
```

**Solution :**
1. Allez dans "Gestion des Produits"
2. Vérifiez le code exact du produit
3. Corrigez le `product_key` dans Make

### Erreur 400 : Données invalides

**Cause :** Champs obligatoires manquants

**Solution :**
Vérifiez que ces champs sont présents :
- `product_key`
- `customer_name`
- `customer_phone`
- `customer_city`

### Erreur 500 : Erreur serveur

**Cause :** Erreur côté backend

**Solution :**
1. Vérifiez les logs du serveur backend
2. Vérifiez que la base de données est accessible
3. Vérifiez que le produit existe

---

## 📋 CHECKLIST DE CONFIGURATION

### Configuration App Web :

- [ ] ✅ Ajouté `MAKE_WEBHOOK_API_KEY` dans `.env`
- [ ] ✅ Redémarré le serveur backend
- [ ] ✅ Testé `/api/webhook/test` avec curl
- [ ] ✅ Créé les produits dans "Gestion des Produits"
- [ ] ✅ Vérifié que les codes produits sont corrects

### Configuration Make (par scénario produit) :

- [ ] ✅ Ajouté le module HTTP après Google Sheets
- [ ] ✅ Configuré l'URL : `/api/webhook/make`
- [ ] ✅ Ajouté le header `Content-Type: application/json`
- [ ] ✅ Ajouté le header `X-API-KEY` avec la bonne clé
- [ ] ✅ Configuré le body JSON avec `product_key` correct
- [ ] ✅ Mappé les champs du formulaire
- [ ] ✅ Testé avec "Run once"
- [ ] ✅ Vérifié que la commande apparaît dans l'app

---

## 🎯 EXEMPLE COMPLET : SCÉNARIO "GAINE_TOURMALINE"

### 1. Produit dans l'app

```
Code : GAINE_TOURMALINE
Nom : Gaine Tourmaline Amincissante
Prix : 45000 XOF
Stock : 100
```

### 2. Configuration Make - Module HTTP

**URL :**
```
https://monsite.com/api/webhook/make
```

**Headers :**
```
Content-Type: application/json
X-API-KEY: a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4
```

**Body :**
```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.form.nom}}",
  "customer_phone": "{{1.form.telephone}}",
  "customer_city": "{{1.form.ville}}",
  "customer_commune": "{{1.form.commune}}",
  "customer_address": "{{1.form.adresse}}",
  "quantity": "{{1.form.quantite}}",
  "source": "PAGE_GAINE_TOURMALINE",
  "make_scenario_name": "Gaine Tourmaline - Landing Page",
  "campaign_source": "{{1.form.utm_source}}",
  "campaign_name": "{{1.form.utm_campaign}}",
  "page_url": "https://monsite.com/gaine-tourmaline"
}
```

### 3. Résultat dans l'app

La commande apparaît dans :
- **Dashboard Admin** : Vue d'ensemble
- **"À appeler"** : Liste des commandes à traiter
- **"Commandes"** : Liste complète

Avec toutes les informations :
- Client : Nadia Kouadio
- Téléphone : +2250778123456
- Ville : Abidjan - Cocody
- Produit : Gaine Tourmaline Amincissante
- Quantité : 2
- Montant : 90 000 F CFA
- Statut : NOUVELLE

---

## 📊 SUIVI ET MAINTENANCE

### Vérifications quotidiennes :

1. **Vérifier les logs** du serveur backend :
   ```bash
   # Rechercher les erreurs webhook
   grep "webhook" logs/backend.log
   ```

2. **Comparer les commandes** :
   - Nombre de lignes dans Google Sheets
   - Nombre de commandes dans l'app
   - Les deux doivent être identiques

3. **Vérifier les produits inconnus** :
   ```bash
   # Rechercher les erreurs de product_key
   grep "Produit introuvable" logs/backend.log
   ```

### Ajouter un nouveau produit :

1. **Dans l'app** (Gestion des Produits) :
   - Créer le produit avec un code unique
   - Ex: `SERUM_CHEVEUX`

2. **Dans Make** :
   - Dupliquer un scénario existant
   - Modifier le webhook (nouvelle page produit)
   - Changer le `product_key` dans le module HTTP
   - Tester avec "Run once"

3. **Vérifier** :
   - Test curl
   - Test Make
   - Commande dans l'app

---

## 🔒 SÉCURITÉ

### Bonnes pratiques :

1. **API Key sécurisée** :
   - Minimum 32 caractères
   - Caractères aléatoires
   - Changez-la régulièrement

2. **HTTPS en production** :
   - N'utilisez **JAMAIS** HTTP en production
   - Certificat SSL obligatoire

3. **Logs** :
   - Monitorer les tentatives d'accès invalides
   - Alerter en cas d'erreurs répétées

4. **Rate limiting** (optionnel mais recommandé) :
   - Limiter le nombre de requêtes par IP
   - Protection contre les abus

---

## 📞 SUPPORT

### En cas de problème :

1. **Vérifiez les logs** :
   ```bash
   # Backend
   npm run dev
   
   # Rechercher les erreurs webhook
   grep "webhook" logs/*.log
   ```

2. **Testez manuellement** :
   ```bash
   # Test de l'API
   curl -X POST http://localhost:5000/api/webhook/make \
     -H "Content-Type: application/json" \
     -H "X-API-KEY: votre_cle" \
     -d '{"product_key":"TEST", ...}'
   ```

3. **Vérifiez Make** :
   - Historique des exécutions
   - Logs des modules
   - Réponses HTTP

---

## ✅ RÉSUMÉ RAPIDE

### Configuration minimale (5 min) :

1. **`.env`** :
   ```bash
   MAKE_WEBHOOK_API_KEY="votre_cle_securisee"
   ```

2. **Créer produit dans l'app** :
   - Code : `GAINE_TOURMALINE`
   - Prix : `45000`

3. **Make → Module HTTP** :
   - URL : `https://monsite.com/api/webhook/make`
   - Header : `X-API-KEY: votre_cle_securisee`
   - Body : `{"product_key": "GAINE_TOURMALINE", ...}`

4. **Tester** :
   - Run once dans Make
   - Vérifier dans l'app

**C'est tout !** 🎉

---

## 🎉 AVANTAGES DE CETTE INTÉGRATION

### Pour le business :

✅ **Double sécurité** : Données dans Sheets ET dans l'app
✅ **Pas de perte** : Si un système tombe, l'autre continue
✅ **Traçabilité** : Historique complet dans l'app
✅ **Gestion stock** : Stock automatiquement lié aux commandes
✅ **Comptabilité** : Vue complète des ventes par produit

### Pour l'équipe :

✅ **Appelants** : Toutes les commandes dans un seul endroit
✅ **Gestionnaires** : Vue d'ensemble et assignation facile
✅ **Admin** : Contrôle total et statistiques en temps réel
✅ **Automatique** : Aucune saisie manuelle nécessaire

---

**Date :** 5 décembre 2025
**Version :** 1.0
**Status :** ✅ Prêt pour production

---

## 🚀 **C'EST PRÊT !**

Votre intégration Make → App Web est complète et fonctionnelle !

**Prochaine étape :** Configurer le premier scénario Make et tester ! 🎯

