# 📦 GUIDE - STOCK LOCAL RÉSERVÉ (EN LIVRAISON)

## 🎯 OBJECTIF

Suivre précisément le **stock sorti avec chaque livreur** pour les livraisons locales et gérer automatiquement les retours de stock.

---

## 🔄 FONCTIONNEMENT

### **3 Types de stock pour chaque produit**

```
┌─────────────────────────────────────────┐
│  PRODUIT : Gaine Tourmaline Chauffante  │
├─────────────────────────────────────────┤
│  Stock disponible       : 50            │  ← Stock principal
│  Stock EXPRESS          : 5             │  ← Payé 10%, en attente retrait
│  Stock en livraison     : 12            │  ← Sorti avec les livreurs
├─────────────────────────────────────────┤
│  STOCK TOTAL (physique) : 67            │
└─────────────────────────────────────────┘
```

---

## 📊 FLUX DE STOCK

### **SCÉNARIO 1 : Livraison Locale Réussie**

```
ÉTAPE 1 : Appelant crée la commande
┌─────────────────────────┐
│ Stock disponible   : 50 │
│ Stock en livraison : 0  │
└─────────────────────────┘

ÉTAPE 2 : Gestionnaire assigne au livreur (ASSIGNEE)
↓ LE STOCK SE DÉPLACE AUTOMATIQUEMENT
┌─────────────────────────┐
│ Stock disponible   : 49 │  ← -1
│ Stock en livraison : 1  │  ← +1
└─────────────────────────┘
✅ Mouvement créé : RESERVATION_LOCAL

ÉTAPE 3 : Livreur marque LIVREE
↓
┌─────────────────────────┐
│ Stock disponible   : 49 │
│ Stock en livraison : 0  │  ← -1 (produit livré)
└─────────────────────────┘
✅ Mouvement créé : LIVRAISON_LOCAL
```

---

### **SCÉNARIO 2 : Colis Retourné (Client absent, refus, etc.)**

```
ÉTAPE 1 : Commande assignée au livreur
┌─────────────────────────┐
│ Stock disponible   : 50 │
│ Stock en livraison : 3  │
└─────────────────────────┘

ÉTAPE 2 : Livreur ne peut pas livrer (client absent)
→ Livreur marque RETOURNE avec raison

ÉTAPE 3 : Gestionnaire de stock confirme le retour
↓ LE STOCK REVIENT AUTOMATIQUEMENT
┌─────────────────────────┐
│ Stock disponible   : 51 │  ← +1 (retour)
│ Stock en livraison : 2  │  ← -1
└─────────────────────────┘
✅ Mouvement créé : RETOUR_LOCAL
```

---

## 👨‍💼 POUR LE GESTIONNAIRE DE STOCK

### **📱 Sur la page "Gestion des Produits"**

Vous voyez maintenant **3 indicateurs** pour chaque produit :

1. **Stock disponible** (vert) : Disponible pour nouvelles commandes
2. **⚡ Stock EXPRESS** (orange) : Réservé, clients ont payé 10%
3. **🚚 Stock en livraison** (bleu) : Sorti avec les livreurs

**Exemple d'affichage :**

```
┌──────────────────────────────────────┐
│  Crème Anti-Cerne                    │
│  CREME_ANTI_CERNE                    │
├──────────────────────────────────────┤
│  Stock disponible           : 28     │  ← Vert
│                                      │
│  ⚡ Stock EXPRESS (réservé)  : 11    │  ← Orange
│  Clients ayant payé 10%              │
│                                      │
│  🚚 Stock en livraison      : 6      │  ← Bleu  ⬅️ NOUVEAU
│  Stock sorti avec les livreurs       │
├──────────────────────────────────────┤
│  📊 Stock total (physique)  : 45     │
└──────────────────────────────────────┘
```

---

### **🔍 Voir le détail par livreur**

**API disponible :**

```
GET /api/products/stock-by-deliverer/:productId
```

**Réponse exemple :**

```json
{
  "stockByDeliverer": [
    {
      "delivererId": 5,
      "delivererNom": "Kouassi Jean",
      "quantite": 4,
      "commandes": [
        {
          "orderReference": "abc-123",
          "clientNom": "Mme Bamba",
          "quantite": 2
        },
        {
          "orderReference": "def-456",
          "clientNom": "M. Koné",
          "quantite": 2
        }
      ]
    },
    {
      "delivererId": 7,
      "delivererNom": "Traoré Marie",
      "quantite": 2,
      "commandes": [...]
    }
  ]
}
```

---

## 🛠️ WORKFLOW COMPLET

### **Pour les Appelants :**

1. Créer la commande (statut : VALIDEE)
2. ✅ Aucun changement de stock

### **Pour les Gestionnaires :**

1. Assigner la commande à un livreur
2. ✅ **Stock se déplace automatiquement** : disponible → en livraison
3. Remettre le colis au livreur

### **Pour les Livreurs :**

**CAS 1 : Livraison réussie**

1. Livrer le colis
2. Marquer "Livré" dans l'app
3. ✅ **Stock en livraison diminue** (produit livré définitivement)

**CAS 2 : Client absent/refuse**

1. Ramener le colis
2. Marquer "Retourné" avec raison
3. ✅ **Stock revient automatiquement** : en livraison → disponible

### **Pour le Gestionnaire de Stock :**

1. Vérifier les colis retournés
2. ✅ Le stock est déjà remonté automatiquement
3. Remettre le colis en stock physique

---

## 📊 STATISTIQUES

Dans la page **"Gestion des Produits"**, les statistiques incluent maintenant :

```
┌──────────────────────────────────────────────────┐
│  Total produits    │  Stock disponible  │  🚚 En livraison  │
│       13           │        229         │         18        │
├──────────────────────────────────────────────────┤
│  Alertes stock     │  Valeur stock                        │
│        6           │     1 802 050 F CFA                  │
└──────────────────────────────────────────────────┘
```

---

## 🔧 MOUVEMENTS DE STOCK

### **Nouveaux types de mouvements :**

| Type | Description | Impact |
|------|-------------|--------|
| `RESERVATION_LOCAL` | Commande assignée à livreur | Stock disponible → Stock en livraison |
| `LIVRAISON_LOCAL` | Colis livré avec succès | Stock en livraison → Sorti définitivement |
| `RETOUR_LOCAL` | Colis retourné par livreur | Stock en livraison → Stock disponible |

---

## ✅ AVANTAGES

1. **Traçabilité totale** : Savoir exactement quel stock est avec quel livreur
2. **Gestion automatique** : Pas besoin d'ajuster manuellement le stock
3. **Éviter les erreurs** : Le système calcule automatiquement les mouvements
4. **Visibilité en temps réel** : Voir immédiatement le stock disponible réel
5. **Comptabilité précise** : Historique complet des mouvements

---

## ⚠️ POINTS IMPORTANTS

1. **Le stock se déplace automatiquement** quand vous assignez un livreur
2. **Les retours sont gérés automatiquement** quand le livreur marque "Retourné"
3. **Le stock total = Stock disponible + Stock EXPRESS + Stock en livraison**
4. **Les commandes EXPEDITION et EXPRESS** ne sont PAS affectées par ce système

---

## 🎓 EXEMPLE COMPLET

**Situation de départ :**

- Crème Anti-Cerne : 50 unités en stock
- 0 en EXPRESS
- 0 en livraison

**10h00 :** 3 commandes créées et validées

→ Stock : 50 | Express : 0 | Livraison : 0

**11h00 :** 2 commandes assignées au livreur Jean

→ Stock : 48 | Express : 0 | Livraison : 2

**14h00 :** 1 commande créée en EXPRESS (10% payé)

→ Stock : 47 | Express : 1 | Livraison : 2

**16h00 :** Jean livre 1 commande, 1 client absent (retour)

→ Stock : 48 | Express : 1 | Livraison : 0

**Résultat :**

- 1 produit livré ✅
- 1 produit retourné au stock ♻️
- 1 produit en EXPRESS en attente de retrait ⚡
- 48 produits disponibles pour nouvelles commandes 📦

---

## 📞 SUPPORT

Pour toute question, contactez l'administrateur système.

**Version :** 1.0  
**Date :** 15 décembre 2024

