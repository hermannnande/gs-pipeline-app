# Guide d'intégration Paystack — `serum-cerne-paye`

Ce guide explique comment activer la nouvelle intégration **Paystack** (qui remplace Chariow) pour les paiements Mobile Money + Cartes sur la landing `serum-cerne-paye`.

---

## 1. Pourquoi Paystack ?

Paystack est mieux adapté que Chariow à ton cas Côte d'Ivoire :

| Critère | Chariow | Paystack |
|---|---|---|
| Devise CIV | XOF / USD selon support | **XOF natif** |
| Mapping produits | 3 IDs à configurer par produit | **Pas de mapping** (montant libre) |
| Webhook signature | Secret en query string | **HMAC SHA512** dans header |
| Verify endpoint | Pas dispo | **Disponible** |
| Mobile Money | Wave / Orange / MTN / Moov | Wave / Orange / MTN |
| UX Mobile Money | Redirection navigateur | **Charge API native** (le client reste sur ta page) |
| Refunds | Pas dispo facilement | **API /refund** native |

Dans notre intégration, on utilise les **2 méthodes** :

- **Mobile Money** → `Charge API` natif (le client ne quitte JAMAIS la landing — il valide sur son téléphone)
- **Carte bancaire** *(optionnel)* → flux Redirect classique (`Initialize Transaction` + `authorization_url`)

---

## 2. Vue d'ensemble du flux

### Mobile Money (recommandé)

```
1. Client clique "Payer Mobile Money" sur /serum-cerne-paye
2. Modal s'ouvre -> client saisit nom, email, ville, telephone, operateur
3. Frontend  -> POST /api/paystack/charge       (notre backend)
4. Backend   -> POST https://api.paystack.co/charge
                avec { email, amount * 100, currency: 'XOF',
                       mobile_money: { phone, provider: 'wave'|'orange'|'mtn' } }
5. Paystack envoie un PUSH au telephone du client
6. Frontend affiche un overlay "Validez sur votre telephone"
7. Frontend POLL toutes les 4s vers /api/paystack/charge/:reference
8. Le client valide -> webhook charge.success -> commande creee dans obgestion
9. Polling detecte status='success' -> redirige vers /serum-cerne-paye/merci?ref=pst_xxx
```

### Carte bancaire (Redirect)

```
1. Client clique "Payer par carte" sur /serum-cerne-paye
2. Frontend  -> POST /api/paystack/init-transaction
3. Backend   -> POST https://api.paystack.co/transaction/initialize
                avec { email, amount, currency: 'XOF', callback_url, channels: ['card'] }
4. Paystack renvoie authorization_url -> frontend redirige le navigateur
5. Client paie sur checkout.paystack.com
6. Paystack redirige vers /serum-cerne-paye/merci?reference=pst_xxx
7. EN PARALLELE : webhook charge.success -> commande creee
```

---

## 3. Création du compte Paystack

1. **Inscription** : <https://dashboard.paystack.com/#/signup>
2. **Activer la Côte d'Ivoire** dans Settings → Business si pas déjà fait
3. **Activer le Mobile Money** dans Settings → Preferences
4. **Activer les channels Cartes** (Visa / Mastercard) si tu veux le flux B

> En mode **test**, tout marche directement sans aucune validation business.

---

## 4. Récupération des clés API

1. **Dashboard Paystack** → **Settings** → **API Keys & Webhooks**
2. Tu y trouves :
   - **Secret key** (`sk_test_xxx` ou `sk_live_xxx`) — backend uniquement, **jamais en frontend**
   - **Public key** (`pk_test_xxx` ou `pk_live_xxx`) — peut être utilisée en frontend (Inline JS)

> ⚠️ **Sécurité** : ne committe JAMAIS la `sk_live_*` dans git. Stocke-la uniquement dans Vercel + le `.env.paystack.local` (gitignored).

---

## 5. Configuration du Webhook

1. **Dashboard Paystack** → **Settings** → **API Keys & Webhooks**
2. **Webhook URL** : `https://www.obgestion.com/api/paystack/webhook`
3. **Pas de secret partagé en URL** — la signature `x-paystack-signature` (HMAC SHA512) signée avec ta `sk_live_*` suffit.

> Notre backend vérifie automatiquement la signature dans `routes/paystack.routes.js`. Une signature invalide → 401 Unauthorized.

### Test du webhook depuis le dashboard

Dashboard Paystack → API Keys & Webhooks → bouton "Test Webhook" : un payload de test est envoyé, ton serveur doit répondre 200 OK.

---

## 6. Configuration des variables d'environnement

### Méthode A — Script automatique (recommandée)

```bash
node scripts/setup-paystack-env.mjs
```

Le script demande tes 2 clés et les pousse sur les projets Vercel `gs-pipeline-app` et `gs-pipeline-app-2`. Il sauvegarde aussi `.env.paystack.local` (gitignored) pour référence.

### Méthode B — Manuelle via dashboard Vercel

`Settings → Environment Variables` → ajouter :

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxx
FRONTEND_PUBLIC_URL=https://www.obgestion.com
```

### Vérification

Une fois déployé :

```bash
curl https://www.obgestion.com/api/paystack/health
```

Doit renvoyer `secret_key_configured: true`.

---

## 7. (Optionnel) IP Whitelisting côté Paystack

Pour limiter l'usage de ta `sk_live_*` à des IPs précises :

1. **Dashboard Paystack** → **Settings** → **API Keys** → **IP Allowlist**
2. Ajouter l'IP publique de ton serveur Vercel (visible dans les logs) et celle de ton VPS

> Tu peux whitelister jusqu'à 10 IPs. Recommandé en production.

---

## 8. (Optionnel) IP Whitelisting côté serveur

Pour bloquer les appels webhook qui ne viennent pas de Paystack, whiteliste leurs 3 IPs :

```
52.31.139.75
52.49.173.169
52.214.14.220
```

Dans notre backend on vérifie déjà la signature HMAC, donc ce n'est pas critique, mais c'est une couche supplémentaire.

---

## 9. Architecture des fichiers

### Backend

```
routes/paystack.routes.js          (NEW) - 7 endpoints :
  POST /charge                     -> Mobile Money DIRECT
  POST /init-transaction           -> Carte / Redirect
  GET  /charge/:reference          -> Polling pour pending
  GET  /verify/:reference          -> Verify cote serveur (filet de securite)
  POST /submit-otp                 -> Si Paystack demande un OTP
  POST /webhook                    -> charge.success -> commande obgestion
  GET  /health                     -> Verif config

app.js + server.js                 (modif) - app.use('/api/paystack', paystackRoutes)
```

### Frontend

```
frontend/src/hooks/
  usePaystackCheckout.ts           (NEW) - chargeMobileMoney + redirectToCard +
                                           submitOtp + polling automatique

frontend/src/components/order/
  OrderModalSerumCernePaye.tsx     (modif) - utilise usePaystackCheckout au lieu
                                             de useChariowCheckout, ajoute le
                                             selecteur d'operateur Wave/Orange/MTN
                                             et l'overlay "Validez sur votre tel"
  PaymentChoicePopup.tsx           (modif) - rename mode 'chariow' -> 'paystack',
                                             rename prop chariowPrice -> paystackPrice

frontend/src/pages/public/
  SerumCernePayeLanding.tsx        (modif) - retire CHARIOW_PRODUCT_URLS,
                                             pointe vers le modal au lieu de
                                             rediriger directement
  SerumCernePayeThankYou.tsx       (modif) - lit ?ref= au lieu de ?sale_id=,
                                             event_id pixel base sur la ref
                                             Paystack
  ThankYouRouter.tsx               (modif) - detecte refs Paystack 'pst_*' ET
                                             refs Chariow legacy 'sal_*'
```

### Config

```
.env.example                       (modif) - ajout PAYSTACK_SECRET_KEY/PUBLIC_KEY
scripts/setup-paystack-env.mjs     (NEW)   - push ENV sur Vercel
PAYSTACK-SETUP.md                  (NEW)   - cette doc
```

### DB

**Aucune migration Prisma nécessaire** — `Order.modePaiement` est un champ String, on stocke `'PAYSTACK_MOBILE_MONEY'` ou `'PAYSTACK_CARD'`.

---

## 10. Tests end-to-end

### Test mode (sans vraie transaction)

Mets `PAYSTACK_SECRET_KEY=sk_test_...` et `PAYSTACK_PUBLIC_KEY=pk_test_...`

#### Mobile Money — Orange CIV

| Champ | Valeur |
|---|---|
| Téléphone | `0700000000` |
| Provider | `orange` |
| OTP | `1234` (si demandé) |

#### Carte bancaire (méthode B uniquement)

| Numéro | CVV | Expiry | Description |
|---|---|---|---|
| `4084 0840 8408 4081` | `408` | `03/27` | Succès, no validation |
| `5078 5078 5078 5078 12` | `081` | `03/27` | Succès, PIN `1111` |
| `4084 0800 0000 5408` | `001` | `03/27` | Échec |

### Live mode

Refais les mêmes étapes avec `sk_live_*`. Les vrais paiements sont prélevés.

### Vérifications après chaque test

```powershell
# Health check
curl https://www.obgestion.com/api/paystack/health

# 8 slugs publiques toujours servis
$slugs = @('creme-anti-verrue','creme-verrue-tk','spraydouleurtk','creme-ongle-incarne','chaussette-compression','patchdouleurtk','patchdouleurfb','crememinceurfb','serum-cerne-paye')
foreach ($s in $slugs) {
  $code = curl.exe -s -o NUL -w "%{http_code}" "https://obrille.com/$s"
  Write-Host "  $s -> $code"
}

# Verifier qu'une transaction de test apparait dans la DB
node -e "(async()=>{const{prisma}=await import('./utils/prisma.js');const r=await prisma.order.findMany({where:{modePaiement:{startsWith:'PAYSTACK_'}},take:5,orderBy:{id:'desc'}});console.log(r);})()"
```

---

## 11. Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| `secret_key_configured: false` au /health | ENV pas pushed sur Vercel | Lancer `setup-paystack-env.mjs` puis redéployer |
| `401 Unauthorized` sur webhook | Signature invalide | Vérifier que `PAYSTACK_SECRET_KEY` est exactement la même que dans le dashboard |
| `Operateur invalide` | provider non reconnu | Doit être `wave`, `orange` ou `mtn` (lowercase) |
| Le polling ne se termine jamais | Webhook pas reçu | Vérifier l'URL webhook dans le dashboard. Test avec "Test Webhook" |
| `validation_error` sur /charge | Email manquant ou mal formé | Le frontend doit forcer le champ email pour Mobile Money |
| `Reference invalide` sur GET /charge/:ref | Ref ne commence pas par `pst_` | Le polling ne polle que les refs Paystack — vérifier que `generatePaystackReference()` est utilisée |
| Pixel Meta double-comptage | event_id différent côté browser et CAPI | Vérifier que les 2 utilisent `purchase_<reference>` (ref = pst_xxx) |
| Page de remerciement = cash au lieu de Paystack | ThankYouRouter ne détecte pas la ref | Vérifier que `?ref=pst_*` est bien dans l'URL après paiement |

### Logs à vérifier

```bash
# Vercel
vercel logs --follow

# Chercher :
[paystack] /charge erreur
[paystack/webhook] event=charge.success
[paystack] Commande creee
```

---

## 12. Migration depuis Chariow (rollback)

Le code Chariow reste **intact** dans le repo : `routes/chariow.routes.js`, `useChariowCheckout.ts`, etc. Si besoin de rollback :

```javascript
// Dans frontend/src/components/order/OrderModalSerumCernePaye.tsx
import { useChariowCheckout } from '../../hooks/useChariowCheckout';
// ... remplacer usePaystackCheckout
```

Et dans `PaymentChoicePopup.tsx` :

```typescript
export type PaymentMode = 'cash' | 'chariow'; // au lieu de 'paystack'
```

Les commandes legacy avec `modePaiement === 'CHARIOW_MOBILE_MONEY'` continuent de fonctionner sans changement (le badge "DÉJÀ PAYÉ" les détecte).

---

## 13. Checklist finale

- [ ] Compte Paystack créé et CIV activée
- [ ] Mobile Money + Cartes activés dans le dashboard Paystack
- [ ] Webhook configuré : `https://www.obgestion.com/api/paystack/webhook`
- [ ] `setup-paystack-env.mjs` lancé → ENV pushed sur Vercel
- [ ] Backend redéployé (`git push origin main`)
- [ ] Frontend buildé et déployé (`npm run build` + `deploy-vps.mjs`)
- [ ] `/api/paystack/health` répond `secret_key_configured: true`
- [ ] Test E2E Mobile Money réussi (en test mode avec Orange `0700000000`)
- [ ] Commande créée dans obgestion (`modePaiement = PAYSTACK_MOBILE_MONEY`)
- [ ] Page merci Paystack affichée correctement (`/serum-cerne-paye/merci?ref=pst_xxx`)
- [ ] Pixel Meta Purchase fired + dédupliqué avec CAPI server-side
- [ ] (Optionnel) IP whitelisting Paystack activé en production

---

## 14. Pour aller plus loin

### Activer Paystack sur les autres landings

Aucune config produit nécessaire (montant libre). Il suffit de :

1. Dans la landing produit, importer `usePaystackCheckout`
2. Ajouter `PIXEL_BY_SLUG[<nouveau-slug>] = '<pixel_id>'` dans `routes/paystack.routes.js`
3. Optionnellement : dupliquer `PaymentChoicePopup` + `OrderModalXxxPaye` pour offrir le choix Mobile Money / Cash

### Refunds

Endpoint Paystack `POST /refund` disponible :

```javascript
await paystackFetch('/refund', {
  method: 'POST',
  body: JSON.stringify({ transaction: 'pst_xxx', amount: 990000 }),
});
```

À ajouter dans `routes/paystack.routes.js` quand tu en auras besoin.

### Sauvegardes

Avant chaque déploiement majeur :
- Tag git de sauvegarde
- Snapshot DB (Supabase a des backups automatiques)
- Archive du `.htaccess` du VPS

---

## Licence interne — usage GS Pipeline uniquement.
