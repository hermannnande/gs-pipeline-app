# 👥 GUIDE UTILISATEUR - EXPÉDITION & EXPRESS
## Par rôle

---

## 📞 POUR LES APPELANTS

### **Accès au système**
✅ Menu latéral → **"⚡ Expéditions & EXPRESS"**

### **Créer une EXPÉDITION ou EXPRESS**

1. Allez dans **"À appeler"**
2. Cliquez sur **"Traiter l'appel"** sur une commande
3. Vous avez maintenant **3 options** :

#### **Option 1 : Livraison locale normale** ✅
- Client dans la même ville
- Client paie à la livraison
- Cliquez **"✅ Commande validée (Livraison locale)"**

#### **Option 2 : EXPÉDITION** 📦
**Quand utiliser :** Client dans une ville éloignée + **PAIE 100%** par Mobile Money

**Étapes :**
1. Cliquez **"📦 EXPÉDITION (Paiement 100%)"**
2. Modal s'ouvre
3. Remplissez :
   - Mode de paiement (Orange Money, MTN, Moov, Wave)
   - Référence de transaction
   - Note (optionnel)
4. Cliquez **"Confirmer EXPÉDITION"**

✅ **Résultat :**
- Commande disparaît de "À appeler"
- Apparaît dans "Expéditions & EXPRESS" > Onglet "Expéditions"
- Stock normal reste intact (sera réduit à la livraison)

#### **Option 3 : EXPRESS** ⚡
**Quand utiliser :** Client dans une ville éloignée + **PAIE SEULEMENT 10%**

**Étapes :**
1. Cliquez **"⚡ EXPRESS (Paiement 10%)"**
2. Modal s'ouvre avec calcul automatique :
   - Montant total : 9 900 FCFA
   - Acompte 10% : **990 FCFA**
   - Restant 90% : **8 910 FCFA**
3. Remplissez :
   - Montant payé (pré-rempli à 990 FCFA)
   - Mode de paiement
   - Référence de transaction
   - **Agence de retrait** ← IMPORTANT
   - Note (optionnel)
4. Cliquez **"Confirmer EXPRESS"**

✅ **Résultat :**
- Commande disparaît de "À appeler"
- Apparaît dans "Expéditions & EXPRESS" > "EXPRESS - À expédier"
- Stock déplacé : Stock normal -1, Stock EXPRESS +1

### **Suivre les EXPRESS en agence**

1. Allez dans **"Expéditions & EXPRESS"**
2. Cliquez sur l'onglet **"EXPRESS - En agence"**
3. Vous voyez les colis arrivés, en attente de retrait
4. Pour chaque colis :
   - ✅ Badge "✓ Notifié" → Client déjà informé
   - ⚠️ Badge "À notifier" → **VOUS DEVEZ APPELER LE CLIENT**

**Pour notifier un client :**
1. Cliquez sur **"Notifier le client"**
2. Appelez le client pour lui dire :
   - "Votre colis est arrivé à l'agence [Nom agence]"
   - "Vous devez payer [Montant restant] FCFA pour le retirer"
   - "Venez avec votre pièce d'identité"
3. Badge devient "✓ Notifié"

---

## 🏢 POUR LE GESTIONNAIRE PRINCIPAL

### **Accès au système**
✅ Menu latéral → **"⚡ Expéditions & EXPRESS"**

### **Gérer les EXPÉDITIONS**

1. Allez dans **"Expéditions & EXPRESS"**
2. Onglet **"Expéditions"** :
   - Voir toutes les expéditions en cours
   - Client a déjà payé 100%
   - Coordonner avec le gestionnaire de stock

### **Gérer les EXPRESS**

#### **Onglet "EXPRESS - À expédier"**
- Voir les colis avec 10% payé
- Coordonner avec le gestionnaire de stock pour préparation
- **Bouton "Marquer arrivé"** : Quand le colis arrive en agence

#### **Onglet "EXPRESS - En agence"**
- Voir les colis arrivés, en attente client
- Vérifier que les appelants notifient les clients
- **Bouton "Client a retiré"** : Finaliser quand client vient

**Pour finaliser un retrait EXPRESS :**
1. Client vient en agence
2. Client paie les 90% restants
3. Cliquez **"Client a retiré"**
4. Modal s'ouvre
5. Remplissez :
   - Montant payé (pré-rempli avec 90%)
   - Mode de paiement (Cash, Mobile Money, etc.)
   - Référence (si Mobile Money)
6. Cliquez **"Finaliser"**

✅ **Résultat :**
- Stock EXPRESS réduit de 1
- Commande passe en "EXPRESS_LIVRE"
- Apparaît dans l'historique

---

## 📦 POUR LE GESTIONNAIRE DE STOCK

### **Accès au système**
✅ Menu latéral → **"⚡ Expéditions & EXPRESS"**

### **Votre rôle**

Vous êtes responsable de :
1. **Préparer** les colis EXPÉDITION et EXPRESS
2. **Emballer** les produits
3. **Remettre** les colis aux livreurs/transporteurs
4. **Gérer** le stock spécial EXPRESS

### **Préparer une EXPÉDITION**

1. Allez dans **"Expéditions & EXPRESS"** → Onglet **"Expéditions"**
2. Vous voyez toutes les expéditions avec **paiement 100%**
3. Pour chaque commande :
   - Client : [Nom]
   - Ville : [Ville destination]
   - Produit : [Nom produit] (x Quantité)
   - **Montant déjà payé** : ✅ 9 900 FCFA

**Actions :**
1. Prenez le produit du **stock normal**
2. Emballez le colis
3. Préparez l'étiquette avec :
   - Nom client
   - Téléphone
   - Ville destination
   - Référence commande
4. Remettez au livreur/transporteur
5. **Important :** Le livreur confirmera la livraison dans son dashboard
6. Quand le livreur confirme "Livré" → Stock normal est réduit automatiquement

### **Préparer un EXPRESS**

1. Allez dans **"Expéditions & EXPRESS"** → Onglet **"EXPRESS - À expédier"**
2. Vous voyez tous les EXPRESS avec **acompte 10% payé**
3. Pour chaque commande :
   - Client : [Nom]
   - Agence destination : **[Nom agence]** ← IMPORTANT
   - Produit : [Nom produit]
   - **Acompte payé** : ✅ 990 FCFA (10%)
   - **Restant** : ⚠️ 8 910 FCFA (à payer au retrait)

**Actions :**
1. ⚠️ **ATTENTION** : Le stock est déjà réservé dans le **Stock EXPRESS**
2. Prenez le produit (déjà compté dans stock EXPRESS, pas stock normal)
3. Emballez le colis
4. Préparez l'étiquette avec :
   - Nom client
   - Téléphone
   - **Agence de destination** ← IMPORTANT
   - Référence commande
   - **"À PAYER : 8 910 FCFA"** ← IMPORTANT sur le colis
5. Remettez au transporteur vers l'agence
6. Informez l'admin/gestionnaire quand le colis part
7. L'admin marquera "Arrivé en agence"

### **Gérer le stock EXPRESS**

**Comprendre le stock EXPRESS :**

Dans **"Gestion des Produits"**, chaque produit a maintenant **2 stocks** :

```
┌─────────────────────────────────────────┐
│ Gaine Minceur Tourmaline                │
│                                          │
│ Stock normal    : 45   ← Disponible     │
│ Stock EXPRESS   : 3    ← Réservé 10%    │
│ Stock total     : 48                     │
└─────────────────────────────────────────┘
```

**Stock normal** : Disponible pour ventes normales et expéditions
**Stock EXPRESS** : Réservé pour clients qui ont payé 10%, en attente de retrait

**Quand le stock EXPRESS diminue :**
- Quand le client vient retirer et paie les 90%
- Stock EXPRESS -1 automatiquement

---

## 👨‍💼 POUR L'ADMINISTRATEUR

### **Accès au système**
✅ Menu latéral → **"⚡ Expéditions & EXPRESS"**

### **Vue d'ensemble**

Vous avez accès à **4 onglets** pour gérer tout le processus :

#### **Onglet 1 : Expéditions** 📦
- Toutes les expéditions (paiement 100%)
- Suivi des livraisons
- Coordination avec le gestionnaire de stock

#### **Onglet 2 : EXPRESS - À expédier** ⚡
- Colis avec 10% payé
- En attente d'expédition vers l'agence
- **Action** : Marquer comme "Arrivé" quand le transporteur confirme

#### **Onglet 3 : EXPRESS - En agence** 🏢
- **Colis arrivés, en attente client**
- Badge "✓ Notifié" ou "⚠️ À notifier"
- **Actions** :
  - Notifier le client (si pas encore fait)
  - Finaliser le retrait (quand client vient)

#### **Onglet 4 : Historique** ✅
- Tous les EXPRESS livrés
- Filtres par date, agence
- Rapports et statistiques

### **Actions importantes**

#### **Marquer un EXPRESS comme arrivé en agence**
1. Onglet "EXPRESS - À expédier"
2. Cliquez **"Marquer arrivé"** sur une commande
3. Confirmez
4. ✅ Colis passe dans "EXPRESS - En agence"

#### **Finaliser un retrait EXPRESS**
1. Client vient en agence
2. Client paie les 90% restants
3. Onglet "EXPRESS - En agence"
4. Cliquez **"Client a retiré"**
5. Remplissez :
   - Montant payé (pré-rempli)
   - Mode de paiement (Cash ou Mobile Money)
   - Référence transaction (si Mobile Money)
6. Cliquez **"Finaliser"**

✅ **Résultat :**
- Stock EXPRESS réduit automatiquement
- Commande passe en "EXPRESS_LIVRE"
- Apparaît dans l'historique

---

## 📊 TABLEAU RÉCAPITULATIF

| Critère | LIVRAISON LOCALE | EXPÉDITION | EXPRESS |
|---------|------------------|------------|---------|
| **Zone** | Même ville | Autre ville | Autre ville |
| **Paiement initial** | 0% | **100%** | **10%** |
| **Paiement final** | 100% à domicile | 0% | **90% en agence** |
| **Livraison** | À domicile | À domicile | **Retrait en agence** |
| **Stock réduit quand ?** | À la livraison | À la livraison | Au retrait en agence |
| **Qui livre ?** | Livreur local | Livreur/Transporteur | Client retire lui-même |
| **Statut final** | LIVREE | LIVREE | EXPRESS_LIVRE |

---

## 🔄 FLUX DE TRAVAIL COMPLET

### EXPÉDITION
```
[APPELANT]
└─> Appelle client
    └─> Client paie 100%
        └─> Crée EXPÉDITION

[GESTIONNAIRE STOCK]
└─> Prépare le colis
    └─> Remet au livreur

[LIVREUR]
└─> Livre le colis
    └─> Confirme "Livré"
        └─> Stock normal -1
```

### EXPRESS
```
[APPELANT]
└─> Appelle client
    └─> Client paie 10%
        └─> Crée EXPRESS
            └─> Stock normal -1, Stock EXPRESS +1

[GESTIONNAIRE STOCK]
└─> Prépare le colis (du stock EXPRESS)
    └─> Remet au transporteur vers agence

[ADMIN/GESTIONNAIRE]
└─> Marque "Arrivé en agence"
    └─> Status = EXPRESS_ARRIVE

[APPELANT]
└─> Notifie le client par téléphone
    └─> "Votre colis est arrivé"

[CLIENT]
└─> Vient en agence
    └─> Paie 90% restants

[ADMIN/GESTIONNAIRE]
└─> Finalise le retrait
    └─> Stock EXPRESS -1
    └─> Status = EXPRESS_LIVRE
```

---

## 📍 ACCÈS PAR RÔLE

| Rôle | Menu | Ce qu'ils peuvent faire |
|------|------|-------------------------|
| **APPELANT** | ⚡ Expéditions & EXPRESS | Voir, Notifier clients EXPRESS arrivés |
| **GESTIONNAIRE** | ⚡ Expéditions & EXPRESS | Voir, Marquer arrivé, Finaliser retraits |
| **GESTIONNAIRE STOCK** | ⚡ Expéditions & EXPRESS | Voir, Préparer colis |
| **ADMIN** | ⚡ Expéditions & EXPRESS | Tout gérer |

---

## 💡 CONSEILS PRATIQUES

### Pour les APPELANTS
- 📞 Appelez toujours les clients EXPRESS dès que le colis arrive
- 📝 Notez les références de transaction Mobile Money
- ✅ Vérifiez que le mode de paiement est correct

### Pour le GESTIONNAIRE DE STOCK
- 📦 Préparez les colis EXPRESS différemment (étiquette spéciale)
- 📌 Marquez clairement le montant restant à payer sur le colis EXPRESS
- 🏢 Vérifiez l'agence de destination avant de remettre au transporteur

### Pour l'ADMIN/GESTIONNAIRE
- 🔔 Assurez-vous que les appelants notifient les clients rapidement
- 📊 Suivez les délais de retrait (si trop long, relancer le client)
- 💰 Vérifiez que le montant payé au final correspond bien au total

---

## 🎯 INDICATEURS CLÉS

### Dashboard "Expéditions & EXPRESS"

Vous verrez des **compteurs** sur chaque onglet :

```
[Expéditions (5)]  [EXPRESS - À expédier (3)]  [EXPRESS - En agence (7)]  [Historique (42)]
```

Ces chiffres se mettent à jour automatiquement toutes les 30 secondes !

---

## ⚠️ IMPORTANT

### **Stock EXPRESS**
- ⚠️ Le stock EXPRESS est **réservé** pour les clients qui ont payé 10%
- ⚠️ Ne PAS utiliser ce stock pour d'autres commandes
- ✅ Le stock EXPRESS se libère automatiquement quand le client retire

### **Agences disponibles**
- Agence Cotonou Centre
- Agence Porto-Novo
- Agence Parakou
- Agence Abomey-Calavi
- Agence Bohicon
- Agence Djougou
- Agence Natitingou
- Autre (à spécifier)

---

**Guide complet créé pour tous les utilisateurs ! 🚀**







