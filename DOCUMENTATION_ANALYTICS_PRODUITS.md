# 📊 Documentation - Analyse des Produits

## Vue d'ensemble

La page **Analyse des Produits** est une interface complète de statistiques et de classements pour analyser les performances de tous les produits de la plateforme. Elle est accessible **uniquement par les ADMIN** via le menu de navigation.

**URL**: `/admin/product-analytics`

---

## Fonctionnalités principales

### 1. 📈 Statistiques globales

Affichage en temps réel de :
- **Total Commandes** : Nombre total de commandes créées
- **Validées** : Commandes validées par les appelants
- **Livrées** : Commandes livrées avec succès
- **Chiffre d'Affaires** : CA total généré par les produits livrés

### 2. 🔍 Système de filtres

Filtres disponibles :
- **Date début** : Filtrer à partir d'une date spécifique
- **Date fin** : Filtrer jusqu'à une date spécifique
- **Type de livraison** :
  - Tous (par défaut)
  - Local
  - Expédition
  - Express
- **Bouton Réinitialiser** : Réinitialise tous les filtres

### 3. 📊 Onglets de classement

#### a) 📦 Top Commandés
Classement des produits par nombre de commandes :
- Rang (🥇🥈🥉 pour le Top 3)
- Nom du produit
- Code produit
- Nombre total de commandes
- Quantité totale commandée
- Montant total (toutes commandes)

#### b) ✅ Top Validés
Classement des produits par nombre de validations par les appelants :
- Rang
- Nom du produit
- Code produit
- Nombre de commandes validées
- Quantité validée

#### c) 🚚 Top Livrés
Classement des produits par nombre de livraisons réussies :
- Rang
- Nom du produit
- Code produit
- Nombre de livraisons
- Quantité livrée
- Chiffre d'affaires généré

#### d) 📮 Top Expédiés
Classement des produits par expéditions et express :
- Rang
- Nom du produit
- Code produit
- Nombre d'expéditions (EXPEDITION)
- Nombre d'express (EXPRESS)
- Quantité totale expédiée

#### e) 📈 Taux de Conversion
Analyse de la conversion du pipeline par produit :
- Nom du produit
- Nombre de commandes créées
- Nombre de validées
- Nombre de livrées
- **Taux de validation** : % de commandes validées (vert ≥70%, jaune ≥50%, rouge <50%)
- **Taux de livraison** : % de validées qui sont livrées (vert ≥70%, jaune ≥50%, rouge <50%)
- **Conversion globale** : % de commandes créées qui finissent livrées (vert ≥60%, jaune ≥40%, rouge <40%)

#### f) 👤 Par Appelant
Classement des meilleures performances appelant/produit :
- Rang
- Nom du produit
- Nom de l'appelant
- Nombre de commandes validées

### 4. 📥 Export (en développement)
Bouton d'export pour télécharger les données au format CSV/Excel.

---

## API Backend

### Endpoint principal
**GET** `/api/analytics/products`

**Paramètres de requête** :
- `startDate` (optionnel) : Date de début au format ISO
- `endDate` (optionnel) : Date de fin au format ISO
- `deliveryType` (optionnel) : `LOCAL`, `EXPEDITION`, `EXPRESS`, ou `ALL`

**Réponse** :
```json
{
  "stats": {
    "totalProduits": 25,
    "totalCommandes": 1543,
    "totalValidees": 1124,
    "totalLivrees": 892,
    "totalExpeditions": 234,
    "totalExpress": 145,
    "chiffreAffairesTotal": 45789000
  },
  "topCommandes": [...],
  "topValides": [...],
  "topLivres": [...],
  "topExpedies": [...],
  "conversionRates": [...],
  "topAppelantsValidation": [...],
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "deliveryType": "ALL"
  }
}
```

### Endpoint de détails (prévu pour future extension)
**GET** `/api/analytics/products/:id`

Permet d'obtenir les détails et l'historique d'un produit spécifique avec :
- Statistiques par statut
- Statistiques par type de livraison
- Évolution par mois
- Commandes récentes

---

## Règles de calcul

### Top Commandés
- **Critère** : Toutes les commandes créées avec un `productId` non null
- **Tri** : Par nombre total de commandes (décroissant)

### Top Validés
- **Critère** : Commandes avec statut dans `['VALIDEE', 'ASSIGNEE', 'LIVREE', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE', 'EXPEDITION']`
- **Tri** : Par nombre de validations (décroissant)

### Top Livrés
- **Critère** : Commandes avec statut `LIVREE` ou `EXPRESS_LIVRE`
- **Tri** : Par nombre de livraisons (décroissant)
- **CA** : Somme des montants des commandes livrées

### Top Expédiés
- **Critère** : Commandes avec `deliveryType` = `EXPEDITION` ou `EXPRESS`
- **Statuts inclus** : `['LIVREE', 'EXPRESS_LIVRE', 'EXPRESS_ARRIVE', 'EXPEDITION', 'ASSIGNEE']`
- **Tri** : Par quantité totale expédiée (décroissant)

### Taux de Conversion
- **Taux de validation** = (Validées / Commandées) × 100
- **Taux de livraison** = (Livrées / Validées) × 100
- **Conversion globale** = (Livrées / Commandées) × 100
- **Tri** : Par taux de conversion globale (décroissant)

### Par Appelant
- **Critère** : Commandes validées avec un `callerId` non null
- **Groupement** : Par couple (produit, appelant)
- **Tri** : Par nombre de validations (décroissant)

---

## Données historiques

✅ **Toutes les données historiques sont prises en compte** : La page analyse toutes les commandes existantes dans la base de données, pas seulement les commandes récentes. Les filtres de date permettent de cibler une période spécifique si nécessaire.

---

## Sécurité et accès

- ✅ **Authentification requise** : Middleware `authenticate` appliqué
- ✅ **Autorisation ADMIN uniquement** : Middleware `authorize('ADMIN')` appliqué
- ✅ **Route protégée** : `/api/analytics/products`
- ✅ **Navigation visible** : Uniquement pour le rôle ADMIN dans le menu

---

## Intégration dans le système

### Fichiers créés/modifiés

**Backend** :
- `routes/analytics.routes.js` (nouveau) : Routes API d'analytics
- `server.js` : Import et enregistrement de la route `/api/analytics`

**Frontend** :
- `frontend/src/pages/admin/ProductAnalytics.tsx` (nouveau) : Page complète d'analytics
- `frontend/src/pages/admin/Dashboard.tsx` : Ajout de la route `/product-analytics`
- `frontend/src/components/Layout.tsx` : Ajout du lien dans le menu ADMIN

### Dépendances utilisées
- **Backend** : Prisma, Express
- **Frontend** : React, @tanstack/react-query, lucide-react

---

## Améliorations futures possibles

1. **Export CSV/Excel** : Implémenter la fonctionnalité d'export
2. **Graphiques visuels** : Ajouter des graphiques (barres, camembert) avec Chart.js ou Recharts
3. **Comparaison de périodes** : Comparer les performances entre deux périodes
4. **Alertes** : Notifications pour produits en baisse de performance
5. **Page de détails produit** : Vue détaillée d'un produit spécifique avec évolution temporelle
6. **Filtres avancés** : Filtrer par ville, par appelant, par livreur
7. **Analyse prédictive** : Prédiction des tendances basée sur l'historique

---

## Performance

- **Optimisation** : Utilisation de `Promise.all()` pour les requêtes parallèles
- **Limitation** : Top 20 résultats par onglet pour limiter le volume de données
- **Cache** : Utilisation de React Query pour mettre en cache les résultats côté frontend
- **Indexation** : Les champs `productId`, `status`, `deliveryType`, `createdAt` sont indexés dans Prisma

---

## Support et maintenance

Pour toute question ou amélioration, contacter l'équipe de développement.

**Dernière mise à jour** : Janvier 2026
