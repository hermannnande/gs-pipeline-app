# 🔐 PERMISSIONS DU GESTIONNAIRE PRINCIPAL

## 📋 VUE D'ENSEMBLE

Le **Gestionnaire Principal** (`GESTIONNAIRE`) est le rôle le plus élevé après l'administrateur. Il a des **permissions étendues** sur toutes les fonctionnalités de gestion des commandes, y compris les **EXPÉDITIONS** et les **EXPRESS**.

---

## ✅ PERMISSIONS COMPLÈTES

### **1️⃣ EXPÉDITIONS** 🚚

Le gestionnaire principal peut :

| Action | Permission | Route API |
|--------|-----------|-----------|
| ✅ **Créer une EXPÉDITION** | Oui | `POST /api/orders/:id/expedition` |
| ✅ **Assigner un livreur** | Oui | `POST /api/orders/:id/expedition/assign` |
| ✅ **Voir toutes les expéditions** | Oui | `GET /api/orders?deliveryType=EXPEDITION` |
| ❌ **Marquer comme livré** | Non (Livreur uniquement) | `POST /api/orders/:id/expedition/livrer` |

**Workflow EXPÉDITION pour le Gestionnaire** :

```
1️⃣ CRÉER UNE EXPÉDITION
   └─> Sélectionne une commande "À appeler"
   └─> Clique "🚚 EXPÉDITION"
   └─> Confirme paiement 100% Mobile Money
   └─> Stock réduit immédiatement ✅

2️⃣ ASSIGNER UN LIVREUR
   └─> Va dans "Expéditions & EXPRESS" > Expéditions
   └─> Clique "Assigner livreur"
   └─> Sélectionne le livreur
   └─> Statut change : EXPEDITION → ASSIGNEE ✅

3️⃣ SUIVRE LA LIVRAISON
   └─> Le livreur confirme la livraison
   └─> Statut change : ASSIGNEE → LIVREE ✅
```

---

### **2️⃣ EXPRESS** ⚡

Le gestionnaire principal peut :

| Action | Permission | Route API |
|--------|-----------|-----------|
| ✅ **Créer un EXPRESS** | Oui | `POST /api/orders/:id/express` |
| ✅ **Marquer comme arrivé** | Oui | `PUT /api/orders/:id/express/arrive` |
| ✅ **Notifier le client** | Oui | `POST /api/orders/:id/express/notifier` |
| ✅ **Finaliser (retrait)** | Oui | `POST /api/orders/:id/express/finaliser` |
| ✅ **Voir tous les EXPRESS** | Oui | `GET /api/orders?deliveryType=EXPRESS` |

**Workflow EXPRESS pour le Gestionnaire** :

```
1️⃣ CRÉER UN EXPRESS
   └─> Sélectionne une commande "À appeler"
   └─> Clique "⚡ EXPRESS"
   └─> Sélectionne "Agence de retrait"
   └─> Confirme paiement 10% Mobile Money
   └─> Stock réservé en stockExpress ✅

2️⃣ MARQUER COMME ARRIVÉ EN AGENCE
   └─> Va dans "Expéditions & EXPRESS" > EXPRESS - À expédier
   └─> Clique "Marquer comme arrivé"
   └─> Statut change : EXPRESS → EXPRESS_ARRIVE ✅

3️⃣ NOTIFIER LE CLIENT
   └─> Va dans "Expéditions & EXPRESS" > EXPRESS - En agence
   └─> Clique "Notifier le client"
   └─> Badge "⚠️ À notifier" → "✓ Notifié" ✅

4️⃣ FINALISER LE RETRAIT
   └─> Client se présente à l'agence
   └─> Clique "Finaliser le retrait"
   └─> Confirme paiement 90% restant
   └─> Stock réduit de stockExpress ✅
   └─> Statut change : EXPRESS_ARRIVE → EXPRESS_LIVRE ✅
```

---

## 🆚 COMPARAISON DES RÔLES

### **GESTIONNAIRE vs APPELANT**

| Fonctionnalité | GESTIONNAIRE | APPELANT |
|----------------|--------------|----------|
| Créer EXPÉDITION | ✅ | ✅ |
| Créer EXPRESS | ✅ | ✅ |
| Assigner livreur EXPÉDITION | ✅ | ❌ |
| Marquer EXPRESS arrivé | ✅ | ✅ |
| Notifier client EXPRESS | ✅ | ✅ |
| Finaliser EXPRESS | ✅ | ✅ |
| Voir toutes les commandes | ✅ | ✅ (limitées) |
| Gérer les utilisateurs | ✅ | ❌ |
| Gérer les produits | ✅ | ❌ |

**Différence principale** : Le gestionnaire peut **assigner des livreurs** aux expéditions, contrairement aux appelants.

---

### **GESTIONNAIRE vs GESTIONNAIRE STOCK**

| Fonctionnalité | GESTIONNAIRE | GESTIONNAIRE STOCK |
|----------------|--------------|-------------------|
| Créer EXPÉDITION | ✅ | ❌ |
| Créer EXPRESS | ✅ | ❌ |
| Assigner livreur | ✅ | ❌ (voir seulement) |
| Voir expéditions/EXPRESS | ✅ | ✅ (pour préparation) |
| Gérer stock | ✅ | ✅ |
| Approvisionnements | ✅ | ✅ |

**Différence principale** : Le gestionnaire principal peut **créer et assigner** les expéditions/express, le gestionnaire de stock peut seulement les **voir et préparer**.

---

## 📊 TABLEAU RÉCAPITULATIF DES PERMISSIONS

### **Routes API EXPÉDITIONS & EXPRESS**

| Route | ADMIN | GESTIONNAIRE | APPELANT | STOCK | LIVREUR |
|-------|-------|--------------|----------|-------|---------|
| `POST /:id/expedition` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /:id/expedition/assign` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /:id/expedition/livrer` | ✅ | ❌ | ❌ | ❌ | ✅ |
| `POST /:id/express` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PUT /:id/express/arrive` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /:id/express/notifier` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /:id/express/finaliser` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `GET /api/orders` | ✅ | ✅ | ✅ (filtré) | ✅ (filtré) | ✅ (filtré) |

---

## 🎯 CAS D'USAGE POUR LE GESTIONNAIRE PRINCIPAL

### **Cas 1 : Gérer les expéditions du jour**

**Objectif** : Créer et assigner toutes les expéditions de la journée

```
1. Va dans "À appeler"
2. Pour chaque commande ville éloignée :
   a. Clique "🚚 EXPÉDITION"
   b. Confirme paiement 100%
3. Va dans "Expéditions & EXPRESS" > Expéditions
4. Utilise filtre "Livreur : Non assigné"
5. Assigne chaque expédition à un livreur disponible
6. Le gestionnaire de stock prépare les colis
7. Les livreurs confirment les livraisons
```

---

### **Cas 2 : Gérer les EXPRESS de bout en bout**

**Objectif** : Gérer un EXPRESS depuis la création jusqu'au retrait

```
1. CRÉATION (Gestionnaire)
   └─> Clique "⚡ EXPRESS"
   └─> Sélectionne agence "Bouaké"
   └─> Confirme paiement 10%

2. EXPÉDITION (Gestionnaire ou transporteur externe)
   └─> Colis envoyé vers Bouaké

3. ARRIVÉE (Gestionnaire)
   └─> Va dans "EXPRESS - À expédier"
   └─> Clique "Marquer comme arrivé"

4. NOTIFICATION (Gestionnaire ou Appelant)
   └─> Va dans "EXPRESS - En agence"
   └─> Clique "Notifier le client"
   └─> Appelle le client : "Votre colis est à Bouaké"

5. RETRAIT (Gestionnaire ou Appelant)
   └─> Client se présente à l'agence
   └─> Clique "Finaliser le retrait"
   └─> Confirme paiement 90%
   └─> Colis remis au client
```

---

### **Cas 3 : Supervision et statistiques**

**Objectif** : Suivre les performances et résoudre les blocages

```
1. VOIR LES EXPÉDITIONS BLOQUÉES
   └─> Filtres → Livreur : "Non assigné"
   └─> Assigne rapidement

2. VOIR LES EXPRESS EN ATTENTE
   └─> Filtres → Agence : "Yamoussoukro"
   └─> Badge "⚠️ À notifier" → Notifier tous les clients

3. STATISTIQUES PAR PÉRIODE
   └─> Filtres → Date début : 01/12/2025
   └─> Filtres → Date fin : 07/12/2025
   └─> Voir le nombre d'expéditions/EXPRESS de la semaine
```

---

## 🔄 WORKFLOW COMPLET

### **Vue d'ensemble des permissions du Gestionnaire Principal**

```
┌─────────────────────────────────────────────────────────────┐
│                  GESTIONNAIRE PRINCIPAL                      │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   EXPÉDITIONS        EXPRESS         SUPERVISION
        │                 │                 │
        ├─ Créer         ├─ Créer          ├─ Voir tout
        ├─ Assigner      ├─ Marquer arrivé ├─ Filtrer
        └─ Suivre        ├─ Notifier       ├─ Statistiques
                         ├─ Finaliser      └─ Gérer équipe
                         └─ Suivre
```

---

## 📝 NOTES IMPORTANTES

### **Permissions ajoutées le 6 décembre 2025** 🆕

- ✅ **POST /api/orders/:id/expedition** → Ajout de `GESTIONNAIRE`
- ✅ **POST /api/orders/:id/express** → Ajout de `GESTIONNAIRE`

**Avant** ❌ : Seuls APPELANT et ADMIN pouvaient créer des EXPÉDITIONS/EXPRESS
**Maintenant** ✅ : GESTIONNAIRE peut aussi créer des EXPÉDITIONS/EXPRESS

---

### **Permissions déjà présentes** ✅

Le gestionnaire avait déjà ces permissions :
- ✅ Assigner livreur à EXPÉDITION
- ✅ Marquer EXPRESS comme arrivé
- ✅ Notifier client EXPRESS
- ✅ Finaliser EXPRESS

---

## 🚀 DÉPLOIEMENT

- ✅ **Code modifié** : `routes/order.routes.js`
- ✅ **Permissions ajoutées** : GESTIONNAIRE pour création EXPÉDITION/EXPRESS
- ✅ **Tests** : Aucune régression
- ✅ **Poussé** sur GitHub
- ⏳ **Railway redéploie** (2-3 min)

---

## 🧪 TESTER LES NOUVELLES PERMISSIONS

### **Test 1 : Créer une EXPÉDITION**

1. Connectez-vous en **Gestionnaire Principal**
2. Allez dans **"À appeler"**
3. Sélectionnez une commande
4. Cliquez **"🚚 EXPÉDITION"**
5. Remplissez le formulaire (paiement 100%)
6. ✅ **Vérifiez** : L'expédition est créée avec succès

---

### **Test 2 : Créer un EXPRESS**

1. Connectez-vous en **Gestionnaire Principal**
2. Allez dans **"À appeler"**
3. Sélectionnez une commande
4. Cliquez **"⚡ EXPRESS"**
5. Sélectionnez une agence de retrait
6. Remplissez le formulaire (paiement 10%)
7. ✅ **Vérifiez** : L'EXPRESS est créé avec succès

---

### **Test 3 : Assigner un livreur**

1. Allez dans **"Expéditions & EXPRESS"** > Expéditions
2. Cliquez **"Assigner livreur"** sur une expédition
3. Sélectionnez un livreur
4. ✅ **Vérifiez** : Le livreur est assigné

---

## ✅ RÉSUMÉ

**LE GESTIONNAIRE PRINCIPAL PEUT MAINTENANT** :

✅ **Créer des EXPÉDITIONS** (paiement 100% Mobile Money)
✅ **Créer des EXPRESS** (paiement 10% initial)
✅ **Assigner des livreurs** aux expéditions
✅ **Marquer EXPRESS comme arrivé** en agence
✅ **Notifier les clients** EXPRESS
✅ **Finaliser les retraits** EXPRESS (paiement 90% restant)
✅ **Voir et filtrer** toutes les expéditions et EXPRESS
✅ **Gérer l'équipe** et les statistiques

**DANS 2-3 MINUTES, LE GESTIONNAIRE PRINCIPAL AURA TOUTES CES PERMISSIONS ! 🚀**

**Rafraîchissez et testez ! ✨**

