# 🚀 GS Pipeline - Backend API

Back-office de gestion de pipeline de commandes e-commerce avec système d'appels et de livraisons.

## 📋 Technologies

- **Node.js** + **Express**
- **PostgreSQL** (base de données)
- **Prisma** (ORM)
- **JWT** (authentification)
- **bcrypt** (hashage des mots de passe)

## 🛠️ Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer la base de données

Créer un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gs_pipeline?schema=public"
JWT_SECRET="votre_secret_jwt_tres_securise"
PORT=5000
NODE_ENV=development
WEBHOOK_API_KEY="votre_cle_api_webhook_securisee"
```

### 3. Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# (Optionnel) Insérer des données de test
npm run prisma:seed
```

### 4. Démarrer le serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur http://localhost:5000

## 👥 Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@gs-pipeline.com | admin123 |
| Gestionnaire | gestionnaire@gs-pipeline.com | gestionnaire123 |
| Appelant | appelant@gs-pipeline.com | appelant123 |
| Livreur | livreur@gs-pipeline.com | livreur123 |

## 📡 API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur connecté

### Utilisateurs (Admin uniquement)

- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Désactiver un utilisateur

### Commandes

- `GET /api/orders` - Liste des commandes (filtrée selon rôle)
- `GET /api/orders/:id` - Détails d'une commande
- `POST /api/orders` - Créer une commande (Admin/Gestionnaire)
- `PUT /api/orders/:id` - Modifier une commande (Admin/Gestionnaire)
- `PUT /api/orders/:id/status` - Changer le statut d'une commande

### Livraisons

- `GET /api/delivery/lists` - Listes de livraison (Gestionnaire/Admin)
- `POST /api/delivery/assign` - Assigner des commandes à un livreur
- `GET /api/delivery/my-orders` - Commandes du livreur connecté (Livreur)
- `GET /api/delivery/validated-orders` - Commandes validées en attente (Gestionnaire/Admin)

### Statistiques

- `GET /api/stats/overview` - Vue d'ensemble (Admin/Gestionnaire)
- `GET /api/stats/callers` - Statistiques des appelants (Admin/Gestionnaire)
- `GET /api/stats/deliverers` - Statistiques des livreurs (Admin/Gestionnaire)
- `GET /api/stats/my-stats` - Statistiques personnelles (Appelant/Livreur)
- `GET /api/stats/export` - Export des données (Admin)

### Webhook (Intégration Make)

- `POST /api/webhook/order` - Recevoir une commande depuis Make
- `GET /api/webhook/test` - Test du webhook

## 🔐 Authentification

Toutes les routes (sauf webhook) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 🔄 Statuts des commandes

1. **NOUVELLE** - Commande reçue
2. **A_APPELER** - En attente d'appel
3. **VALIDEE** - Client a validé
4. **ANNULEE** - Client a annulé
5. **INJOIGNABLE** - Client non joignable
6. **ASSIGNEE** - Assignée à un livreur
7. **LIVREE** - Livrée avec succès
8. **REFUSEE** - Refusée par le client
9. **ANNULEE_LIVRAISON** - Annulée pendant la livraison

## 👥 Rôles utilisateurs

- **ADMIN** - Accès complet
- **GESTIONNAIRE** - Gestion des commandes validées et assignation aux livreurs
- **APPELANT** - Appel des clients et validation des commandes
- **LIVREUR** - Livraison et mise à jour des statuts

## 🔗 Intégration avec Make

Configurez votre scénario Make pour envoyer une requête POST à :

```
POST https://votre-domaine.com/api/webhook/order
```

Header :
```
Content-Type: application/json
X-API-Key: votre_cle_api_webhook
```

Body (JSON) :
```json
{
  "clientNom": "Nom du client",
  "clientTelephone": "+212600000000",
  "clientVille": "Casablanca",
  "clientCommune": "Maarif",
  "clientAdresse": "Adresse complète",
  "produitNom": "Nom du produit",
  "produitPage": "page-produit",
  "quantite": 1,
  "montant": 599.00,
  "sourceCampagne": "Facebook Ads",
  "sourcePage": "landing-page"
}
```

## 🗄️ Commandes Prisma utiles

```bash
# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Réinitialiser la base de données
npx prisma migrate reset

# Formater le schéma
npx prisma format
```

## 📝 Notes

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 24h
- Les statistiques sont calculées automatiquement lors des changements de statut
- L'historique complet des changements de statut est conservé








