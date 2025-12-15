# 📊 GUIDE - ANALYSE ET SUIVI DU STOCK EN LIVRAISON

## 🎯 OBJECTIF

Vérifier et analyser en temps réel le **stock actuellement avec les livreurs** pour garantir des calculs exacts et suivre précisément tous les retours.

---

## 🚀 NOUVELLE PAGE : "Livraisons en Cours"

### **📍 Accès**

**Pour le Gestionnaire de Stock :**

```
Menu → 🚚 Livraisons en cours
URL: https://www.obgestion.com/stock/livraisons-en-cours
```

---

## 📊 FONCTIONNALITÉS PRINCIPALES

### **1. Statistiques Globales**

La page affiche en temps réel :

```
┌─────────────────────────────────────────────────┐
│  📦 Commandes en livraison        : 18          │
│  📊 Quantité totale               : 45          │
│  🚚 Livreurs actifs               : 5           │
│  📦 Produits concernés            : 8           │
└─────────────────────────────────────────────────┘
```

---

### **2. Vue par Produit**

Voir **quel stock est sorti pour chaque produit** :

```
┌─────────────────────────────────────────────────┐
│  Crème Anti-Cerne (CREME_ANTI_CERNE)            │
│                                                 │
│  Quantité en livraison : 12                     │
│  Commandes : 8                                  │
│  Livreurs : 3                                   │
│                                                 │
│  📋 Détails des commandes :                     │
│  • REF-12345 - Mme Kouassi (×2)                │
│    🚚 Konan Jean                                │
│    📅 15/12/2024                                │
│                                                 │
│  • REF-12346 - M. Traoré (×3)                  │
│    🚚 Bamba Marie                               │
│    📅 15/12/2024                                │
└─────────────────────────────────────────────────┘
```

**Avantages :**
- Voir exactement combien d'unités de chaque produit sont sorties
- Identifier rapidement quel livreur a quel produit
- Suivre les dates de livraison prévues

---

### **3. Vue par Livreur**

Voir **tout ce qui est avec chaque livreur** :

```
┌─────────────────────────────────────────────────┐
│  👤 Kouassi Jean                                │
│                                                 │
│  Quantité totale : 15                           │
│  Commandes : 6                                  │
│  Produits : 3                                   │
│                                                 │
│  📦 Produits :                                  │
│  • Crème Anti-Cerne      : ×8                   │
│  • Gaine Tourmaline      : ×5                   │
│  • Patch Anti-Cicatrice  : ×2                   │
│                                                 │
│  📋 Liste des commandes :                       │
│  • REF-12345 - Crème Anti-Cerne (×2)           │
│    👤 Mme Kouassi                               │
│    📅 15/12/2024                                │
└─────────────────────────────────────────────────┘
```

**Avantages :**
- Voir instantanément ce que chaque livreur a en sa possession
- Vérifier le stock avant qu'il ne parte en livraison
- Faciliter le contrôle au retour de tournée

---

### **4. Détection Automatique des Écarts** ⚠️

Le système compare automatiquement :

**Stock enregistré en BDD** VS **Stock réel en livraison (commandes ASSIGNEE)**

Si un écart est détecté, une **alerte rouge** s'affiche :

```
┌─────────────────────────────────────────────────┐
│  ⚠️ 2 écart(s) détecté(s)                       │
│                                                 │
│  Les quantités enregistrées ne correspondent    │
│  pas aux commandes en cours.                    │
│                                                 │
│  📦 Crème Anti-Cerne                            │
│     Enregistré : 10                             │
│     Réel : 12                                   │
│     Écart : +2 (MANQUE EN BDD)                  │
│                                                 │
│  📦 Gaine Tourmaline                            │
│     Enregistré : 8                              │
│     Réel : 5                                    │
│     Écart : -3 (SURPLUS EN BDD)                 │
│                                                 │
│  [Corriger les écarts maintenant]               │
└─────────────────────────────────────────────────┘
```

**Types d'écarts :**
- **MANQUE_EN_BDD** : Des commandes existent mais le stock n'a pas été déplacé
- **SURPLUS_EN_BDD** : Du stock est marqué "en livraison" mais aucune commande n'existe

---

## 🔧 FONCTIONNALITÉS AVANCÉES

### **📊 Actualiser**

Bouton pour recharger les données en temps réel.

### **🔄 Recalculer**

**Fonction critique** : Recalcule automatiquement le stock en livraison pour chaque produit.

**Ce qu'elle fait :**

1. ✅ Compte toutes les commandes **ASSIGNEE** par produit
2. ✅ Compare avec le `stockLocalReserve` enregistré
3. ✅ Corrige automatiquement les écarts
4. ✅ Crée des mouvements de stock de type **CORRECTION**
5. ✅ Génère un rapport détaillé des corrections

**Quand l'utiliser :**
- ⚠️ Si vous constatez des écarts
- 🔧 Après avoir corrigé manuellement des statuts de commandes
- 📊 Périodiquement pour vérifier la cohérence

---

## 🔌 API DISPONIBLES

### **1. Analyse Complète**

```http
GET /api/stock-analysis/local-reserve
```

**Réponse :**

```json
{
  "summary": {
    "totalCommandes": 18,
    "totalQuantite": 45,
    "totalProduitsConcernes": 8,
    "totalLivreurs": 5,
    "totalEcarts": 2,
    "ecartQuantite": 5
  },
  "parProduit": [
    {
      "product": {
        "id": 1,
        "code": "CREME_ANTI_CERNE",
        "nom": "Crème Anti-Cerne",
        "stockLocalReserve": 12
      },
      "quantiteReelle": 12,
      "quantiteEnregistree": 12,
      "commandes": [...],
      "nombreLivreurs": 3
    }
  ],
  "parLivreur": [
    {
      "deliverer": {
        "id": 5,
        "nom": "Kouassi",
        "prenom": "Jean"
      },
      "totalQuantite": 15,
      "produits": {...},
      "commandes": [...]
    }
  ],
  "ecarts": [
    {
      "productId": 2,
      "productNom": "Gaine Tourmaline",
      "quantiteReelle": 12,
      "quantiteEnregistree": 10,
      "ecart": 2,
      "type": "MANQUE_EN_BDD"
    }
  ]
}
```

---

### **2. Recalcul Automatique**

```http
POST /api/stock-analysis/recalculate-local-reserve
```

**Réponse :**

```json
{
  "message": "Recalcul terminé avec succès",
  "totalCorrections": 3,
  "corrections": [
    {
      "productId": 2,
      "productNom": "Crème Anti-Cerne",
      "ancien": 10,
      "nouveau": 12,
      "ecart": 2
    }
  ]
}
```

---

### **3. Détails par Livreur**

```http
GET /api/stock-analysis/deliverer-details/:delivererId
```

**Réponse :**

```json
{
  "delivererId": 5,
  "totalCommandes": 6,
  "totalQuantite": 15,
  "totalValeur": 148500,
  "parProduit": [
    {
      "product": {
        "nom": "Crème Anti-Cerne",
        "prixUnitaire": 9900
      },
      "quantite": 8,
      "commandes": [...]
    }
  ]
}
```

---

## 💡 CAS D'USAGE

### **Scénario 1 : Vérification quotidienne**

**Chaque matin :**

1. 📊 Ouvrir "Livraisons en cours"
2. ✅ Vérifier qu'il n'y a pas d'écarts
3. 👀 Voir ce qui est sorti avec chaque livreur
4. 📋 Préparer les retours éventuels

---

### **Scénario 2 : Retour de tournée**

**Quand un livreur revient :**

1. 📱 Le livreur marque les commandes LIVRÉE ou RETOURNE
2. ✅ Le stock se met à jour automatiquement
3. 📊 Vérifier sur "Livraisons en cours" que tout est correct
4. 🔄 Si écart, cliquer sur "Recalculer"

---

### **Scénario 3 : Détection d'anomalie**

**Si vous voyez une alerte rouge :**

1. ⚠️ Lire l'écart détecté
2. 🔍 Vérifier manuellement les commandes concernées
3. 🔧 Corriger manuellement si nécessaire
4. 🔄 Cliquer sur "Corriger les écarts maintenant"
5. ✅ Vérifier que l'alerte a disparu

---

### **Scénario 4 : Audit hebdomadaire**

**Chaque semaine :**

1. 📊 Ouvrir "Livraisons en cours"
2. 📋 Vérifier la vue par produit
3. 🚚 Vérifier la vue par livreur
4. 🔄 Lancer un recalcul préventif
5. 📊 Exporter les données si nécessaire

---

## 🎯 AVANTAGES DU SYSTÈME

### **1. Traçabilité Totale**
- Savoir exactement où est chaque unité de produit
- Historique complet des mouvements
- Responsabilité claire (qui a quoi)

### **2. Prévention des Pertes**
- Détection immédiate des anomalies
- Alerte en cas d'écart
- Correction automatique possible

### **3. Gain de Temps**
- Plus besoin de compter manuellement
- Calculs automatiques en temps réel
- Vue consolidée instantanée

### **4. Fiabilité**
- Source de vérité unique (base de données)
- Recalcul possible à tout moment
- Mouvements tracés automatiquement

### **5. Décision Éclairée**
- Données précises pour le réapprovisionnement
- Visibilité sur les produits populaires
- Optimisation des tournées

---

## ⚙️ INTÉGRATION AVEC LE SYSTÈME

### **Flux Automatique**

```
1. GESTIONNAIRE assigne commande → ASSIGNEE
   ↓
   Stock disponible → Stock en livraison (automatique)
   
2. LIVREUR marque LIVREE
   ↓
   Stock en livraison → Sorti définitivement (automatique)
   
3. LIVREUR marque RETOURNE
   ↓
   Stock en livraison → Stock disponible (automatique)
```

### **Vérification**

```
Page "Livraisons en cours"
   ↓
   Compare : Stock BDD VS Commandes réelles
   ↓
   Alerte si écart détecté
   ↓
   Correction automatique possible
```

---

## 📊 RAPPORT D'EXEMPLE

**Situation réelle (15/12/2024 - 14h30) :**

```
📊 RÉSUMÉ GLOBAL
  • 18 commandes en cours de livraison
  • 45 unités de produits sorties
  • 5 livreurs actifs
  • 8 produits différents

📦 TOP 3 PRODUITS EN LIVRAISON
  1. Crème Anti-Cerne : 12 unités (3 livreurs)
  2. Gaine Tourmaline : 10 unités (2 livreurs)
  3. Patch Anti-Cicatrice : 8 unités (2 livreurs)

🚚 TOP 3 LIVREURS
  1. Kouassi Jean : 15 unités (6 commandes)
  2. Bamba Marie : 12 unités (5 commandes)
  3. Traoré Mamadou : 10 unités (4 commandes)

✅ ÉTAT DU STOCK
  • Aucun écart détecté
  • Données à jour
  • Système cohérent
```

---

## ⚠️ BONNES PRATIQUES

### **À FAIRE ✅**

1. ✅ Vérifier la page chaque matin
2. ✅ Lancer un recalcul hebdomadaire
3. ✅ Corriger les écarts dès leur détection
4. ✅ Former les livreurs à bien marquer les statuts
5. ✅ Vérifier avant/après chaque tournée

### **À ÉVITER ❌**

1. ❌ Ignorer les alertes d'écarts
2. ❌ Modifier manuellement les stocks sans raison
3. ❌ Ne pas vérifier les retours de tournée
4. ❌ Laisser des commandes en statut ASSIGNEE trop longtemps
5. ❌ Changer les statuts de commandes manuellement sans comprendre l'impact

---

## 🆘 SUPPORT

### **Problème : Écart détecté**

**Solution :**
1. Vérifier les commandes concernées manuellement
2. Corriger le statut des commandes si nécessaire
3. Cliquer sur "Recalculer"

### **Problème : Stock négatif**

**Solution :**
1. Vérifier l'historique des mouvements
2. Identifier la source du problème
3. Ajuster manuellement le stock si nécessaire
4. Recalculer le stock en livraison

### **Problème : Livreur a plus que prévu**

**Solution :**
1. Vérifier si toutes les commandes ont été assignées correctement
2. Vérifier si des retours n'ont pas été marqués
3. Recalculer le stock

---

## 📞 CONTACT

Pour toute question ou problème, contactez l'administrateur système.

**Version :** 1.0  
**Date de création :** 15 décembre 2024  
**Dernière mise à jour :** 15 décembre 2024

---

## 🎓 FORMATION

**Durée recommandée :** 30 minutes

**Contenu :**
1. Présentation de la page (5 min)
2. Navigation et filtres (5 min)
3. Interprétation des données (10 min)
4. Gestion des écarts (5 min)
5. Exercices pratiques (5 min)

---

✅ **Ce système garantit une gestion précise et transparente du stock en cours de livraison !**

