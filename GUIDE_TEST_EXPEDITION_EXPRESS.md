# 🧪 GUIDE DE TEST - EXPÉDITION & EXPRESS

## ✅ LISTE DE VÉRIFICATION COMPLÈTE

---

## 📋 ÉTAPE 1 : VÉRIFIER LE DÉPLOIEMENT RAILWAY

### A. Vérifier que le backend est déployé
1. Allez sur https://railway.app
2. Connectez-vous à votre compte
3. Sélectionnez le projet **GS Pipeline**
4. Cliquez sur le service **Backend**
5. Vérifiez que le statut est **"Active"** (vert) ✅

### B. Vérifier les logs de déploiement
1. Dans Railway → Backend → **"Deployments"**
2. Cliquez sur le **dernier déploiement**
3. Vérifiez les logs, vous devez voir :
   ```
   Applying migration `20251206134324_add_expedition_express`
   All migrations have been successfully applied.
   🚀 Serveur démarré sur le port 8080
   ```

### C. Tester l'API
Ouvrez votre navigateur et allez sur :
```
https://gs-pipeline-app-production.up.railway.app
```

Vous devriez voir :
```json
{
  "message": "API GS Pipeline - Back-office e-commerce",
  "version": "1.0.0",
  "status": "running"
}
```

✅ Si vous voyez ce message → Backend OK !

---

## 📋 ÉTAPE 2 : VÉRIFIER LE DÉPLOIEMENT VERCEL

### A. Vérifier que le frontend est déployé
1. Allez sur https://vercel.com
2. Connectez-vous
3. Sélectionnez le projet **gs-pipeline-app**
4. Vérifiez que le dernier déploiement est **"Ready"** (vert) ✅

### B. Tester le site
Ouvrez votre navigateur et allez sur :
```
https://obgestion.com
```

✅ Si la page de connexion s'affiche → Frontend OK !

---

## 📋 ÉTAPE 3 : TESTER LA FONCTIONNALITÉ EXPÉDITION

### A. Se connecter en tant qu'Appelant
1. Allez sur **https://obgestion.com**
2. Connectez-vous avec :
   - **Email** : `appelant@gs-pipeline.com`
   - **Mot de passe** : `appelant123`

### B. Créer une commande test (via Google Apps Script)
1. Soumettez un formulaire de commande sur une de vos pages
2. Attendez que la commande arrive dans l'application

### C. Tester EXPÉDITION
1. Dans le menu, cliquez sur **"Commandes à appeler"**
2. Vous devriez voir les nouvelles commandes
3. Cliquez sur **"Traiter l'appel"** sur une commande
4. ✅ **VÉRIFIEZ** que vous voyez ces boutons :
   - ✅ Commande validée (Livraison locale)
   - 📦 **EXPÉDITION (Paiement 100%)**
   - ⚡ **EXPRESS (Paiement 10%)**

5. Cliquez sur **"📦 EXPÉDITION (Paiement 100%)"**
6. ✅ **VÉRIFIEZ** que le modal s'ouvre avec :
   - Nom du client
   - Ville
   - Produit
   - Montant total (9900 FCFA)
   - Champ **"Mode de paiement"**
   - Champ **"Référence de transaction"**
   - Champ **"Note"**

7. **REMPLISSEZ LE FORMULAIRE** :
   - Mode de paiement : **Orange Money**
   - Référence : **TRX123456**
   - Note : **Test expédition**

8. Cliquez sur **"Confirmer EXPÉDITION"**

9. ✅ **VÉRIFIEZ** :
   - Message de succès : "✅ Commande transférée en EXPÉDITION"
   - La commande disparaît de la liste "À appeler"

### D. Vérifier la commande EXPÉDITION
1. Déconnectez-vous
2. Reconnectez-vous en tant qu'**Admin** :
   - **Email** : `admin@gs-pipeline.com`
   - **Mot de passe** : `admin123`

3. Allez dans **"Toutes les commandes"**
4. ✅ **VÉRIFIEZ** que vous voyez la commande avec :
   - Statut : **"Expédition"** (badge bleu)
   - Montant affiché

---

## 📋 ÉTAPE 4 : TESTER LA FONCTIONNALITÉ EXPRESS

### A. Créer une autre commande test
1. Soumettez un autre formulaire de commande
2. Reconnectez-vous en tant qu'**Appelant**

### B. Tester EXPRESS
1. Allez dans **"Commandes à appeler"**
2. Cliquez sur **"Traiter l'appel"**
3. Cliquez sur **"⚡ EXPRESS (Paiement 10%)"**

4. ✅ **VÉRIFIEZ** que le modal s'ouvre avec :
   - Nom du client
   - Ville
   - Produit
   - **Montant total** : 9900 FCFA
   - **Acompte (10%)** : 990 FCFA
   - **À payer au retrait (90%)** : 8910 FCFA
   - Champ **"Montant payé"** (pré-rempli avec 990)
   - Champ **"Mode de paiement"**
   - Champ **"Référence de transaction"**
   - Champ **"Agence de retrait"** ← IMPORTANT
   - Champ **"Note"**

5. **REMPLISSEZ LE FORMULAIRE** :
   - Montant payé : **990** (ou plus si le client paie plus que 10%)
   - Mode de paiement : **MTN Money**
   - Référence : **TRX789012**
   - Agence : **Agence Porto-Novo**
   - Note : **Test express**

6. Cliquez sur **"Confirmer EXPRESS"**

7. ✅ **VÉRIFIEZ** :
   - Message de succès : "✅ Commande transférée en EXPRESS"
   - La commande disparaît de la liste

### C. Vérifier la commande EXPRESS
1. Reconnectez-vous en tant qu'**Admin**
2. Allez dans **"Toutes les commandes"**
3. ✅ **VÉRIFIEZ** que vous voyez la commande EXPRESS avec :
   - Statut : **"Express"** (badge orange/ambre)

---

## 📋 ÉTAPE 5 : VÉRIFIER LES DONNÉES EN BASE

### A. Vérifier via Railway
1. Railway → **Postgres** (base de données)
2. Cliquez sur **"Data"**
3. Sélectionnez la table **"orders"**
4. ✅ **VÉRIFIEZ** que vous voyez les nouvelles colonnes :
   - `deliveryType`
   - `montantPaye`
   - `montantRestant`
   - `modePaiement`
   - `referencePayment`
   - `agenceRetrait`

5. ✅ **VÉRIFIEZ** les données de la commande EXPÉDITION :
   - `status` = **"EXPEDITION"**
   - `deliveryType` = **"EXPEDITION"**
   - `montantPaye` = **9900**
   - `montantRestant` = **0**
   - `modePaiement` = **"Orange Money"**
   - `referencePayment` = **"TRX123456"**

6. ✅ **VÉRIFIEZ** les données de la commande EXPRESS :
   - `status` = **"EXPRESS"**
   - `deliveryType` = **"EXPRESS"**
   - `montantPaye` = **990**
   - `montantRestant` = **8910**
   - `modePaiement` = **"MTN Money"**
   - `referencePayment` = **"TRX789012"**
   - `agenceRetrait` = **"Agence Porto-Novo"**

---

## 📋 ÉTAPE 6 : TESTER LES LABELS ET COULEURS

1. Allez dans **"Toutes les commandes"** (en Admin)
2. ✅ **VÉRIFIEZ** les badges de statut :
   - **"Expédition"** → Badge **BLEU**
   - **"Express"** → Badge **ORANGE/AMBRE**
3. Les couleurs doivent être différentes des autres statuts

---

## 📋 ÉTAPE 7 : TESTER L'INTÉGRATION AVEC GOOGLE APPS SCRIPT

### A. Soumettre une vraie commande
1. Allez sur une de vos pages de vente (avec formulaire Google)
2. Remplissez le formulaire avec :
   - Nom : **Test Client**
   - Téléphone : **0700000000**
   - Ville : **Parakou** (ville éloignée)
   - Produit : Un de vos produits existants
3. Soumettez le formulaire

### B. Vérifier la réception
1. Attendez 10-30 secondes
2. Reconnectez-vous sur **obgestion.com** en Appelant
3. Allez dans **"Commandes à appeler"**
4. ✅ **VÉRIFIEZ** que la nouvelle commande apparaît
5. Traitez-la en EXPÉDITION ou EXPRESS

---

## ✅ CHECKLIST FINALE

| Fonctionnalité | Statut |
|----------------|--------|
| ✅ Backend Railway déployé | ⬜ |
| ✅ Migration appliquée | ⬜ |
| ✅ Frontend Vercel déployé | ⬜ |
| ✅ Site accessible sur obgestion.com | ⬜ |
| ✅ Connexion Appelant fonctionne | ⬜ |
| ✅ Bouton EXPÉDITION visible | ⬜ |
| ✅ Bouton EXPRESS visible | ⬜ |
| ✅ Modal EXPÉDITION s'ouvre | ⬜ |
| ✅ Modal EXPRESS s'ouvre | ⬜ |
| ✅ Création EXPÉDITION fonctionne | ⬜ |
| ✅ Création EXPRESS fonctionne | ⬜ |
| ✅ Statut "Expédition" s'affiche | ⬜ |
| ✅ Statut "Express" s'affiche | ⬜ |
| ✅ Données en base correctes | ⬜ |
| ✅ Intégration Google Forms OK | ⬜ |

---

## 🐛 EN CAS DE PROBLÈME

### Problème 1 : Les boutons n'apparaissent pas
**Solution :**
- Videz le cache du navigateur (Ctrl + Shift + R)
- Attendez 5 minutes que Vercel finisse le déploiement

### Problème 2 : Erreur 500 lors de la création EXPÉDITION/EXPRESS
**Solution :**
- Vérifiez les logs Railway
- Vérifiez que la migration s'est bien appliquée
- Contactez-moi avec le message d'erreur exact

### Problème 3 : Les statuts ne s'affichent pas correctement
**Solution :**
- Rechargez la page (F5)
- Videz le cache
- Vérifiez que le frontend est bien déployé

---

## 📞 SUPPORT

Si vous rencontrez un problème :
1. Notez le message d'erreur exact
2. Faites une capture d'écran
3. Vérifiez les logs Railway
4. Contactez-moi avec ces informations

---

**Bonne chance pour les tests ! 🚀**







