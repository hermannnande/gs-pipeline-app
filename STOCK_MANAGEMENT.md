# 📦 Système de Gestion de Stock - Documentation

## 🎯 Vue d'ensemble

Le système de gestion de stock a été entièrement implémenté selon vos spécifications. Ce document détaille toutes les fonctionnalités et comment les utiliser.

---

## 🧑‍💼 Rôles et Séparation

### **GESTIONNAIRE** (Gestionnaire Principal)
**Responsabilités :**
- Voir les commandes validées par les appelants
- Assigner les commandes aux livreurs (création des tournées)
- Suivre les statuts des livraisons (livrée, refusée, annulée)

**N'a PAS accès à :**
- La gestion du stock produit
- La confirmation des colis remis/retournés
- Les mouvements de stock

### **GESTIONNAIRE_STOCK** (Gestionnaire de Stock) - NOUVEAU
**Responsabilités :**
- Préparer et remettre les colis aux livreurs
- Confirmer le nombre de colis remis avant le départ
- Récupérer les colis non livrés au retour
- Confirmer les retours et réintégrer le stock
- Contrôler la correspondance entre colis remis/livrés/retournés
- Gérer le stock des produits (approvisionnement, corrections)

**N'a PAS le droit de :**
- Supprimer une commande
- Modifier le contenu d'une commande
- Créer/modifier/supprimer un produit (sauf ajustements de stock)

---

## 📊 Logique de Stock - Règles Métier

### ✅ **Règle 1 : Les commandes ne bloquent PAS le stock**
- Quand une commande arrive sur le site, le stock n'est **pas impacté**
- Le système accepte toutes les commandes, même si le stock est insuffisant
- La gestion du stock se fait **au moment de la livraison**

### ✅ **Règle 2 : Le stock diminue uniquement à la livraison**
- Le stock d'un produit diminue **uniquement** quand une commande est marquée **LIVREE**
- Au moment du changement de statut vers LIVREE :
  - Le stock est automatiquement décrémenté
  - Un mouvement de stock de type "LIVRAISON" est créé
  - La vente est enregistrée pour la comptabilité

### ✅ **Règle 3 : Le stock remonte avec les retours**
- Quand le Gestionnaire de Stock enregistre un retour de colis :
  - Le système calcule les produits non livrés
  - Le stock est automatiquement incrémenté
  - Un mouvement de stock de type "RETOUR" est créé
  - Les produits retournés sont disponibles pour de nouvelles commandes

---

## 🔄 Workflow Complet

### **Phase 1 : Réception et Appel**
1. Commande reçue via le site e-commerce → Statut: **NOUVELLE**
2. Appelant traite la commande :
   - **VALIDEE** ➜ Passe au Gestionnaire principal
   - **ANNULEE** ➜ Commande supprimée du pipeline
   - **INJOIGNABLE** ➜ En attente

### **Phase 2 : Préparation et Assignment**
3. Gestionnaire principal voit les commandes **VALIDEES**
4. Il crée une tournée et assigne les commandes à un livreur
5. Les commandes passent au statut: **ASSIGNEE**

### **Phase 3 : Remise des Colis (Gestionnaire de Stock)**
6. Le Gestionnaire de Stock voit la tournée dans son interface
7. Il prépare physiquement les colis
8. Il confirme dans le système : **"X colis remis au livreur Y"**
9. Les colis sont tracés dans le système

### **Phase 4 : Livraison**
10. Le livreur reçoit sa liste de commandes
11. Pour chaque commande, il marque :
    - **LIVREE** ➜ ✅ Stock décrémenté automatiquement
    - **REFUSEE** ➜ ❌ Colis à ramener
    - **ANNULEE_LIVRAISON** ➜ ❌ Colis à ramener

### **Phase 5 : Retour des Colis (Gestionnaire de Stock)**
12. Le livreur revient et remet les colis non livrés
13. Le Gestionnaire de Stock compte les colis retournés
14. Il enregistre dans le système : **"X colis retournés"**
15. Le système vérifie : `colis_remis = colis_livrés + colis_retour`
16. Si écart, le Gestionnaire doit expliquer (perte, casse, etc.)
17. Le stock est automatiquement réintégré pour les retours

---

## 💻 Interface Gestionnaire de Stock

### **Page : Dashboard**
- Vue d'ensemble du stock
- Alertes pour les produits à faible stock
- Tournées du jour
- Actions rapides

### **Page : Tournées**
Fonctionnalités :
- **Voir toutes les tournées** (filtre par date, livreur)
- **Confirmer la remise des colis** :
  - Saisir le nombre de colis remis
  - Validation avant le départ du livreur
- **Confirmer le retour des colis** :
  - Saisir le nombre de colis retournés
  - Vérification automatique des écarts
  - Obligation d'expliquer tout écart
  - Réintégration automatique du stock
- **Voir le détail d'une tournée** :
  - Liste des commandes
  - Résumé par produit
  - Statuts de livraison

### **Page : Produits**
- Liste de tous les produits avec leur stock
- Indicateurs visuels (barres de progression)
- Alertes pour stock faible (rouge)
- **Ajuster le stock** :
  - Approvisionnement (+)
  - Correction (+/-)
  - Perte/Casse (-)
  - Motif obligatoire pour traçabilité

### **Page : Mouvements**
- Historique complet des mouvements de stock
- Filtres :
  - Par produit
  - Par type (approvisionnement, livraison, retour, correction, perte)
  - Par période
- Pour chaque mouvement :
  - Date et heure
  - Produit concerné
  - Type de mouvement
  - Quantité (+ ou -)
  - Stock avant/après
  - Motif
  - Tournée associée (si applicable)

---

## 🗄️ Base de Données - Nouvelles Tables

### **Product (Produits)**
```
- id
- code (unique)
- nom
- description
- prixUnitaire
- stockActuel ← Stock disponible
- stockAlerte ← Seuil d'alerte
- actif
```

### **StockMovement (Mouvements de Stock)**
```
- id
- productId
- type (APPROVISIONNEMENT, LIVRAISON, RETOUR, CORRECTION, PERTE)
- quantite (+ ou -)
- stockAvant
- stockApres
- orderId (optionnel)
- tourneeId (optionnel)
- effectuePar (userId)
- motif
- createdAt
```

### **TourneeStock (Gestion des Tournées)**
```
- id
- deliveryListId
- colisRemis
- colisRemisConfirme
- colisRemisAt
- colisRemisBy
- colisLivres (calculé)
- colisRetour
- colisRetourConfirme
- colisRetourAt
- colisRetourBy
- ecart (colisRemis - colisLivres - colisRetour)
- ecartResolu
- ecartMotif
```

### **Relation Order ↔ Product**
Les commandes sont maintenant liées aux produits :
```
Order.productId → Product.id
```

---

## 🔐 Compte de Test

**Gestionnaire de Stock :**
- Email: `stock@gs-pipeline.com`
- Mot de passe: `stock123`

**Autres comptes existants :**
- Admin: `admin@gs-pipeline.com` / `admin123`
- Gestionnaire: `gestionnaire@gs-pipeline.com` / `gestionnaire123`
- Appelant: `appelant@gs-pipeline.com` / `appelant123`
- Livreur: `livreur@gs-pipeline.com` / `livreur123`

---

## 📦 Produits de Test

Trois produits ont été créés avec du stock initial :

| Code | Produit | Stock | Seuil | Prix |
|------|---------|-------|-------|------|
| MON-001 | Montre Connectée Pro | 50 | 10 | 599 MAD |
| ECO-001 | Écouteurs Sans Fil | 100 | 20 | 199 MAD |
| POW-001 | Batterie Externe 20000mAh | 75 | 15 | 149 MAD |

---

## 🚀 API Endpoints

### **Produits**
```
GET    /api/products                      # Liste des produits
GET    /api/products/:id                  # Détail d'un produit
POST   /api/products                      # Créer un produit (ADMIN)
PUT    /api/products/:id                  # Modifier un produit (ADMIN)
POST   /api/products/:id/stock/adjust     # Ajuster le stock (ADMIN)
GET    /api/products/alerts/low-stock     # Produits en alerte
```

### **Gestion des Tournées (Stock)**
```
GET    /api/stock/tournees                # Liste des tournées
GET    /api/stock/tournees/:id            # Détail d'une tournée
POST   /api/stock/tournees/:id/confirm-remise   # Confirmer remise colis
POST   /api/stock/tournees/:id/confirm-retour   # Confirmer retour colis
GET    /api/stock/movements               # Historique mouvements
GET    /api/stock/stats                   # Statistiques stock
```

---

## ✅ Fonctionnalités Implémentées

### Backend
- ✅ Nouveau rôle `GESTIONNAIRE_STOCK`
- ✅ Modèles de données (Product, StockMovement, TourneeStock)
- ✅ Routes API pour produits et stock
- ✅ Logique automatique de décrémentation du stock à la livraison
- ✅ Logique automatique de réintégration du stock au retour
- ✅ Validation des écarts de colis
- ✅ Traçabilité complète des mouvements
- ✅ Seed avec compte et produits de test

### Frontend
- ✅ Interface complète pour Gestionnaire de Stock
- ✅ Dashboard avec indicateurs
- ✅ Page de gestion des tournées (remise/retour)
- ✅ Page de gestion des produits
- ✅ Page d'historique des mouvements
- ✅ Modals de confirmation interactifs
- ✅ Calcul automatique des écarts
- ✅ Alertes visuelles (stock faible)
- ✅ Filtres avancés

---

## 🎨 Séparation Complète des Rôles

| Fonctionnalité | Admin | Gestionnaire | Gestionnaire Stock | Appelant | Livreur |
|----------------|-------|--------------|-------------------|----------|---------|
| Voir commandes | ✅ | ✅ Validées | ❌ | ✅ À appeler | ❌ |
| Créer tournées | ✅ | ✅ | ❌ | ❌ | ❌ |
| Confirmer remise colis | ✅ | ❌ | ✅ | ❌ | ❌ |
| Confirmer retour colis | ✅ | ❌ | ✅ | ❌ | ❌ |
| Gérer stock produits | ✅ | ❌ | ✅ Ajustements | ❌ | ❌ |
| Créer/Modifier produits | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir mouvements stock | ✅ | ❌ | ✅ | ❌ | ❌ |
| Marquer livraison | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 📝 Notes Importantes

### **Rétrocompatibilité**
- Les anciennes commandes sans `productId` continuent de fonctionner
- Le champ `productId` est optionnel sur les commandes
- Si aucun produit n'est lié, le stock n'est pas impacté

### **Traçabilité Complète**
- Tous les mouvements de stock sont enregistrés
- Chaque mouvement indique :
  - Qui l'a effectué
  - Pourquoi (motif obligatoire)
  - Stock avant et après
  - Date et heure précises

### **Contrôles de Sécurité**
- Le stock ne peut jamais être négatif (validation backend)
- Les retours nécessitent une confirmation du Gestionnaire de Stock
- Les écarts doivent être expliqués
- Seuls Admin et Gestionnaire Stock peuvent ajuster le stock

---

## 🚀 Pour Démarrer

1. **Connectez-vous en tant que Gestionnaire de Stock :**
   - Email: `stock@gs-pipeline.com`
   - Mot de passe: `stock123`

2. **Explorez le Dashboard** pour voir l'état du stock

3. **Testez le workflow complet :**
   - Admin/Gestionnaire crée une tournée
   - Gestionnaire Stock confirme la remise
   - Livreur marque les livraisons
   - Gestionnaire Stock confirme le retour
   - Vérifiez que le stock a été mis à jour automatiquement

---

## 🎉 Système Complet et Opérationnel

Le système de gestion de stock est maintenant **100% fonctionnel** et respecte toutes vos spécifications :

✅ Séparation claire des rôles  
✅ Logique métier implémentée (stock à la livraison uniquement)  
✅ Workflow complet (remise → livraison → retour → réintégration)  
✅ Traçabilité totale des mouvements  
✅ Interface intuitive et ergonomique  
✅ Contrôle des écarts  
✅ Alertes stock faible  
✅ Historique complet  

**Le système est prêt à être utilisé en production !** 🚀


