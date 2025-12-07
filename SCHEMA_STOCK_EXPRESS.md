# 📊 SCHÉMA DU SYSTÈME DE STOCK EXPRESS

## 🎯 COMPRENDRE LES 2 STOCKS

Chaque produit a maintenant **2 stocks distincts** :

---

## 📦 STOCK NORMAL

**Utilisation :**
- Commandes de livraison locale
- Commandes EXPÉDITION (paiement 100%)

**Réduction :**
- ✅ Quand une commande locale est LIVRÉE
- ✅ Quand une EXPÉDITION est LIVRÉE par le livreur

**Exemple :**
```
Stock initial : 100
Client commande locale → Livré → Stock = 99
Client EXPÉDITION → Livré → Stock = 98
```

---

## ⚡ STOCK EXPRESS (Réservé)

**Utilisation :**
- UNIQUEMENT pour les commandes EXPRESS (paiement 10%)

**Augmentation :**
- ✅ Quand un appelant crée un EXPRESS (stock déplacé depuis stock normal)

**Réduction :**
- ✅ Quand le client vient retirer en agence et paie les 90%

**Exemple :**
```
Stock initial : 0
Client paie 10% → Stock EXPRESS = 1 (et stock normal -1)
Client retire + paie 90% → Stock EXPRESS = 0
```

---

## 🔄 MOUVEMENTS DE STOCK

### **SCÉNARIO 1 : Commande Locale Normale**

```
État initial :
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 100             │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Client commande → Livré
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99  ← (-1)      │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Mouvement créé :
Type: LIVRAISON
Quantité: -1
```

---

### **SCÉNARIO 2 : EXPÉDITION (Paiement 100%)**

```
État initial :
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 100             │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Client paie 100% → EXPÉDITION créée
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 100  ← Inchangé │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Livreur livre → Confirme "Livré"
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99   ← (-1)     │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Mouvement créé :
Type: LIVRAISON
Quantité: -1
```

---

### **SCÉNARIO 3 : EXPRESS (Paiement 10% puis 90%)**

```
État initial :
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 100             │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

ÉTAPE 1: Client paie 10% → EXPRESS créé
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99   ← (-1)     │
│ Stock EXPRESS : 1    ← (+1)     │
└─────────────────────────────────┘

Mouvement créé :
Type: RESERVATION_EXPRESS
Quantité: +1 (vers stock EXPRESS)
Motif: "Réservation EXPRESS - Acompte payé"

ÉTAPE 2: Colis expédié vers agence
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99               │
│ Stock EXPRESS : 1    ← Réservé  │
└─────────────────────────────────┘

ÉTAPE 3: Colis arrive en agence
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99               │
│ Stock EXPRESS : 1    ← Réservé  │
└─────────────────────────────────┘
Status: EXPRESS_ARRIVE

ÉTAPE 4: Client vient + paie 90% → Retrait finalisé
↓
┌─────────────────────────────────┐
│ Gaine Tourmaline                │
│ Stock normal  : 99               │
│ Stock EXPRESS : 0    ← (-1)     │
└─────────────────────────────────┘

Mouvement créé :
Type: RETRAIT_EXPRESS
Quantité: -1 (du stock EXPRESS)
Motif: "EXPRESS retiré par client - Agence XXX"
```

---

## 📈 EXEMPLE AVEC PLUSIEURS COMMANDES

```
État initial du stock :
┌─────────────────────────────────┐
│ Crème Anti-Cerne                │
│ Stock normal  : 50              │
│ Stock EXPRESS : 0               │
└─────────────────────────────────┘

Jour 1 - Matin:
• 3 commandes locales validées
• 2 EXPÉDITIONS créées (100% payés)
• 2 EXPRESS créés (10% payés)
↓
┌─────────────────────────────────┐
│ Crème Anti-Cerne                │
│ Stock normal  : 50              │
│ Stock EXPRESS : 2   ← Réservés  │
└─────────────────────────────────┘

Jour 1 - Soir:
• 3 commandes locales LIVRÉES
• 1 EXPÉDITION LIVRÉE
↓
┌─────────────────────────────────┐
│ Crème Anti-Cerne                │
│ Stock normal  : 46  ← -4        │
│ Stock EXPRESS : 2               │
└─────────────────────────────────┘

Jour 3:
• 2 EXPRESS arrivent en agence
• 1 client vient retirer (paie 90%)
↓
┌─────────────────────────────────┐
│ Crème Anti-Cerne                │
│ Stock normal  : 46              │
│ Stock EXPRESS : 1   ← -1        │
└─────────────────────────────────┘

STOCK TOTAL RÉEL : 46 + 1 = 47 unités
```

---

## ⚠️ IMPORTANT POUR LE GESTIONNAIRE DE STOCK

### **Quand préparer les colis EXPRESS ?**

Regardez dans **"Expéditions & EXPRESS"** > **"EXPRESS - À expédier"**

Pour chaque commande, le **stock est déjà réservé** :
- ✅ Stock normal a déjà été réduit
- ✅ Stock EXPRESS a déjà été augmenté
- ✅ Vous pouvez préparer le colis sans vous inquiéter

### **Comment vérifier le stock disponible ?**

Dans **"Gestion des Produits"** :

```
Stock disponible pour nouvelles commandes = Stock normal

Stock réservé pour clients EXPRESS = Stock EXPRESS

Stock total = Stock normal + Stock EXPRESS
```

### **Que faire si un client EXPRESS annule ?**

Si un client ne vient jamais retirer (rare) :
1. L'admin supprime la commande EXPRESS
2. Le système crée un mouvement : ANNULATION_EXPRESS
3. Stock normal +1, Stock EXPRESS -1
4. Le stock redevient disponible

---

## 📊 VUE D'ENSEMBLE DES STOCKS

### Page "Gestion des Produits" (MISE À JOUR)

Maintenant affiche :

```
┌────────────────────────────────────────────────┐
│ Gaine Minceur Tourmaline                       │
│ Code: GAINE_MINCEUR_TOURMALINE                 │
│ Prix: 9 900 FCFA                               │
│                                                 │
│ 📦 Stock normal    : 45 unités                 │
│ ⚡ Stock EXPRESS   : 3 unités (réservés)       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│ 📊 Stock total     : 48 unités                 │
│                                                 │
│ ⚠️ Seuil d'alerte  : 10 unités                 │
└────────────────────────────────────────────────┘
```

---

## 🎯 RÉSUMÉ POUR CHAQUE RÔLE

### APPELANT
- ✅ Crée EXPÉDITION/EXPRESS lors de l'appel
- ✅ Notifie les clients EXPRESS quand colis arrive
- ✅ Suit les colis en attente de retrait

### GESTIONNAIRE PRINCIPAL
- ✅ Voit tous les EXPÉDITION/EXPRESS
- ✅ Marque les colis comme "Arrivé en agence"
- ✅ Finalise les retraits EXPRESS

### GESTIONNAIRE DE STOCK
- ✅ Prépare les colis EXPÉDITION et EXPRESS
- ✅ Remet aux livreurs/transporteurs
- ✅ Gère le stock normal et stock EXPRESS

### ADMIN
- ✅ Gestion complète
- ✅ Tous les droits

---

**Tous les rôles ont maintenant accès au système ! 🚀**




