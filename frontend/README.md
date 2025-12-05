# 🎨 GS Pipeline - Frontend

Interface utilisateur moderne pour le back-office de gestion de pipeline de commandes.

## 📋 Technologies

- **React 18** avec **TypeScript**
- **Vite** (build ultra-rapide)
- **TailwindCSS** (design moderne et responsive)
- **React Router** (navigation)
- **React Query** (gestion du cache et requêtes API)
- **Zustand** (state management)
- **Lucide React** (icônes)
- **React Hot Toast** (notifications)

## 🛠️ Installation

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Configuration

Créer un fichier `.env` à la racine du dossier frontend :

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Démarrer l'application

```bash
# Mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

L'application sera accessible sur http://localhost:3000

## 📱 Interfaces par rôle

### 🔴 Admin
- Dashboard global avec statistiques complètes
- Gestion complète des commandes
- Création et gestion des utilisateurs
- Statistiques détaillées par appelant et livreur
- Export de données

### 🟢 Gestionnaire
- Vue des commandes validées
- Assignation des commandes aux livreurs
- Gestion des listes de livraison journalières
- Suivi des livraisons par livreur
- Statistiques des équipes

### 🟡 Appelant
- Liste des commandes à appeler
- Interface d'appel avec actions rapides :
  - Valider la commande
  - Marquer comme annulée
  - Marquer comme injoignable
- Ajout de notes internes
- Statistiques personnelles (taux de validation)

### 🔵 Livreur
- Liste journalière de livraisons
- Détails de chaque livraison (adresse, téléphone, produit)
- Actions de livraison :
  - Marquer comme livrée
  - Marquer comme refusée
  - Marquer comme annulée
- Intégration Google Maps pour itinéraire
- Statistiques personnelles (montant encaissé, taux de réussite)

## 🎨 Composants principaux

```
src/
├── pages/           # Pages par rôle
│   ├── admin/       # Dashboards admin
│   ├── gestionnaire/
│   ├── appelant/
│   └── livreur/
├── components/      # Composants réutilisables
│   └── Layout.tsx   # Layout principal avec sidebar
├── lib/
│   └── api.ts       # Configuration Axios et endpoints API
├── store/
│   └── authStore.ts # Store Zustand pour authentification
├── types/           # Types TypeScript
└── utils/           # Fonctions utilitaires
```

## 🔐 Authentification

L'authentification utilise JWT. Le token est stocké dans `localStorage` et automatiquement ajouté aux requêtes API via un intercepteur Axios.

## 🎯 Fonctionnalités clés

### Responsive Design
- Interface optimisée pour desktop et mobile
- Sidebar adaptative
- Cartes et tableaux responsives

### Gestion d'état
- React Query pour le cache des données
- Zustand pour l'état d'authentification
- Invalidation automatique du cache après mutations

### Notifications
- Toast notifications pour feedback utilisateur
- Messages de succès/erreur pour toutes les actions

### Navigation
- Routing dynamique selon le rôle
- Redirection automatique selon l'utilisateur connecté
- Protection des routes par authentification

## 🚀 Build et déploiement

```bash
# Build pour production
npm run build

# Les fichiers optimisés seront dans le dossier dist/
```

Pour déployer sur un serveur :
1. Upload le contenu du dossier `dist/`
2. Configurer le serveur web pour rediriger toutes les routes vers `index.html`
3. Mettre à jour la variable `VITE_API_URL` pour pointer vers votre API en production

## 🎨 Personnalisation

### Couleurs
Les couleurs principales sont définies dans `tailwind.config.js` :

```js
colors: {
  primary: {
    // Personnaliser ici
  }
}
```

### Logo et branding
Modifier les fichiers dans `/public/` et le titre dans `index.html`

## 🔧 Scripts disponibles

```bash
npm run dev       # Démarre le serveur de développement
npm run build     # Build pour production
npm run preview   # Prévisualiser le build
npm run lint      # Vérifier le code avec ESLint
```

## 📊 Performance

- Code splitting automatique par route
- Lazy loading des composants
- Optimisation des images
- Minification et compression en production

## 🌐 Compatibilité

- Chrome, Firefox, Safari, Edge (dernières versions)
- Support mobile iOS et Android

## 💡 Conseils de développement

1. Utilisez React Query DevTools pour débugger le cache
2. Consultez les erreurs dans la console du navigateur
3. Utilisez les React Developer Tools
4. Testez sur différentes tailles d'écran avec les DevTools


