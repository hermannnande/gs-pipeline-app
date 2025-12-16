# 🚀 GS Pipeline - Back-office E-commerce

Système complet de gestion de pipeline de commandes e-commerce avec appels clients, validation et livraisons.

## 📖 Description du projet

GS Pipeline est une application web complète permettant de gérer l'intégralité du cycle de vie d'une commande e-commerce :

1. **Réception** : Les commandes arrivent depuis votre site web via Make/webhook
2. **Appel** : Les appelants contactent les clients pour valider les commandes
3. **Préparation** : Le gestionnaire assigne les commandes validées aux livreurs
4. **Livraison** : Les livreurs effectuent les livraisons et mettent à jour les statuts
5. **Suivi** : Statistiques complètes pour tous les acteurs

## 📚 Documentation Complète

**🎯 IMPORTANT : Consultez [ARCHITECTURE_ET_REGLES_METIER.md](./ARCHITECTURE_ET_REGLES_METIER.md) pour comprendre TOUTE la logique du système**

Ce document contient :
- 🔄 Flux complets des commandes
- 📦 Règles métier critiques de gestion de stock
- 🛣️ Routes API détaillées
- 🎨 Architecture frontend/backend
- 🚨 Erreurs courantes à éviter
- 📝 Exemples de code

## 🎯 Fonctionnalités principales

### Pipeline de commandes
- ✅ Réception automatique des commandes (webhook)
- ✅ Gestion des statuts (Nouvelle → À appeler → Validée → Assignée → Livrée)
- ✅ Historique complet de chaque commande
- ✅ Notes internes par rôle
- ✅ Système de notification pour éviter les appels en double
- ✅ Gestion des rendez-vous de rappel

### Gestion des utilisateurs
- 👤 **5 rôles** : Admin, Gestionnaire, Gestionnaire de Stock, Appelant, Livreur
- 🔐 Authentification sécurisée JWT
- 👥 Création et gestion des comptes par l'admin
- 🔒 Permissions granulaires par rôle

### Appelants
- 📞 Liste des commandes à appeler
- ✅ Validation/Annulation/Injoignable en un clic
- 📝 Ajout de notes pour chaque appel
- 📊 Statistiques personnelles et taux de validation

### Gestionnaire
- 📋 Vue des commandes validées
- 🚚 Assignation intelligente aux livreurs par zone/date
- 📦 Création de listes de livraison journalières
- 📈 Suivi en temps réel des livraisons

### Gestionnaire de Stock (NOUVEAU)
- 📦 Gestion complète de l'inventaire des produits
- ✅ **Confirmation de REMISE** des colis aux livreurs (déplace le stock)
- ✅ **Confirmation de RETOUR** des colis non livrés (retourne le stock)
- 📊 Suivi en temps réel du stock disponible et en livraison
- 🔍 Contrôle des écarts entre remis, livrés et retournés
- 📈 Historique complet des mouvements de stock
- 🚨 Alertes automatiques pour stock faible

### Livreurs
- 🗺️ Liste journalière optimisée
- 📍 Intégration Google Maps pour itinéraire
- ✅ Mise à jour des statuts (Livrée/Refusée/Annulée)
- 💰 Suivi du montant encaissé

### Statistiques & Rapports
- 📊 Dashboard temps réel pour chaque rôle
- 📈 Performance individuelle et d'équipe
- 💹 Taux de conversion, validation, réussite
- 📥 Export CSV/Excel des données

## 🏗️ Architecture

```
GS Pipeline/
├── backend/                 # API Node.js + Express
│   ├── server.js           # Point d'entrée
│   ├── prisma/             # Schéma et migrations DB
│   ├── routes/             # Routes API par domaine
│   ├── middlewares/        # Auth et permissions
│   └── package.json
│
└── frontend/               # Interface React + TypeScript
    ├── src/
    │   ├── pages/          # Pages par rôle
    │   ├── components/     # Composants réutilisables
    │   ├── lib/            # Configuration API
    │   ├── store/          # State management
    │   └── types/          # Types TypeScript
    └── package.json
```

## 🛠️ Stack technique

### Backend
- **Node.js** + **Express** - Serveur API REST
- **PostgreSQL** - Base de données relationnelle
- **Prisma** - ORM moderne et type-safe
- **JWT** - Authentification sécurisée
- **bcrypt** - Hashage des mots de passe

### Frontend
- **React 18** + **TypeScript** - Interface utilisateur
- **Vite** - Build ultra-rapide
- **TailwindCSS** - Design moderne et responsive
- **React Query** - Gestion du cache et requêtes
- **Zustand** - State management
- **React Router** - Navigation

## 📦 Installation complète

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### 1. Backend

```bash
# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos informations PostgreSQL

# Initialiser la base de données
npm run prisma:generate
npm run prisma:migrate

# (Optionnel) Insérer des données de test
npm run prisma:seed

# Démarrer le serveur
npm run dev
```

Le backend sera accessible sur http://localhost:5000

### 2. Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Configurer l'API
cp .env.example .env
# Vérifier que VITE_API_URL pointe vers votre backend

# Démarrer l'application
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## 👥 Comptes de test

Après le seeding, vous pouvez vous connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@gs-pipeline.com | admin123 |
| **Gestionnaire** | gestionnaire@gs-pipeline.com | gestionnaire123 |
| **Gestionnaire de Stock** | stock@gs-pipeline.com | stock123 |
| **Appelant** | appelant@gs-pipeline.com | appelant123 |
| **Livreur** | livreur@gs-pipeline.com | livreur123 |

## 🔗 Intégration avec Make

### Configuration du webhook

1. Dans votre scénario Make, ajoutez un module HTTP Request
2. Configurez-le comme suit :

```
URL: http://votre-domaine.com/api/webhook/order
Method: POST
Headers:
  Content-Type: application/json
  X-API-Key: votre_cle_api_securisee

Body (JSON):
{
  "clientNom": "{{nom}}",
  "clientTelephone": "{{telephone}}",
  "clientVille": "{{ville}}",
  "clientCommune": "{{commune}}",
  "clientAdresse": "{{adresse}}",
  "produitNom": "{{produit}}",
  "quantite": {{quantite}},
  "montant": {{montant}},
  "sourceCampagne": "{{campagne}}",
  "sourcePage": "{{page}}"
}
```

3. Ajoutez votre `WEBHOOK_API_KEY` dans le fichier `.env` du backend

## 📱 Captures d'écran des interfaces

### Dashboard Admin
- Vue d'ensemble complète
- Statistiques globales
- Gestion des utilisateurs
- Rapports détaillés

### Interface Appelant
- Liste des commandes à appeler
- Formulaire d'appel simplifié
- Statistiques personnelles

### Interface Gestionnaire
- Commandes validées en attente
- Assignation par sélection multiple
- Suivi des listes de livraison

### Interface Livreur
- Vue journalière optimisée
- Détails clients et itinéraire
- Actions rapides de livraison

## 🚀 Déploiement en production

### Backend

1. **Serveur** : VPS, DigitalOcean, AWS, etc.
2. **Base de données** : PostgreSQL hébergé
3. **Variables d'environnement** :
   ```env
   NODE_ENV=production
   DATABASE_URL="postgresql://..."
   JWT_SECRET="secret_tres_securise"
   WEBHOOK_API_KEY="cle_api_securisee"
   ```
4. **Process manager** : PM2 recommandé
   ```bash
   pm2 start server.js --name gs-pipeline-api
   ```

### Frontend

1. **Build** :
   ```bash
   npm run build
   ```
2. **Hébergement** : Vercel, Netlify, ou serveur statique
3. **Configuration** : Pointer `VITE_API_URL` vers l'API en production

### Reverse Proxy (nginx)

```nginx
# API Backend
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Frontend
location / {
    root /var/www/gs-pipeline/frontend/dist;
    try_files $uri /index.html;
}
```

## 📊 Statuts des commandes

### **Statuts principaux**
1. **NOUVELLE** : Commande reçue du site web
2. **A_APPELER** : En attente de traitement par un appelant
3. **VALIDEE** : Client a confirmé la commande
4. **ANNULEE** : Client a annulé
5. **INJOIGNABLE** : Impossible de joindre le client
6. **ASSIGNEE** : Assignée à un livreur
7. **LIVREE** : Livraison effectuée avec succès ✅
8. **REFUSEE** : Client a refusé à la livraison ❌
9. **ANNULEE_LIVRAISON** : Annulée pendant la livraison ❌
10. **RETOURNE** : Colis retourné au dépôt ↩️

### **Statuts EXPEDITION / EXPRESS**
11. **EXPEDITION** : Paiement 100% - En attente d'envoi vers autre ville
12. **EXPRESS** : Paiement 10% - En cours d'envoi vers agence
13. **EXPRESS_ARRIVE** : Colis arrivé en agence - En attente paiement 90%
14. **EXPRESS_LIVRE** : Express livré après paiement des 90%

## 🚚 Types de livraison

- **LOCAL** : Livraison locale classique avec livreurs (Dakar et environs)
- **EXPEDITION** : Paiement 100% avant envoi vers autre ville (via agence de transport)
- **EXPRESS** : Paiement 10% avant envoi, 90% à la réception en agence de retrait

## 🔒 Sécurité

- ✅ Hashage des mots de passe avec bcrypt
- ✅ Authentification JWT avec expiration
- ✅ Validation des données côté backend
- ✅ Protection CORS configurée
- ✅ Permissions granulaires par rôle
- ✅ Clé API pour webhook

## 📈 Évolutions futures possibles

- [ ] Notifications push pour les livreurs
- [ ] Chat intégré entre équipes
- [ ] Tableau de bord temps réel avec WebSocket
- [ ] Application mobile native (React Native)
- [ ] Intégration avec services de paiement
- [ ] OCR pour automatiser la saisie d'adresses
- [ ] Optimisation automatique des routes de livraison
- [ ] Système de commission pour les livreurs

## 🤝 Support

Pour toute question ou problème :
- Consultez les README détaillés dans `/backend` et `/frontend`
- Vérifiez les logs du serveur et du navigateur
- Testez avec les comptes de test fournis

## 📄 Licence

Ce projet est développé sur mesure pour votre entreprise.

---

Développé avec ❤️ pour optimiser votre processus de gestion de commandes e-commerce.










