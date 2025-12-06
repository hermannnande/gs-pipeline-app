# 🚀 GUIDE DE DÉMARRAGE RAPIDE - INTÉGRATION MAKE

## ⏱️ MISE EN PLACE EN 10 MINUTES

### 📍 ÉTAPE 1 : Ajouter la clé API (2 min)

1. **Ouvrez le fichier `.env`** à la racine du projet

2. **Ajoutez cette ligne à la fin du fichier** :

```bash
# Configuration Make Webhook
MAKE_WEBHOOK_API_KEY="CHANGEZ_MOI_PAR_UNE_CLE_SECURISEE"
```

3. **Générez une clé sécurisée** :

**Option A : En ligne (plus simple)**
- Allez sur : https://randomkeygen.com/
- Copiez une "Fort Knox Password"
- Remplacez `CHANGEZ_MOI_PAR_UNE_CLE_SECURISEE`

**Option B : Avec OpenSSL**
```bash
openssl rand -hex 32
```

**Exemple final dans `.env` :**
```bash
MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4b7e9d2c5f8a1b4e7d0c3f6a9b2e5d8"
```

4. **Sauvegardez le fichier**

5. **Redémarrez le serveur backend** :
```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez :
npm run dev
```

✅ **C'est fait !** Le webhook est maintenant prêt.

---

### 📍 ÉTAPE 2 : Créer vos produits (3 min)

1. **Ouvrez l'application web** : http://localhost:3001

2. **Connexion Admin** :
   - Email : `admin@gs-pipeline.com`
   - Mot de passe : `admin123`

3. **Allez dans "Gestion des Produits"** 📦

4. **Cliquez sur "Ajouter un produit"**

5. **Remplissez les informations** :

**Exemple pour "Gaine Tourmaline" :**
```
Code : GAINE_TOURMALINE
Nom : Gaine Tourmaline Amincissante  
Description : Gaine minceur avec tourmaline
Prix : 45000
Stock actuel : 100
Seuil d'alerte : 10
```

⚠️ **IMPORTANT** : Le champ "Code" doit correspondre **exactement** à ce que Make enverra dans `product_key`.

6. **Cliquez sur "Enregistrer"**

7. **Répétez pour chaque produit**

✅ **C'est fait !** Vos produits sont prêts.

---

### 📍 ÉTAPE 3 : Tester l'API (2 min)

**Ouvrez un terminal** et testez que l'API fonctionne :

```bash
curl -X GET \
  http://localhost:5000/api/webhook/test \
  -H "X-API-KEY: VOTRE_CLE_ICI"
```

**Remplacez `VOTRE_CLE_ICI`** par la clé que vous avez mise dans `.env`

**✅ Résultat attendu :**
```json
{
  "success": true,
  "message": "Webhook Make fonctionnel !",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

**❌ Si erreur 401** :
- La clé est incorrecte
- Vérifiez que vous avez bien redémarré le serveur

**Listez les produits disponibles** :
```bash
curl -X GET \
  http://localhost:5000/api/webhook/products \
  -H "X-API-KEY: VOTRE_CLE_ICI"
```

**✅ Résultat attendu :**
```json
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

✅ **C'est fait !** L'API est opérationnelle.

---

### 📍 ÉTAPE 4 : Configurer Make (3 min)

1. **Ouvrez votre scénario Make** (celui d'un produit)

2. **Après le module "Google Sheets"**, **ajoutez un nouveau module** :
   - Type : **HTTP** → **Make a request**

3. **Configuration du module HTTP** :

**URL :**
```
https://votre-domaine.com/api/webhook/make
```
*OU en développement local :*
```
http://localhost:5000/api/webhook/make
```

**Method :** `POST`

**Headers :** Cliquez sur "Add item" (2 fois)

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |
| `X-API-KEY` | `VOTRE_CLE_ICI` |

**Body type :** `Raw`

**Content type :** `JSON (application/json)`

**Request content :** Copiez-collez ceci (adaptez les champs) :

```json
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.form.name}}",
  "customer_phone": "{{1.form.phone}}",
  "customer_city": "{{1.form.city}}",
  "quantity": "{{1.form.quantity}}",
  "source": "PAGE_GAINE_TOURMALINE"
}
```

⚠️ **À adapter** :
- `"GAINE_TOURMALINE"` : Le code **exact** du produit dans l'app
- `{{1.form.xxx}}` : Les champs de votre formulaire

4. **Sauvegardez le scénario**

5. **Testez avec "Run once"**

✅ **C'est fait !** Make est configuré.

---

## 🧪 TEST COMPLET (2 min)

### Test depuis Make :

1. Dans Make, cliquez sur **"Run once"**
2. Remplissez le formulaire de test
3. Vérifiez les modules :
   - ✅ Google Sheets : Ligne ajoutée
   - ✅ HTTP : Status 200 OK

### Vérification dans l'app :

1. Retournez dans l'app web
2. Allez dans **"À appeler"** 📞
3. **✅ Vous devez voir la nouvelle commande !**

**Informations visibles :**
- Nom du client
- Téléphone
- Ville
- Produit
- Montant
- Statut : NOUVELLE

---

## 📋 CHECKLIST FINALE

- [ ] ✅ Clé API ajoutée dans `.env`
- [ ] ✅ Serveur backend redémarré
- [ ] ✅ Test `/api/webhook/test` réussi
- [ ] ✅ Produits créés dans l'app
- [ ] ✅ Module HTTP ajouté dans Make
- [ ] ✅ Headers configurés (Content-Type + X-API-KEY)
- [ ] ✅ Body JSON configuré avec product_key
- [ ] ✅ Test "Run once" réussi
- [ ] ✅ Commande visible dans l'app

---

## ❓ PROBLÈMES FRÉQUENTS

### Erreur 401 Unauthorized

**Cause** : API Key invalide

**Solution** :
1. Vérifiez que `X-API-KEY` est dans les headers Make
2. Vérifiez que la clé dans Make = clé dans `.env`
3. Redémarrez le serveur après modification `.env`

### Erreur 400 Unknown product_key

**Cause** : Le produit n'existe pas

**Solution** :
1. Allez dans "Gestion des Produits"
2. Vérifiez le code exact du produit
3. Corrigez le `product_key` dans Make

### Erreur 400 Données invalides

**Cause** : Champs obligatoires manquants

**Solution** :
Vérifiez que ces champs sont présents :
- `product_key` ✅
- `customer_name` ✅
- `customer_phone` ✅
- `customer_city` ✅

### La commande n'apparaît pas dans l'app

**Cause** : Module HTTP pas configuré ou erreur

**Solution** :
1. Vérifiez les logs Make : Cliquez sur le module HTTP
2. Vérifiez la réponse : Doit être 200 OK
3. Vérifiez le body de la réponse : `"success": true`

---

## 📞 EXEMPLE DE CONFIGURATION COMPLÈTE

### Produit dans l'app :
```
Code : GAINE_TOURMALINE
Nom : Gaine Tourmaline Amincissante
Prix : 45000 XOF
Stock : 100
```

### .env :
```bash
MAKE_WEBHOOK_API_KEY="a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4"
```

### Make - Module HTTP :
```
URL: http://localhost:5000/api/webhook/make
Method: POST

Headers:
  Content-Type: application/json
  X-API-KEY: a3f5e8c9d2b7f4e1a8c6d9b2e5f8c1a4

Body:
{
  "product_key": "GAINE_TOURMALINE",
  "customer_name": "{{1.form.nom}}",
  "customer_phone": "{{1.form.telephone}}",
  "customer_city": "{{1.form.ville}}",
  "quantity": "{{1.form.quantite}}",
  "source": "PAGE_GAINE_TOURMALINE"
}
```

### Résultat :
```
✅ Google Sheets : Ligne ajoutée
✅ App Web : Commande créée
✅ Visible dans "À appeler"
```

---

## 🎯 POUR CHAQUE NOUVEAU PRODUIT

1. **Dans l'app** : Créer le produit avec un code unique
2. **Dans Make** : Dupliquer le scénario
3. **Modifier** : Le `product_key` dans le module HTTP
4. **Tester** : Run once

**C'est simple !** 🚀

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez :
- **`INTEGRATION_MAKE.md`** : Documentation technique complète
- **`routes/webhook.routes.js`** : Code source de l'API

---

## ✅ FÉLICITATIONS !

**Votre intégration Make → App Web est opérationnelle !** 🎉

**Maintenant, chaque commande :**
- ✅ Arrive dans Google Sheets
- ✅ Arrive dans l'App Web
- ✅ Est liée au bon produit
- ✅ Peut être traitée par les appelants
- ✅ Décrémente le stock automatiquement à la livraison

**Profitez de votre pipeline automatisé !** 🚀✨




