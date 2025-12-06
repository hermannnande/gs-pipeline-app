# 🌐 Configuration du domaine obgestion.com

## ✅ ÉTAPES DÉJÀ EFFECTUÉES

✔️ Configuration CORS mise à jour pour accepter `obgestion.com` et `www.obgestion.com`
✔️ Backend Railway prêt pour le nouveau domaine

---

## 📋 ÉTAPES À SUIVRE

### ÉTAPE 1 : Configuration DNS chez LWS

1. **Connectez-vous à votre espace client LWS** : https://panel.lws.fr/
2. Allez dans **"Mes domaines"** → **"obgestion.com"** → **"Zone DNS"**
3. **Supprimez** tous les anciens enregistrements A ou CNAME pour `@` et `www`
4. **Ajoutez** ces nouveaux enregistrements :

```
Type: A
Nom: @
Valeur: 76.76.21.21
TTL: 3600

Type: A
Nom: www
Valeur: 76.76.21.21
TTL: 3600
```

**Note :** Si LWS ne vous permet pas d'utiliser des enregistrements A, utilisez CNAME :
```
Type: CNAME
Nom: www
Valeur: cname.vercel-dns.com
TTL: 3600
```

5. **Sauvegardez** les modifications

---

### ÉTAPE 2 : Configuration sur Vercel

1. **Connectez-vous à Vercel** : https://vercel.com
2. Sélectionnez le projet **"gs-pipeline-app"**
3. Allez dans **"Settings"** → **"Domains"**
4. Cliquez sur **"Add Domain"**
5. Tapez : `obgestion.com` et cliquez sur **"Add"**
6. Répétez pour `www.obgestion.com`
7. Vercel va vérifier les DNS automatiquement
8. Une fois validé, Vercel génère automatiquement un **certificat SSL** (HTTPS)

---

### ÉTAPE 3 : Vérifier la propagation DNS

⏰ **Temps d'attente : 5 minutes à 48 heures** (généralement 1-2 heures)

Vérifiez sur : https://dnschecker.org
- Entrez : `obgestion.com`
- Vérifiez que l'IP `76.76.21.21` apparaît

---

### ÉTAPE 4 : Mettre à jour Google Apps Script

Une fois le domaine actif, mettez à jour l'URL dans votre script :

**ANCIEN :**
```javascript
const WEB_APP_CONFIG = {
  API_URL: 'https://gs-pipeline-app-production.up.railway.app/api/webhook/make',
  // ...
};
```

**NOUVEAU (optionnel, mais recommandé) :**
Vous pouvez créer un sous-domaine pour l'API (exemple: `api.obgestion.com`)
ou garder l'URL Railway actuelle (aucun changement nécessaire).

---

## ⚠️ RISQUES ET IMPACTS

### ❌ CE QUI N'EST PAS AFFECTÉ :

✅ **Base de données** : Reste sur Railway, aucun changement
✅ **Commandes existantes** : Toutes conservées intactes
✅ **Google Apps Script** : Continue de fonctionner normalement
✅ **Backend API** : Reste sur Railway (https://gs-pipeline-app-production.up.railway.app)
✅ **Données** : Aucune perte de données

### ✅ CE QUI CHANGE :

🌐 **URL du site** :
- Avant : `https://gs-pipeline-app.vercel.app`
- Après : `https://obgestion.com`

🔒 **Sécurité** : Certificat SSL automatique (HTTPS)

---

## 🎯 AVANTAGES DU DOMAINE PERSONNALISÉ

✅ **Professionnel** : obgestion.com au lieu de gs-pipeline-app.vercel.app
✅ **SSL gratuit** : Certificat HTTPS automatique
✅ **Branding** : Votre propre nom de domaine
✅ **SEO** : Meilleur référencement
✅ **Confiance** : Les clients font plus confiance à un domaine personnalisé

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. **Vérifiez les DNS** sur https://dnschecker.org
2. **Attendez** la propagation DNS (peut prendre jusqu'à 48h)
3. **Contactez le support LWS** si les DNS ne se configurent pas
4. **Vérifiez sur Vercel** que le domaine est bien validé

---

## 🚀 APRÈS LA CONFIGURATION

Une fois le domaine configuré et actif :

1. ✅ Votre site sera accessible sur **https://obgestion.com**
2. ✅ L'ancien lien Vercel continuera de fonctionner
3. ✅ Les commandes continueront d'arriver normalement
4. ✅ Tout l'historique est conservé

---

## 📊 RÉCAPITULATIF TECHNIQUE

| Élément | URL |
|---------|-----|
| **Site web (Frontend)** | https://obgestion.com |
| **API Backend** | https://gs-pipeline-app-production.up.railway.app |
| **Base de données** | Railway PostgreSQL (interne) |
| **Google Apps Script** | Script existant (aucun changement) |

---

**Note :** Vous pouvez effectuer ces changements sans risque. Si quelque chose ne fonctionne pas, l'ancien lien Vercel restera toujours accessible.

