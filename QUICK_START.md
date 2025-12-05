# 🚀 Démarrage rapide - GS Pipeline

Guide d'installation en 5 minutes pour tester l'application localement.

## ⚡ Installation express

### 1️⃣ Backend (Terminal 1)

```bash
# Installer les dépendances
npm install

# Créer le fichier .env
echo 'DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gs_pipeline?schema=public"
JWT_SECRET="votre_secret_jwt_change_moi"
PORT=5000
NODE_ENV=development' > .env

# ⚠️ IMPORTANT : Modifier DATABASE_URL avec vos identifiants PostgreSQL

# Initialiser la base de données
npx prisma generate
npx prisma migrate dev --name init

# Insérer les données de test
npm run prisma:seed

# Démarrer le serveur
npm run dev
```

✅ Le backend est prêt sur **http://localhost:5000**

### 2️⃣ Frontend (Terminal 2)

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Créer le fichier .env
echo 'VITE_API_URL=http://localhost:5000/api' > .env

# Démarrer l'application
npm run dev
```

✅ Le frontend est prêt sur **http://localhost:3000**

## 🎮 Connexion

Ouvrez http://localhost:3000 et connectez-vous avec :

### Admin complet
- **Email** : `admin@gs-pipeline.com`
- **Mot de passe** : `admin123`

### Gestionnaire
- **Email** : `gestionnaire@gs-pipeline.com`
- **Mot de passe** : `gestionnaire123`

### Appelant
- **Email** : `appelant@gs-pipeline.com`
- **Mot de passe** : `appelant123`

### Livreur
- **Email** : `livreur@gs-pipeline.com`
- **Mot de passe** : `livreur123`

## 🧪 Tester le webhook

Pour tester la création de commande via webhook :

```bash
curl -X POST http://localhost:5000/api/webhook/order \
  -H "Content-Type: application/json" \
  -d '{
    "clientNom": "Test Client",
    "clientTelephone": "+212600000000",
    "clientVille": "Casablanca",
    "produitNom": "Produit Test",
    "quantite": 1,
    "montant": 299.00
  }'
```

## 📊 Scénario de test complet

1. **Connectez-vous en Admin** → Créez des utilisateurs supplémentaires si besoin
2. **Testez le webhook** → Créez quelques commandes de test
3. **Connectez-vous en Appelant** → Traitez les commandes (validez-en quelques-unes)
4. **Connectez-vous en Gestionnaire** → Assignez les commandes validées à un livreur
5. **Connectez-vous en Livreur** → Marquez les livraisons comme effectuées
6. **Retournez en Admin** → Consultez les statistiques globales

## 🛠️ Commandes utiles

### Backend

```bash
# Voir les logs en temps réel
npm run dev

# Ouvrir l'interface graphique de la base de données
npm run prisma:studio

# Réinitialiser complètement la base
npx prisma migrate reset

# Créer une nouvelle migration
npx prisma migrate dev --name ma_modification
```

### Frontend

```bash
# Démarrer en dev
npm run dev

# Build pour production
npm run build

# Vérifier le code
npm run lint
```

## 🐛 Problèmes fréquents

### Le backend ne démarre pas
- ✅ Vérifiez que PostgreSQL est bien installé et démarré
- ✅ Vérifiez les identifiants dans `DATABASE_URL`
- ✅ Vérifiez que le port 5000 n'est pas déjà utilisé

### Le frontend ne se connecte pas à l'API
- ✅ Vérifiez que le backend tourne sur le port 5000
- ✅ Vérifiez le fichier `frontend/.env`
- ✅ Regardez la console du navigateur pour les erreurs

### Erreur de connexion
- ✅ Vérifiez que vous avez bien exécuté `npm run prisma:seed`
- ✅ Vérifiez que la base de données contient des utilisateurs

### Erreur "Module not found"
- ✅ Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`

## 📱 Responsive

L'application est optimisée pour :
- 💻 Desktop (recommandé pour Admin/Gestionnaire)
- 📱 Mobile (optimisé pour Appelant/Livreur)

## 🎯 Prochaines étapes

Maintenant que l'application fonctionne :

1. **Personnalisez** : Modifiez les couleurs dans `frontend/tailwind.config.js`
2. **Intégrez Make** : Configurez votre webhook de production
3. **Déployez** : Suivez le guide de déploiement dans `README.md`
4. **Formez vos équipes** : Créez des comptes et formez vos appelants/livreurs

## 💡 Besoin d'aide ?

- 📖 Lisez le `README.md` complet pour plus de détails
- 📖 Consultez `README-BACKEND.md` pour l'API
- 📖 Consultez `frontend/README.md` pour le frontend
- 🔍 Vérifiez les logs dans les terminaux

---

Bon développement ! 🚀


