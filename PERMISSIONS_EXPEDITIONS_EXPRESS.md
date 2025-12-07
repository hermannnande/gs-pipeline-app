# 🔐 PERMISSIONS - EXPÉDITIONS & EXPRESS

## 📋 TABLEAU RÉCAPITULATIF DES PERMISSIONS

| Action | ADMIN | GESTIONNAIRE | APPELANT | GESTIONNAIRE STOCK | LIVREUR |
|--------|-------|--------------|----------|-------------------|---------|
| **Voir la page Expéditions & EXPRESS** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Créer EXPÉDITION** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Créer EXPRESS** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assigner livreur EXPÉDITION** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Marquer EXPRESS arrivé en agence** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Notifier client EXPRESS** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Finaliser EXPRESS (90%)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Voir expéditions dans dashboard livreur** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Confirmer livraison EXPÉDITION** | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 👥 DÉTAILS PAR RÔLE

### **🔴 ADMIN** (Tous les droits)

**Page** : `/admin/expeditions`

**Peut faire** :
- ✅ Créer EXPÉDITION et EXPRESS
- ✅ Assigner des livreurs aux expéditions
- ✅ Marquer EXPRESS comme arrivé
- ✅ Notifier les clients EXPRESS
- ✅ Finaliser les retraits EXPRESS (90%)
- ✅ Voir toutes les expéditions et express
- ✅ Confirmer les livraisons

**Interface** :
- ✅ Bouton **"Assigner livreur"** visible pour expéditions non assignées
- ✅ Tous les boutons d'actions disponibles

---

### **🟠 GESTIONNAIRE PRINCIPAL** (Presque tous les droits)

**Page** : `/gestionnaire/expeditions`

**Peut faire** :
- ✅ Créer EXPÉDITION et EXPRESS
- ✅ **Assigner des livreurs aux expéditions** ⭐
- ✅ Marquer EXPRESS comme arrivé
- ✅ Notifier les clients EXPRESS
- ✅ Finaliser les retraits EXPRESS (90%)
- ✅ Voir toutes les expéditions et express
- ❌ Confirmer les livraisons (réservé au livreur)

**Interface** :
- ✅ Bouton **"Assigner livreur"** visible ⭐
- ✅ Tous les boutons d'actions disponibles sauf "Confirmer livraison"

**Rôle spécifique** :
```
Le gestionnaire principal est le SEUL (avec l'admin) 
à pouvoir assigner un livreur à une expédition
```

---

### **🟡 APPELANT** (Droits limités)

**Page** : `/appelant/expeditions`

**Peut faire** :
- ✅ Créer EXPÉDITION et EXPRESS (via "À appeler")
- ❌ **Assigner des livreurs** (réservé au gestionnaire) ⭐
- ✅ Marquer EXPRESS comme arrivé
- ✅ Notifier les clients EXPRESS
- ✅ Finaliser les retraits EXPRESS (90%)
- ✅ Voir toutes les expéditions et express

**Interface** :
- ❌ Bouton **"Assigner livreur"** CACHÉ ⭐
- ✅ Badge **"⏳ En attente d'assignation"** affiché à la place
- ✅ Tous les autres boutons disponibles (Marquer arrivé, Notifier, Finaliser)

**Restrictions** :
```
L'appelant voit les expéditions mais ne peut PAS assigner de livreur.
Il doit attendre que le gestionnaire principal l'assigne.
```

---

### **🟢 GESTIONNAIRE DE STOCK**

**Page** : `/stock/expeditions`

**Peut faire** :
- ✅ Voir toutes les expéditions et express
- ✅ Voir le nom du livreur assigné
- ❌ Assigner des livreurs
- ❌ Marquer EXPRESS comme arrivé
- ❌ Notifier les clients
- ❌ Finaliser les retraits

**Interface** :
- ❌ Aucun bouton d'action
- ✅ Vue en lecture seule avec nom du livreur
- ✅ Badge **"✓ Assignée - Préparer le colis"** pour expéditions assignées
- ✅ Badge **"⏳ En attente d'assignation"** pour expéditions non assignées

**Rôle spécifique** :
```
Le gestionnaire de stock voit les expéditions pour savoir 
quel colis préparer et à quel livreur le remettre.
Il n'a pas besoin d'actions dans le système.
```

---

### **🔵 LIVREUR**

**Page** : `/livreur/dashboard`

**Peut faire** :
- ✅ Voir ses expéditions assignées dans son dashboard
- ✅ Confirmer la livraison/expédition
- ❌ Voir la page "Expéditions & EXPRESS"

**Interface** :
- ✅ Section **"🚚 Mes EXPÉDITIONS à livrer"** dans le dashboard
- ✅ Bouton **"✓ Marquer comme expédié/livré"**
- ✅ Détails complets (client, adresse, produit, paiement)
- ✅ Badge **"✓ Déjà payé"** (client a payé 100%)

**Rôle spécifique** :
```
Le livreur voit uniquement les expéditions qui lui sont assignées.
Il confirme quand il a livré/expédié le colis.
```

---

## 🔄 WORKFLOW COMPLET AVEC PERMISSIONS

```
1️⃣ CRÉATION EXPÉDITION
   │
   ├─> APPELANT : Crée EXPÉDITION (client paie 100%)
   │   └─> Route : POST /api/orders/:id/expedition
   │   └─> Permissions : ADMIN, GESTIONNAIRE, APPELANT ✅
   │   └─> Stock : -1 immédiatement
   │
   └─> Statut : EXPEDITION

2️⃣ ASSIGNATION LIVREUR
   │
   ├─> GESTIONNAIRE : Assigne livreur Hassan
   │   └─> Route : POST /api/orders/:id/expedition/assign
   │   └─> Permissions : ADMIN, GESTIONNAIRE ⭐
   │   └─> ❌ APPELANT ne peut PAS assigner
   │
   └─> Statut : ASSIGNEE

3️⃣ PRÉPARATION COLIS
   │
   ├─> GESTIONNAIRE STOCK : Voit expédition + nom livreur
   │   └─> Prépare le colis
   │   └─> Remet à Hassan
   │
   └─> Pas de changement statut

4️⃣ LIVRAISON/EXPÉDITION
   │
   ├─> LIVREUR : Confirme livraison
   │   └─> Route : POST /api/orders/:id/expedition/livrer
   │   └─> Permissions : LIVREUR, ADMIN ✅
   │
   └─> Statut : LIVREE
```

---

## 🚫 RESTRICTIONS IMPORTANTES

### **Appelant ne peut PAS assigner de livreur**

**Raison** : Seul le gestionnaire principal connaît la disponibilité des livreurs et peut optimiser les tournées.

**Ce que voit l'appelant** :
```
┌────────────────────────────────────────────────┐
│ Référence  │ Client  │ Livreur  │ Actions     │
├────────────────────────────────────────────────┤
│ CMD-123    │ Marie   │ Non      │ ⏳ En att.  │← Pas de bouton
│            │         │ assigné  │ assignation │
└────────────────────────────────────────────────┘
```

**Ce que voit le gestionnaire** :
```
┌────────────────────────────────────────────────┐
│ Référence  │ Client  │ Livreur  │ Actions     │
├────────────────────────────────────────────────┤
│ CMD-123    │ Marie   │ Non      │ [Assigner]  │← Bouton visible
│            │         │ assigné  │             │
└────────────────────────────────────────────────┘
```

---

## 📊 PERMISSIONS DES ROUTES BACKEND

### **Routes EXPÉDITION**

| Route | Méthode | Permissions |
|-------|---------|------------|
| `/api/orders/:id/expedition` | POST | ADMIN, GESTIONNAIRE, APPELANT |
| `/api/orders/:id/expedition/assign` | POST | **ADMIN, GESTIONNAIRE** |
| `/api/orders/:id/expedition/livrer` | POST | ADMIN, LIVREUR |

### **Routes EXPRESS**

| Route | Méthode | Permissions |
|-------|---------|------------|
| `/api/orders/:id/express` | POST | ADMIN, GESTIONNAIRE, APPELANT |
| `/api/orders/:id/express/arrive` | PUT | **ADMIN, GESTIONNAIRE, APPELANT** |
| `/api/orders/:id/express/notifier` | POST | **ADMIN, GESTIONNAIRE, APPELANT** |
| `/api/orders/:id/express/finaliser` | POST | **ADMIN, GESTIONNAIRE, APPELANT** |

---

## ✅ VÉRIFICATION DES PERMISSIONS

### **Pour tester les permissions :**

#### **1. Connectez-vous en Appelant**
```
Email : appelant@gs-pipeline.com
Mot de passe : appelant123
```

**Vérifiez** :
- ✅ Vous voyez la page "Expéditions & EXPRESS"
- ✅ Vous voyez toutes les expéditions
- ❌ Vous NE voyez PAS le bouton "Assigner livreur"
- ✅ Vous voyez le badge "⏳ En attente d'assignation"
- ✅ Vous pouvez marquer EXPRESS comme arrivé
- ✅ Vous pouvez notifier les clients
- ✅ Vous pouvez finaliser les retraits EXPRESS

#### **2. Connectez-vous en Gestionnaire**
```
Email : gestionnaire@gs-pipeline.com
Mot de passe : gestionnaire123
```

**Vérifiez** :
- ✅ Vous voyez la page "Expéditions & EXPRESS"
- ✅ Vous voyez le bouton **"Assigner livreur"** ⭐
- ✅ Vous pouvez assigner un livreur
- ✅ Vous pouvez faire toutes les actions

#### **3. Connectez-vous en Gestionnaire Stock**
```
Email : stock@gs-pipeline.com
Mot de passe : stock123
```

**Vérifiez** :
- ✅ Vous voyez la page "Expéditions & EXPRESS"
- ✅ Vous voyez le nom du livreur assigné
- ❌ Vous NE voyez PAS de boutons d'action
- ✅ Vue en lecture seule

#### **4. Connectez-vous en Livreur**
```
Email : livreur@gs-pipeline.com
Mot de passe : livreur123
```

**Vérifiez** :
- ✅ Vous voyez vos expéditions dans le dashboard
- ✅ Vous avez le bouton "Marquer comme expédié/livré"
- ❌ Vous NE voyez PAS la page "Expéditions & EXPRESS"

---

## 📝 RÉSUMÉ

**PERMISSIONS CLARIFIÉES** :

1. ✅ **Appelants** : Accès complet SAUF assignation de livreur
2. ✅ **Gestionnaire** : Accès complet, SEUL à pouvoir assigner des livreurs (avec admin)
3. ✅ **Gestionnaire Stock** : Vue en lecture seule
4. ✅ **Livreur** : Voit ses expéditions dans son dashboard

**RESTRICTION PRINCIPALE** :
```
🚫 APPELANT ne peut PAS assigner de livreur
✅ Seul GESTIONNAIRE (et ADMIN) peut assigner
```

**TOUT EST CONFIGURÉ ET DÉPLOYÉ ! 🚀**





