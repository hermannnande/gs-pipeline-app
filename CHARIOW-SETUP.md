# Guide d'intégration Chariow — `serum-cerne-paye`

Ce guide explique comment finaliser l'intégration Chariow pour la 3ᵉ landing `serum-cerne-paye`. Le code est déjà en place, il reste à :

1. Créer 3 produits dans Chariow (1 / 2 / 3 flacons) avec prix **déjà réduits de 10 %**
2. Récupérer la clé API et l'URL du Pulse
3. Configurer les variables d'environnement (Vercel + VPS)
4. Ajouter le produit `SERUM_CERNE_PAYE` dans la base obgestion

---

## 1. Vue d'ensemble du flux

```
1. Client clique "Payer Mobile Money" sur /serum-cerne-paye
2. Frontend  -> POST /api/chariow/checkout      (notre backend)
3. Backend   -> POST https://api.chariow.com/v1/checkout  (Chariow API)
4. Backend renvoie checkout_url -> redirection navigateur
5. Client paie sur payment.chariow.com (Wave / Orange / MTN / Moov)
6. Chariow redirige -> /serum-cerne-paye/merci?ref=<sale_id>
7. EN PARALLELE : Chariow envoie une pulse `successful.sale`
   -> POST /api/chariow/webhook
   -> commande creee dans obgestion
        status              = NOUVELLE
        modePaiement        = CHARIOW_MOBILE_MONEY
        referencePayment    = <sale_id>     (idempotence)
        montantPaye         = total
        montantRestant      = 0
        sourcePage          = CHARIOW
   -> notification websocket appelants
   -> Meta CAPI Purchase server-side
```

---

## 2. Création des produits Chariow

### Pré-requis
- Compte Chariow actif avec un store
- Connexion au dashboard : <https://app.chariow.com>

### Pour chaque quantité (1, 2, 3 flacons)

1. **Aller dans Products** → **Add Product**
2. **Type** : `Downloadable` (le plus proche d'un produit physique)
3. **Activer** « Require shipping address » (si Chariow l'autorise pour ce type)
4. **Détails du produit** :

| Champ | 1 flacon | 2 flacons | 3 flacons |
|-------|----------|-----------|-----------|
| Nom | Sérum Anti-Cernes Premium — 1 flacon | Sérum Anti-Cernes Premium — 2 flacons | Sérum Anti-Cernes Premium — 3 flacons |
| Slug | `serum-anti-cerne-1` | `serum-anti-cerne-2` | `serum-anti-cerne-3` |
| Prix obgestion (référence) | 9 900 FCFA | 16 900 FCFA | 24 900 FCFA |
| **Prix Chariow (-10 %)** | **8 910 FCFA** | **15 210 FCFA** | **22 410 FCFA** |
| Devise | XOF (si supporté) ou USD (~16/27/40) | | |

5. **Publier le produit** (un produit non publié renvoie 404 à l'API)
6. **Récupérer le Product ID** (`prd_xxx...`) — visible dans l'URL du dashboard et dans Settings → API

> ⚠️ **Si Chariow ne supporte pas XOF** : créez les produits en USD avec les prix ci-dessous, l'API gérera la conversion automatique :
> - 1 flacon : `15.95 USD`
> - 2 flacons : `27.20 USD`
> - 3 flacons : `40.10 USD`

### Note sur le type "Downloadable"
Pour un produit physique, la doc Chariow recommande d'activer "Require shipping address". Si ce n'est pas possible avec "Downloadable", essayez le type `License` qui autorise les achats répétés sans bloquer (`already_purchased`). Le code est prêt pour les deux.

---

## 3. Récupération de la clé API

1. **Dashboard Chariow** → **Settings** → **API**
2. Cliquer **Generate API Key** (mode `live`)
3. Copier la clé `sk_live_xxx...` (visible une seule fois !)

---

## 4. Configuration du Pulse (webhook)

1. **Dashboard Chariow** → **Automation** → **Pulses** → **Add Pulse**
2. **URL** :
   ```
   https://www.obgestion.com/api/chariow/webhook?secret=<VOTRE_SECRET_ALEATOIRE>
   ```
   Remplacez `<VOTRE_SECRET_ALEATOIRE>` par une chaîne aléatoire de **32+ caractères**
   (ex: `openssl rand -hex 32` ou n'importe quel UUID + suffixe).
3. **Events à activer** : `Successful Sale` (autres optionnels pour le monitoring)
4. **Products** : laisser vide (= tous les produits du store)
5. **Save** puis cliquer **Send Test Event** pour vérifier que le serveur répond `200`

> Le secret doit être **identique** à la variable d'environnement `CHARIOW_WEBHOOK_SECRET` côté serveur.

---

## 5. Variables d'environnement

### Sur Vercel (gs-pipeline-app-2)

Aller dans **Settings → Environment Variables** et ajouter :

```env
CHARIOW_API_KEY=<VOTRE-CLE-API-CHARIOW-COMMENCE-PAR-sk_>
CHARIOW_WEBHOOK_SECRET=<VOTRE-SECRET-ALEATOIRE-32-CHARS-MIN>
FRONTEND_PUBLIC_URL=https://www.obgestion.com
CHARIOW_REQUIRE_SHIPPING=1

CHARIOW_PRODUCT_SERUM_CERNE_PAYE_1=<ID-PRODUIT-CHARIOW-1-FLACON>
CHARIOW_PRODUCT_SERUM_CERNE_PAYE_2=<ID-PRODUIT-CHARIOW-2-FLACONS>
CHARIOW_PRODUCT_SERUM_CERNE_PAYE_3=<ID-PRODUIT-CHARIOW-3-FLACONS>
```

> Si Chariow ne demande PAS d'adresse de livraison, mettez `CHARIOW_REQUIRE_SHIPPING=0` ou supprimez la variable.

### Vérification

Une fois déployé, tester :

```bash
curl https://www.obgestion.com/api/chariow/health
```

Doit renvoyer `api_key_configured: true` et la liste des 3 produits mappés.

---

## 6. Ajout du produit obgestion `SERUM_CERNE_PAYE`

Dans la base obgestion, il faut créer un produit avec le code `SERUM_CERNE_PAYE` pour que le webhook puisse retrouver le produit lors de la création de la commande.

### Option A — Via le dashboard admin
1. Connexion à <https://www.obgestion.com> en admin
2. **Stock → Produits → Ajouter**
3. Champs :
   - **Code** : `SERUM_CERNE_PAYE`
   - **Nom** : `Sérum Anti-Cernes Premium (Mobile Money)`
   - **Prix unitaire** : `9900`
   - **Prix 2 unités** : `16900`
   - **Prix 3 unités** : `24900`
   - **Stock initial** : selon votre stock physique
   - **Actif** : oui

### Option B — Script seed (recommandé)
Lancez le script automatique :

```bash
node scripts/seed-serum-cerne-paye-product.mjs
```

Ce script crée le produit s'il n'existe pas, en clonant le pricing de `SERUM_CERNE`.

---

## 7. Test end-to-end

### Test du checkout
1. Aller sur <https://www.obgestion.com/serum-cerne-paye>
2. Cliquer un CTA → modal s'ouvre
3. Sélectionner **« Payer Mobile Money »**
4. Remplir nom, email, ville, téléphone
5. Cliquer **« Payer Mobile Money »**
6. Le navigateur redirige vers `payment.chariow.com`
7. Effectuer un paiement de test (ou réel)

### Test du webhook
Après un paiement réussi :
1. Vérifier dans **Chariow → Automation → Pulses → Logs** que la pulse a été envoyée et acceptée (200)
2. Vérifier dans **obgestion → Appelant → Commandes** qu'une commande a été créée avec :
   - Statut : `NOUVELLE`
   - Mode paiement : `CHARIOW_MOBILE_MONEY`
   - Référence paiement : `sal_xxx...`
   - Montant payé = montant total
   - Montant restant = 0
3. Vérifier la notification websocket sur l'admin connecté

### Test idempotence
Cliquer **Send Test Event** plusieurs fois sur le même Pulse — la commande ne doit être créée qu'une seule fois (les autres tentatives loguent `already_processed`).

---

## 8. Dépannage

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `Configuration produit manquante` | Variable d'env `CHARIOW_PRODUCT_..._N` non définie | Ajouter la variable et redéployer |
| `Reponse Chariow inattendue` | Produit non publié dans Chariow | Vérifier que le produit est `published` |
| `Validation failed: email` | Email invalide envoyé | Le frontend devrait déjà bloquer, vérifier le DOM |
| `401 Unauthorized` sur webhook | Secret incorrect ou manquant | Vérifier que `CHARIOW_WEBHOOK_SECRET` correspond au `?secret=` de l'URL configurée dans Chariow |
| Webhook 200 mais aucune commande | Produit `SERUM_CERNE_PAYE` manquant en DB | Lancer `scripts/seed-serum-cerne-paye-product.mjs` |
| Le client paie mais pas de redirection | `redirect_url` non whitelistée chez Chariow | Vérifier dans Chariow Settings → Allowed redirect URLs que `obgestion.com` est autorisé |

### Vérifier les logs Vercel
```bash
vercel logs --follow
```
Chercher les lignes `[chariow]` qui tracent toute l'intégration.

---

## 9. Checklist finale

- [ ] 3 produits créés et publiés dans Chariow
- [ ] API key Chariow récupérée
- [ ] Pulse Chariow configuré avec secret partagé
- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Variables d'environnement ajoutées sur le VPS (si proxy API)
- [ ] Produit `SERUM_CERNE_PAYE` créé dans obgestion
- [ ] Frontend déployé sur le VPS (`npm run build && node scripts/deploy-vps.mjs`)
- [ ] Backend déployé sur Vercel
- [ ] `.htaccess` racine du VPS mis à jour avec `serum-cerne-paye` dans la regex (déjà fait dans `_vps-root-htaccess.txt`, mais il faut le pousser : `node scripts/push-htaccess.mjs _vps-root-htaccess.txt`)
- [ ] Test end-to-end passé : commande Mobile Money → page merci → commande dans obgestion

---

## 10. Architecture des fichiers ajoutés

```
frontend/
├── src/
│   ├── pages/public/
│   │   └── SerumCernePayeLanding.tsx       (clone visuel exact de SerumCerneTk)
│   ├── components/order/
│   │   ├── OrderModalSerumCernePaye.tsx    (modal avec sélecteur Cash / Mobile Money)
│   │   └── OrderModalDispatcher.tsx        (modifié : case 'serum-cerne-paye')
│   ├── hooks/
│   │   ├── useChariowCheckout.ts           (NEW: hook pour appel /api/chariow/checkout)
│   │   └── useLandingSlug.ts               (modifié : + 'serum-cerne-paye')
│   └── pages/public/
│       └── LandingRouter.tsx               (modifié : route 'serum-cerne-paye')
routes/
└── chariow.routes.js                        (NEW: POST /checkout + POST /webhook + GET /health)
app.js                                       (modifié : app.use('/api/chariow', chariowRoutes))
server.js                                    (modifié : idem)
_vps-root-htaccess.txt                       (modifié : regex landings + 'serum-cerne-paye')
scripts/
└── seed-serum-cerne-paye-product.mjs       (NEW: cree le produit SERUM_CERNE_PAYE en DB)
```
