# 🎯 GUIDE DE CONFIGURATION DÉTAILLÉ - INTÉGRATION MAKE

## ⏱️ TEMPS TOTAL : 15 MINUTES

Ce guide vous accompagne **pas à pas** pour configurer l'intégration Make → App Web.

---

# 📋 TABLE DES MATIÈRES

1. [Préparation - Vérifier que tout fonctionne](#étape-0-préparation)
2. [Configuration Backend (.env)](#étape-1-configuration-backend)
3. [Création des produits](#étape-2-création-des-produits)
4. [Test de l'API](#étape-3-test-de-lapi)
5. [Configuration Make](#étape-4-configuration-make)
6. [Test complet](#étape-5-test-complet)
7. [Vérification finale](#étape-6-vérification-finale)

---

# 📍 ÉTAPE 0 : PRÉPARATION (2 min)

## A. Vérifier que les serveurs fonctionnent

### 1. Backend (Port 5000)

**Ouvrez un terminal dans le dossier du projet** et vérifiez :

```bash
# Le serveur backend doit être lancé
npm run dev
```

**✅ Vous devez voir :**
```
🚀 Serveur démarré sur le port 5000
📍 http://localhost:5000
```

**❌ Si erreur :**
- Vérifiez que PostgreSQL est lancé
- Vérifiez le fichier `.env` (DATABASE_URL)

---

### 2. Frontend (Port 3000 ou 3001)

**Ouvrez un autre terminal** dans le dossier `frontend` :

```bash
cd frontend
npm run dev
```

**✅ Vous devez voir :**
```
VITE ready in xxx ms
Local: http://localhost:3001
```

**Testez dans le navigateur :** http://localhost:3001

**✅ La page de connexion doit s'afficher**

---

## B. Vérifier que Make fonctionne

1. **Ouvrez Make.com** dans votre navigateur
2. **Connectez-vous** à votre compte
3. **Ouvrez un scénario existant** (celui d'un produit)
4. **Vérifiez que le webhook fonctionne**

**✅ Prêt pour la suite !**

---

# 📍 ÉTAPE 1 : CONFIGURATION BACKEND (.env) (5 min)

## A. Localiser le fichier .env

**Le fichier `.env` se trouve à la racine du projet backend.**

```
📁 GS cursor (votre projet)
  ├── 📁 frontend/
  ├── 📁 prisma/
  ├── 📁 routes/
  ├── 📄 server.js
  ├── 📄 package.json
  └── 📄 .env           ← ICI !
```

**Si le fichier `.env` n'existe pas :**

1. Créez-le manuellement
2. Ou copiez `.env.example` en `.env`

---

## B. Ouvrir le fichier .env

**Avec Visual Studio Code :**
1. Clic droit sur `.env`
2. "Open With" → "Visual Studio Code"

**Ou avec n'importe quel éditeur de texte**

---

## C. Contenu actuel du fichier .env

Votre fichier `.env` ressemble probablement à ceci :

```bash
# Configuration Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/gs_pipeline"

# Configuration JWT
JWT_SECRET="votre_secret_jwt_tres_securise"

# Configuration Serveur
PORT=5000
NODE_ENV="development"
```

---

## D. Générer une clé API sécurisée

### Option 1 : En ligne (RECOMMANDÉ - Plus simple)

1. **Ouvrez votre navigateur**
2. **Allez sur :** https://randomkeygen.com/
3. **Descendez jusqu'à "Fort Knox Passwords"**
4. **Cliquez sur l'une des clés pour la copier**

**Exemple de clé générée :**
```
a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1
```

**✅ Copiez cette clé dans votre presse-papier (Ctrl+C)**

---

### Option 2 : Avec OpenSSL (Si installé sur votre machine)

**Ouvrez un terminal** et exécutez :

```bash
openssl rand -hex 32
```

**✅ Résultat :**
```
a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1
```

**Copiez cette clé**

---

## E. Ajouter la clé dans le fichier .env

**À la fin du fichier `.env`, ajoutez ces 2 lignes :**

```bash
# Configuration Make Webhook (pour intégration avec Make)
MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1"
```

**⚠️ Remplacez la clé par VOTRE clé générée à l'étape D**

---

## F. Fichier .env complet (exemple)

**Votre fichier `.env` devrait maintenant ressembler à ceci :**

```bash
# Configuration Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/gs_pipeline"

# Configuration JWT
JWT_SECRET="votre_secret_jwt_tres_securise"

# Configuration Serveur
PORT=5000
NODE_ENV="development"

# Configuration Make Webhook (pour intégration avec Make)
MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1"
```

---

## G. Sauvegarder le fichier

**Enregistrez le fichier :**
- **Windows :** `Ctrl + S`
- **Mac :** `Cmd + S`

**✅ Fichier sauvegardé !**

---

## H. Redémarrer le serveur backend

**C'EST IMPORTANT !** Le serveur doit être redémarré pour prendre en compte le nouveau paramètre.

1. **Allez dans le terminal où le backend tourne**
2. **Arrêtez le serveur :** `Ctrl + C`
3. **Redémarrez-le :**

```bash
npm run dev
```

**✅ Vous devez voir :**
```
🚀 Serveur démarré sur le port 5000
📍 http://localhost:5000
```

**✅ ÉTAPE 1 TERMINÉE !**

---

# 📍 ÉTAPE 2 : CRÉATION DES PRODUITS (5 min)

## A. Connexion à l'application web

1. **Ouvrez votre navigateur**
2. **Allez sur :** http://localhost:3001
3. **Page de connexion s'affiche**

---

## B. Connexion en tant qu'Admin

**Remplissez le formulaire de connexion :**

```
📧 Email : admin@gs-pipeline.com
🔒 Mot de passe : admin123
```

**Cliquez sur "Se connecter"**

**✅ Vous êtes maintenant sur le Dashboard Admin**

---

## C. Aller dans "Gestion des Produits"

**Dans le menu de gauche, cliquez sur :**

```
📦 Gestion des Produits
```

**✅ Vous êtes maintenant sur la page "Gestion des Produits"**

**Vous voyez :**
- Statistiques en haut (Total produits, Alertes stock, etc.)
- Liste des produits existants (peut être vide)
- Bouton "Ajouter un produit" en haut à droite

---

## D. Créer votre premier produit

**Cliquez sur le bouton "Ajouter un produit"**

**Un formulaire s'affiche :**

```
┌────────────────────────────────────────────┐
│  Ajouter un produit                        │
├────────────────────────────────────────────┤
│                                            │
│  Code (product_key) *                      │
│  [___________________________________]     │
│                                            │
│  Nom *                                     │
│  [___________________________________]     │
│                                            │
│  Description                               │
│  [___________________________________]     │
│                                            │
│  Prix unitaire (XOF) *                     │
│  [___________________________________]     │
│                                            │
│  Stock actuel *                            │
│  [___________________________________]     │
│                                            │
│  Seuil d'alerte *                          │
│  [___________________________________]     │
│                                            │
│  [Annuler]  [Enregistrer]                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## E. Remplir le formulaire - EXEMPLE 1 : Gaine Tourmaline

**Remplissez chaque champ comme ceci :**

| Champ | Valeur à entrer | ⚠️ Important |
|-------|----------------|--------------|
| **Code** | `GAINE_TOURMALINE` | **Doit correspondre EXACTEMENT au product_key dans Make** |
| **Nom** | `Gaine Tourmaline Amincissante` | Nom affiché dans l'app |
| **Description** | `Gaine minceur avec tourmaline, effet amincissant immédiat` | Optionnel |
| **Prix unitaire** | `45000` | Prix en Franc CFA (XOF) |
| **Stock actuel** | `100` | Stock de départ |
| **Seuil d'alerte** | `10` | Alerte si stock < 10 |

**⚠️ LE CHAMP "CODE" EST CRUCIAL :**
- Il doit être **IDENTIQUE** au `product_key` que vous mettrez dans Make
- Pas d'espaces
- Pas d'accents
- Majuscules recommandées
- Underscore `_` autorisé

**Exemple de remplissage :**

```
Code : GAINE_TOURMALINE
Nom : Gaine Tourmaline Amincissante
Description : Gaine minceur avec tourmaline
Prix : 45000
Stock : 100
Seuil : 10
```

---

## F. Enregistrer le produit

**Cliquez sur le bouton "Enregistrer"**

**✅ Message de succès :**
```
✅ Produit créé avec succès
```

**✅ Le produit apparaît maintenant dans la liste**

---

## G. Créer d'autres produits (optionnel)

**Répétez les étapes D, E, F pour chaque produit**

**Exemples de produits supplémentaires :**

### EXEMPLE 2 : Patch Anti-Cicatrice

```
Code : PATCH_CICATRICE
Nom : Patch Anti-Cicatrice Professionnel
Description : Patch pour réduire les cicatrices
Prix : 25000
Stock : 150
Seuil : 15
```

### EXEMPLE 3 : Crème Visage

```
Code : CREME_VISAGE
Nom : Crème Visage Anti-Âge Premium
Description : Crème anti-âge avec acide hyaluronique
Prix : 35000
Stock : 80
Seuil : 10
```

### EXEMPLE 4 : Sérum Cheveux

```
Code : SERUM_CHEVEUX
Nom : Sérum Pousse Cheveux Rapide
Description : Sérum pour accélérer la pousse
Prix : 30000
Stock : 120
Seuil : 12
```

---

## H. Vérifier les produits créés

**Vous devez maintenant voir vos produits dans la liste :**

```
┌────────────────────────────────────────────────────────────────┐
│  📦 Gestion des Produits                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Total: 4 produits  |  Alertes: 0  |  Valeur: 8 175 000 F    │
│                                                                │
├──────────────┬─────────────────────────────┬───────┬──────────┤
│ Code         │ Nom                         │ Prix  │ Stock    │
├──────────────┼─────────────────────────────┼───────┼──────────┤
│ GAINE_...    │ Gaine Tourmaline...         │ 45k   │ 100 ✅   │
│ PATCH_...    │ Patch Anti-Cicatrice...     │ 25k   │ 150 ✅   │
│ CREME_...    │ Crème Visage Anti-Âge...    │ 35k   │ 80 ✅    │
│ SERUM_...    │ Sérum Pousse Cheveux...     │ 30k   │ 120 ✅   │
└──────────────┴─────────────────────────────┴───────┴──────────┘
```

**✅ ÉTAPE 2 TERMINÉE !**

---

# 📍 ÉTAPE 3 : TEST DE L'API (3 min)

## A. Préparer le test

**Vous aurez besoin de :**
1. Votre clé API (celle du `.env`)
2. Un terminal ou l'outil Postman

**Retrouvez votre clé API :**
1. Ouvrez le fichier `.env`
2. Copiez la valeur de `MAKE_WEBHOOK_API_KEY`

**Exemple :**
```bash
MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1"
```

**✅ Copiez : `a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1`**

---

## B. Test 1 : Vérifier que le webhook fonctionne

**Ouvrez un terminal (PowerShell sur Windows)**

**Exécutez cette commande :**

```powershell
curl -X GET http://localhost:5000/api/webhook/test -H "X-API-KEY: a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1"
```

**⚠️ Remplacez la clé par VOTRE clé**

**✅ RÉSULTAT ATTENDU :**
```json
{
  "success": true,
  "message": "Webhook Make fonctionnel !",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

**❌ SI ERREUR 401 :**
```json
{
  "success": false,
  "error": "API Key invalide."
}
```

**Solution :**
- Vérifiez que la clé est correcte
- Vérifiez que vous avez redémarré le serveur

---

## C. Test 2 : Lister les produits disponibles

**Exécutez cette commande :**

```powershell
curl -X GET http://localhost:5000/api/webhook/products -H "X-API-KEY: a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1"
```

**✅ RÉSULTAT ATTENDU :**
```json
{
  "success": true,
  "products": [
    {
      "product_key": "GAINE_TOURMALINE",
      "name": "Gaine Tourmaline Amincissante",
      "price": 45000,
      "stock": 100
    },
    {
      "product_key": "PATCH_CICATRICE",
      "name": "Patch Anti-Cicatrice Professionnel",
      "price": 25000,
      "stock": 150
    }
  ],
  "count": 2
}
```

**✅ Vous voyez vos produits avec leurs codes (product_key) !**

---

## D. Test 3 : Créer une commande de test

**Exécutez cette commande :**

```powershell
curl -X POST http://localhost:5000/api/webhook/make `
  -H "Content-Type: application/json" `
  -H "X-API-KEY: a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1" `
  -d '{\"product_key\":\"GAINE_TOURMALINE\",\"customer_name\":\"Test Client\",\"customer_phone\":\"+2250778123456\",\"customer_city\":\"Abidjan\",\"quantity\":2}'
```

**⚠️ Sur PowerShell, utilisez les backticks ` pour continuer sur plusieurs lignes**

**✅ RÉSULTAT ATTENDU :**
```json
{
  "success": true,
  "order_id": 67,
  "order_reference": "abc-123-def-456",
  "product": {
    "id": 1,
    "name": "Gaine Tourmaline Amincissante",
    "code": "GAINE_TOURMALINE"
  },
  "amount": 90000,
  "message": "Commande créée avec succès"
}
```

**✅ La commande a été créée !**

---

## E. Vérifier la commande dans l'app

1. **Retournez dans l'application web**
2. **Cliquez sur "À appeler" 📞 dans le menu**
3. **✅ Vous devez voir la commande de test !**

```
┌────────────────────────────────────────────────────────────┐
│  Test Client                                               │
│  +2250778123456 • Abidjan                                  │
│  Gaine Tourmaline Amincissante x2                          │
│  90 000 F CFA                                              │
│  Status: NOUVELLE                                          │
└────────────────────────────────────────────────────────────┘
```

**✅ ÉTAPE 3 TERMINÉE ! L'API fonctionne parfaitement !**

---

# 📍 ÉTAPE 4 : CONFIGURATION MAKE (10 min)

## A. Ouvrir Make.com

1. **Ouvrez votre navigateur**
2. **Allez sur :** https://www.make.com
3. **Connectez-vous** à votre compte
4. **Cliquez sur "Scenarios"** dans le menu

---

## B. Choisir le scénario à modifier

**Vous avez déjà des scénarios Make pour vos pages produits.**

**Exemple de scénarios existants :**
- "Gaine Tourmaline - Landing Page"
- "Patch Cicatrice - Landing Page"
- etc.

**Choisissez un scénario** (celui de "Gaine Tourmaline" par exemple)

**Cliquez sur le scénario pour l'ouvrir**

---

## C. Structure actuelle du scénario

**Votre scénario ressemble probablement à ceci :**

```
┌──────────────────────────────────────────┐
│  1️⃣ Webhooks                            │
│     Custom Webhook                        │
│     └─ Reçoit les données du formulaire  │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│  2️⃣ Google Sheets                       │
│     Add a row                             │
│     └─ Ajoute dans votre fichier Sheets  │
└──────────────────────────────────────────┘
```

**Nous allons ajouter un 3ème module après Google Sheets**

---

## D. Ajouter le module HTTP

### 1. Cliquez sur le bouton "+" après Google Sheets

**Un menu s'affiche avec la recherche de modules**

### 2. Recherchez "HTTP"

**Tapez "HTTP" dans la barre de recherche**

**Cliquez sur "HTTP"**

### 3. Choisissez l'action "Make a request"

**Dans la liste des actions, cliquez sur :**
```
Make a request
```

**Un formulaire de configuration s'affiche**

---

## E. Configuration du module HTTP - PARTIE 1 : URL

### Champ "URL"

**Remplissez avec votre URL :**

**EN PRODUCTION (quand votre site est en ligne) :**
```
https://votre-domaine.com/api/webhook/make
```

**EN DÉVELOPPEMENT (pour tester localement) :**
```
http://localhost:5000/api/webhook/make
```

**⚠️ Pour le moment, utilisez l'URL de développement pour tester**

**⚠️ IMPORTANT :** 
- Pas de `/` à la fin de l'URL
- Bien vérifier `http://` et pas `https://` en local

---

## F. Configuration du module HTTP - PARTIE 2 : Method

### Champ "Method"

**Sélectionnez dans le menu déroulant :**
```
POST
```

---

## G. Configuration du module HTTP - PARTIE 3 : Headers

### Ajouter les headers

**Cliquez sur le bouton "Add item"** (2 fois, pour ajouter 2 headers)

**Header 1 :**
```
Name : Content-Type
Value : application/json
```

**Header 2 :**
```
Name : X-API-KEY
Value : a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8c1
```

**⚠️ Remplacez la valeur de X-API-KEY par VOTRE clé du .env**

**Exemple de remplissage dans Make :**

```
┌────────────────────────────────────────────────┐
│  Headers                                       │
├────────────────────────────────────────────────┤
│  [1] Name  : Content-Type                      │
│      Value : application/json                  │
│                                                │
│  [2] Name  : X-API-KEY                         │
│      Value : a3f5e8c9d2b7f4e1a8c6d9b2e5f8...  │
│                                                │
│  [+ Add item]                                  │
└────────────────────────────────────────────────┘
```

---

## H. Configuration du module HTTP - PARTIE 4 : Body

### Champ "Body type"

**Sélectionnez :**
```
Raw
```

### Champ "Content type"

**Sélectionnez :**
```
JSON (application/json)
```

---

## I. Configuration du module HTTP - PARTIE 5 : Request content

**C'est ici que vous allez mapper les champs du formulaire !**

### Template de base (à adapter)

**Copiez ce JSON dans le champ "Request content" :**

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.nom}}",
  "customer_phone": "{{1.telephone}}",
  "customer_city": "{{1.ville}}",
  "customer_commune": "{{1.commune}}",
  "customer_address": "{{1.adresse}}",
  "quantity": "{{1.quantite}}",
  "source": "PAGE_GAINE_TOURMALINE",
  "make_scenario_name": "{{scenario.name}}",
  "campaign_source": "{{1.utm_source}}",
  "campaign_name": "{{1.utm_campaign}}",
  "page_url": "{{1.page_url}}"
}
```

---

## J. Adapter le Request content à votre formulaire

**⚠️ IMPORTANT : Vous devez adapter les noms de champs !**

### Comment trouver les noms de champs ?

1. **Regardez le module Webhook (module 1)**
2. **Cliquez dessus**
3. **Regardez les champs disponibles** (Output)

**Exemple de ce que vous voyez dans le Webhook :**
```
Output:
- nom: "Nadia Kouadio"
- telephone: "+2250778123456"
- ville: "Abidjan"
- commune: "Cocody"
- quantite: "2"
```

**Donc les variables Make seront :**
- `{{1.nom}}` pour le nom
- `{{1.telephone}}` pour le téléphone
- `{{1.ville}}` pour la ville
- etc.

**Le `1` correspond au numéro du module Webhook (premier module)**

---

## K. Exemples de Request content adaptés

### EXEMPLE 1 : Formulaire simple

**Si votre formulaire a ces champs : name, phone, city**

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.name}}",
  "customer_phone": "{{1.phone}}",
  "customer_city": "{{1.city}}",
  "quantity": "1",
  "source": "PAGE_GAINE_TOURMALINE"
}
```

---

### EXEMPLE 2 : Formulaire complet français

**Si votre formulaire a : nom, prenom, telephone, ville, commune, adresse, quantite**

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.prenom}} {{1.nom}}",
  "customer_phone": "{{1.telephone}}",
  "customer_city": "{{1.ville}}",
  "customer_commune": "{{1.commune}}",
  "customer_address": "{{1.adresse}}",
  "quantity": "{{1.quantite}}",
  "source": "PAGE_GAINE_TOURMALINE"
}
```

---

### EXEMPLE 3 : Avec UTM et tracking

**Si vous trackez les sources avec des UTM :**

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.nom}}",
  "customer_phone": "{{1.telephone}}",
  "customer_city": "{{1.ville}}",
  "quantity": "{{1.quantite}}",
  "source": "PAGE_GAINE_TOURMALINE",
  "campaign_source": "{{1.utm_source}}",
  "campaign_name": "{{1.utm_campaign}}",
  "page_url": "{{1.page_url}}"
}
```

---

## L. Points importants pour le Request content

### 1. Le product_key doit être fixe

**❌ MAUVAIS :**
```json
"product_key": "{{1.product_key}}"  // NE MARCHE PAS
```

**✅ BON :**
```json
"product_key": "GAINE_TOURMALINE"  // Valeur fixe
```

**Le product_key doit être écrit EN DUR (valeur fixe) dans Make**

---

### 2. Le product_key doit correspondre au code produit

**Produit dans l'app :**
```
Code : GAINE_TOURMALINE
```

**Make :**
```json
"product_key": "GAINE_TOURMALINE"  // IDENTIQUE !
```

**⚠️ Majuscules/minuscules comptent !**

---

### 3. Champs obligatoires minimum

**Ces 4 champs sont OBLIGATOIRES :**

```json
{
  "product_key": "GAINE_TOURMALINE",    // OBLIGATOIRE
  "customer_name": "{{1.nom}}",         // OBLIGATOIRE
  "customer_phone": "{{1.telephone}}",  // OBLIGATOIRE
  "customer_city": "{{1.ville}}"        // OBLIGATOIRE
}
```

**Les autres champs sont optionnels**

---

## M. Sauvegarder le module HTTP

**Cliquez sur le bouton "OK"** en bas du formulaire

**✅ Le module HTTP est maintenant ajouté à votre scénario**

**Votre scénario ressemble maintenant à :**

```
┌──────────────────────────────────────────┐
│  1️⃣ Webhooks                            │
│     Custom Webhook                        │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│  2️⃣ Google Sheets                       │
│     Add a row                             │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│  3️⃣ HTTP                                │
│     Make a request (POST)                 │
│     └─ Envoie à l'app web                │
└──────────────────────────────────────────┘
```

---

## N. Sauvegarder le scénario

**Cliquez sur le bouton "Save"** en bas de la page

**✅ Scénario sauvegardé !**

---

## O. Activer le scénario (si désactivé)

**Si le scénario est désactivé, activez-le :**

**Toggle "ON"** en haut à gauche du scénario

**✅ ÉTAPE 4 TERMINÉE !**

---

# 📍 ÉTAPE 5 : TEST COMPLET (3 min)

## A. Préparer le test

**Nous allons tester le scénario complet dans Make**

**Assurez-vous que :**
- ✅ Le backend est lancé
- ✅ Le frontend est lancé
- ✅ Le scénario Make est sauvegardé et activé

---

## B. Lancer un test dans Make

### 1. Cliquez sur "Run once"

**En bas à gauche du scénario, cliquez sur :**
```
▶ Run once
```

**✅ Le scénario se met en mode "listening"**

**Vous voyez :**
```
⏸ Listening for new data...
```

---

### 2. Remplir le formulaire de test

**Make vous demande de déclencher le webhook manuellement**

**Vous avez 2 options :**

#### Option A : Utiliser le formulaire de votre page produit

1. Ouvrez votre landing page (ex: https://monsite.com/gaine-tourmaline)
2. Remplissez le formulaire
3. Cliquez sur "Commander"

#### Option B : Simuler avec curl (plus rapide pour tester)

**Trouvez l'URL du webhook :**
1. Dans Make, cliquez sur le module "Webhooks"
2. Copiez l'URL du webhook

**Exemple d'URL :**
```
https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxx
```

**Envoyez des données de test :**
```powershell
curl -X POST "https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxx" `
  -H "Content-Type: application/json" `
  -d '{\"nom\":\"Test Client\",\"telephone\":\"+2250778123456\",\"ville\":\"Abidjan\",\"quantite\":\"2\"}'
```

---

### 3. Vérifier l'exécution

**Make traite le scénario automatiquement**

**Vous voyez les 3 modules s'exécuter :**

```
1️⃣ Webhooks ✅
    ↓ Données reçues
2️⃣ Google Sheets ✅
    ↓ Ligne ajoutée
3️⃣ HTTP ✅
    ↓ Requête envoyée
```

**Cliquez sur le module "3️⃣ HTTP"** pour voir les détails

---

## C. Vérifier la réponse HTTP

**Dans le module HTTP, regardez "Output" :**

**✅ SUCCÈS (Status Code: 200) :**
```json
{
  "success": true,
  "order_id": 68,
  "order_reference": "abc-123-def-456",
  "product": {
    "id": 1,
    "name": "Gaine Tourmaline Amincissante",
    "code": "GAINE_TOURMALINE"
  },
  "amount": 90000,
  "message": "Commande créée avec succès"
}
```

**✅ La commande a été créée dans l'app !**

---

**❌ ERREUR (Status Code: 400 ou 401) :**

**Erreur 401 : API Key invalide**
```json
{
  "success": false,
  "error": "API Key invalide."
}
```

**Solution :**
- Vérifiez le header X-API-KEY dans Make
- Vérifiez qu'il correspond à la clé dans .env

---

**Erreur 400 : Produit inconnu**
```json
{
  "success": false,
  "error": "Produit inconnu avec product_key: GAINE_TOURMALINE_XXX"
}
```

**Solution :**
- Vérifiez que le product_key dans Make correspond au code du produit dans l'app
- Vérifiez les majuscules/minuscules

---

**Erreur 400 : Données invalides**
```json
{
  "success": false,
  "error": "Données invalides",
  "details": [...]
}
```

**Solution :**
- Vérifiez que les 4 champs obligatoires sont présents
- Vérifiez le mapping des champs ({{1.xxx}})

---

## D. Vérifier dans Google Sheets

1. **Ouvrez votre fichier Google Sheets**
2. **✅ Une nouvelle ligne doit être ajoutée**

---

## E. Vérifier dans l'application web

1. **Retournez dans l'application web**
2. **Cliquez sur "À appeler" 📞**
3. **✅ La commande doit apparaître**

```
┌────────────────────────────────────────────────────────────┐
│  Test Client                                               │
│  +2250778123456 • Abidjan                                  │
│  Gaine Tourmaline Amincissante x2                          │
│  90 000 F CFA                                              │
│  Status: NOUVELLE                                          │
│  Il y a quelques secondes                                  │
└────────────────────────────────────────────────────────────┘
```

**✅ PARFAIT ! Tout fonctionne !**

---

## F. Tester avec une vraie commande

**Maintenant, testez avec une vraie commande :**

1. **Ouvrez votre landing page**
2. **Remplissez le formulaire avec de vraies données**
3. **Cliquez sur "Commander"**
4. **Vérifiez que la commande arrive dans :**
   - ✅ Google Sheets
   - ✅ App Web (À appeler)

**✅ ÉTAPE 5 TERMINÉE !**

---

# 📍 ÉTAPE 6 : VÉRIFICATION FINALE (2 min)

## A. Checklist complète

**Cochez chaque élément :**

### Backend :
- [ ] ✅ Clé API ajoutée dans `.env`
- [ ] ✅ Serveur backend redémarré
- [ ] ✅ Test `/api/webhook/test` réussi (200 OK)
- [ ] ✅ Test `/api/webhook/products` réussi (liste visible)

### App Web :
- [ ] ✅ Produits créés avec codes corrects
- [ ] ✅ Au moins 1 produit créé
- [ ] ✅ Codes produits sans espaces ni accents

### Make (pour ce scénario) :
- [ ] ✅ Module HTTP ajouté après Google Sheets
- [ ] ✅ URL configurée
- [ ] ✅ Method = POST
- [ ] ✅ Headers ajoutés (Content-Type + X-API-KEY)
- [ ] ✅ Body type = Raw
- [ ] ✅ Content type = JSON
- [ ] ✅ Request content configuré
- [ ] ✅ product_key correspond au code produit
- [ ] ✅ Test "Run once" réussi (200 OK)
- [ ] ✅ Commande visible dans Google Sheets
- [ ] ✅ Commande visible dans l'app

---

## B. Test final de bout en bout

**Faites un dernier test complet :**

1. **Ouvrez votre landing page produit**
2. **Remplissez le formulaire**
3. **Soumettez**
4. **Vérifiez Google Sheets : ✅ Ligne ajoutée**
5. **Vérifiez l'app : ✅ Commande visible dans "À appeler"**

**✅ TOUT FONCTIONNE !**

---

## C. Pour les autres produits

**Répétez UNIQUEMENT l'ÉTAPE 4 (Configuration Make) pour chaque autre produit :**

1. **Dupliquez le scénario Make** (ou modifiez un scénario existant)
2. **Ajoutez le module HTTP** (même configuration)
3. **Changez UNIQUEMENT le product_key** dans le Request content
4. **Exemple :**
   - Scénario "Gaine" → `"product_key": "GAINE_TOURMALINE"`
   - Scénario "Patch" → `"product_key": "PATCH_CICATRICE"`
   - Scénario "Crème" → `"product_key": "CREME_VISAGE"`
5. **Testez chaque scénario**

---

## D. Documentation de référence

**Si vous avez des problèmes, consultez :**

- **`GUIDE_DEMARRAGE_MAKE.md`** - Guide rapide (10 min)
- **`INTEGRATION_MAKE.md`** - Documentation technique complète
- **`RESUME_INTEGRATION_MAKE.md`** - Résumé et dépannage

---

# 🎉 FÉLICITATIONS !

**Votre intégration Make → App Web est opérationnelle !**

## ✅ Ce qui fonctionne maintenant :

```
📱 Client remplit formulaire
    ↓
📡 Make reçoit la commande
    ↓
┌───────┴───────┐
│               │
↓               ↓
📊 Google       🌐 App Web
   Sheets          
    │               │
    ↓               ↓
✅ Historique   ✅ Pipeline complet
                   │
                   ↓
                📞 Traitement
                   │
                   ↓
                🚚 Livraison
                   │
                   ↓
                📦 Stock décrémenté
```

**Profitez de votre système automatisé !** 🚀✨

---

**Questions ? Problèmes ?**

Consultez la section **"Problèmes fréquents"** dans `INTEGRATION_MAKE.md`




