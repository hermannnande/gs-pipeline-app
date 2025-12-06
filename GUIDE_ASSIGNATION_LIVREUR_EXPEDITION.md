# 🚚 GUIDE D'ASSIGNATION DE LIVREUR POUR LES EXPÉDITIONS

## 🎯 WORKFLOW COMPLET

### **EXPÉDITION (Paiement 100% + Livreur assigné)**

```
1️⃣ CLIENT COMMANDE
   └─> Formulaire de commande → NOUVELLE

2️⃣ APPELANT APPELLE LE CLIENT
   └─> Va dans "À appeler"
   └─> Client confirme + Paie 100% par Mobile Money
   └─> Appelant clique "📦 EXPÉDITION"
   └─> Remplit: Mode paiement, Référence
   └─> ✅ EXPÉDITION créée
   └─> Statut: EXPEDITION

3️⃣ GESTIONNAIRE PRINCIPAL ASSIGNE UN LIVREUR
   └─> Va dans "⚡ Expéditions & EXPRESS"
   └─> Onglet "Expéditions"
   └─> Voit la commande avec statut "Non assigné"
   └─> Clique "Assigner livreur"
   └─> Sélectionne le livreur dans la liste
   └─> ✅ Livreur assigné
   └─> Statut: ASSIGNEE

4️⃣ GESTIONNAIRE DE STOCK PRÉPARE LE COLIS
   └─> Va dans "⚡ Expéditions & EXPRESS"
   └─> Onglet "Expéditions"
   └─> Voit la commande avec le livreur assigné
   └─> Prépare le colis (du stock normal)
   └─> Remet le colis au livreur

5️⃣ LIVREUR LIVRE LE COLIS
   └─> Va dans son dashboard livreur
   └─> Voit l'expédition dans "Mes livraisons"
   └─> Livre le colis au client dans la ville éloignée
   └─> Confirme "Livré"
   └─> ✅ Stock normal: -1
   └─> Statut: LIVREE
```

---

## 📱 INTERFACE GESTIONNAIRE PRINCIPAL

### **Page "⚡ Expéditions & EXPRESS"**

#### **Onglet "Expéditions"**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🚚 Expéditions en cours (3)                                         │
│ Commandes avec paiement 100% effectué, en attente de livraison       │
├──────────────────────────────────────────────────────────────────────┤
│ Référence  │ Client     │ Ville      │ Produit  │ Livreur │ Actions │
├──────────────────────────────────────────────────────────────────────┤
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ Non     │ [Assig] │← Clic ici !
│            │ 97123456   │            │ 9900 F   │ assigné │         │
├──────────────────────────────────────────────────────────────────────┤
│ CMD-12346  │ Marie K.   │ Parakou    │ Crème x2 │ ✓ Kofi  │ ✓ Ass.  │← Déjà assigné
│            │ 96789123   │            │ 8500 F   │ 91234567│         │
└──────────────────────────────────────────────────────────────────────┘
```

### **Modal "Assigner un livreur"**

Quand le gestionnaire clique "Assigner livreur" :

```
┌─────────────────────────────────────────┐
│ Assigner un livreur                     │
├─────────────────────────────────────────┤
│                                          │
│ 📦 Référence : CMD-12345                │
│ 👤 Client : Jean Dupont                 │
│ 📍 Ville : Porto-Novo                   │
│ 📦 Produit : Gaine Minceur x1           │
│                                          │
│ Sélectionner un livreur *               │
│ ┌────────────────────────────────────┐ │
│ │ [v] Choisir un livreur...          │ │← Menu déroulant
│ │  Kofi Mensah - 91234567            │ │
│ │  Ama Tété - 96456789               │ │
│ │  Yao Koffi - 97654321              │ │
│ └────────────────────────────────────┘ │
│                                          │
│ [Annuler]            [Assigner]         │
└─────────────────────────────────────────┘
```

---

## 📋 ÉTAPES DÉTAILLÉES POUR LE GESTIONNAIRE

### **Étape 1 : Accéder aux expéditions**

1. Connectez-vous en **Gestionnaire** sur obgestion.com
2. Menu latéral → **"⚡ Expéditions & EXPRESS"**
3. Vous êtes sur l'onglet **"Expéditions"** par défaut

### **Étape 2 : Identifier les expéditions non assignées**

Dans le tableau, regardez la colonne **"Livreur"** :

- ✅ **"Non assigné"** (en gris) → Besoin d'assigner un livreur
- ✅ **Nom du livreur** → Déjà assigné

### **Étape 3 : Assigner un livreur**

1. Cliquez sur le bouton **"Assigner livreur"**
2. Le modal s'ouvre avec les infos de la commande
3. Dans le menu déroulant, **sélectionnez un livreur**
4. Cliquez **"Assigner"**
5. ✅ Toast de confirmation : "Livreur assigné avec succès"
6. Le tableau se met à jour automatiquement

### **Étape 4 : Vérifier l'assignation**

Après assignation, dans le tableau :

```
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ ✓ Kofi  │ ✓ Assignée │
│            │ 97123456   │            │ 9900 F   │ 91234567│            │
```

- **Colonne "Livreur"** : Nom + Téléphone du livreur
- **Colonne "Actions"** : Badge "✓ Assignée" (vert)

---

## 🎯 POUR LE GESTIONNAIRE DE STOCK

### **Comment savoir à quel livreur remettre le colis ?**

1. Allez dans **"⚡ Expéditions & EXPRESS"** > **"Expéditions"**
2. Regardez la colonne **"Livreur"**
3. Préparez le colis
4. **Remettez-le au livreur indiqué**

### **Exemple visuel**

```
┌──────────────────────────────────────────────────────────────────────┐
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ ✓ Kofi  │ ✓ Ass.  │
│            │ 97123456   │            │ 9900 F   │ 91234567│         │← Donner à Kofi
└──────────────────────────────────────────────────────────────────────┘
```

👉 **Vous devez remettre ce colis à Kofi Mensah (91234567)**

---

## 📱 POUR LE LIVREUR

### **Comment voir mes expéditions à livrer ?**

1. Connectez-vous en **Livreur** sur obgestion.com
2. Dashboard → **"Mes livraisons"**
3. Vous verrez les expéditions assignées avec :
   - Nom du client
   - Adresse complète
   - Téléphone
   - Produit à livrer
   - Montant déjà payé (100%)

### **Comment confirmer la livraison ?**

1. Après avoir livré le colis au client
2. Dans "Mes livraisons", cliquez sur l'expédition
3. Cliquez **"Confirmer livraison"**
4. ✅ Stock réduit automatiquement
5. ✅ Statut passe à LIVREE

---

## 🔄 DIFFÉRENCE AVEC LIVRAISON LOCALE

### **Livraison Locale** (Dans la même ville)

```
1. Client commande
2. Appelant valide
3. Gestionnaire crée une liste de livraison
4. Assigne plusieurs commandes à un livreur
5. Livreur livre + Collecte paiement
6. Stock réduit à la livraison
```

### **EXPÉDITION** (Ville éloignée)

```
1. Client commande
2. Appelant appelle → Client paie 100% ← DIFFÉRENCE !
3. Gestionnaire assigne UN livreur ← NOUVEAU !
4. Livreur livre (pas de collecte, déjà payé)
5. Stock réduit à la livraison
```

---

## ❓ FAQ GESTIONNAIRE

### **Q1 : Puis-je réassigner un livreur ?**

❌ Non, une fois assigné, vous ne pouvez pas changer. Si erreur :
1. Contactez l'admin pour supprimer la commande
2. Recréez l'expédition
3. Assignez le bon livreur

### **Q2 : Que faire si aucun livreur n'apparaît dans la liste ?**

✅ Solutions :
1. Vérifiez qu'il existe des comptes **LIVREUR** actifs
2. Si aucun, allez dans **"Gestion des Utilisateurs"**
3. Créez un compte avec rôle **LIVREUR**

### **Q3 : Le gestionnaire de stock peut-il assigner un livreur ?**

❌ Non, seuls **ADMIN** et **GESTIONNAIRE** peuvent assigner.

Le gestionnaire de stock voit juste le nom du livreur pour savoir à qui remettre le colis.

### **Q4 : Quelle est la différence entre EXPEDITION et ASSIGNEE ?**

- **EXPEDITION** : Expédition créée, **en attente d'assignation** de livreur
- **ASSIGNEE** : Livreur assigné, **en attente de livraison**

Les deux apparaissent dans l'onglet "Expéditions".

### **Q5 : Le livreur peut-il livrer sans être assigné ?**

❌ Non. Pour qu'une expédition apparaisse dans le dashboard du livreur, elle **doit** être assignée par le gestionnaire.

---

## 🎨 BADGES ET INDICATEURS

### **Dans la colonne "Livreur"**

```
┌────────────────────────────┐
│ Non assigné                │ ← Gris, en italique
└────────────────────────────┘

┌────────────────────────────┐
│ Kofi Mensah                │ ← Noir, gras
│ 91234567                   │ ← Gris
└────────────────────────────┘
```

### **Dans la colonne "Actions"**

```
┌───────────────────────────────┐
│ [Assigner livreur]            │ ← Bouton bleu (si non assigné)
└───────────────────────────────┘

┌───────────────────────────────┐
│ ✓ Assignée                    │ ← Badge vert (si assigné)
└───────────────────────────────┘
```

---

## ✅ CHECKLIST GESTIONNAIRE

Avant de marquer une expédition comme prête :

- [ ] Client a payé 100% (vérifié par l'appelant)
- [ ] J'ai assigné un livreur à l'expédition
- [ ] Le gestionnaire de stock voit le nom du livreur
- [ ] Le colis est préparé et remis au livreur
- [ ] Le livreur voit l'expédition dans son dashboard
- [ ] Le livreur livre et confirme

---

## 🚀 RÉSUMÉ WORKFLOW COMPLET

```
📱 APPELANT                    🏢 GESTIONNAIRE              📦 STOCK              🚚 LIVREUR
     │                              │                          │                     │
     │ Appelle client               │                          │                     │
     │ Client paie 100%             │                          │                     │
     │ Crée EXPÉDITION              │                          │                     │
     ├─────────────────────────────>│                          │                     │
     │                              │ Assigne livreur          │                     │
     │                              │ ASSIGNEE                 │                     │
     │                              ├─────────────────────────>│                     │
     │                              │                          │ Prépare colis       │
     │                              │                          │ Voit nom livreur    │
     │                              │                          │ Remet au livreur    │
     │                              │                          ├────────────────────>│
     │                              │                          │                     │ Livre
     │                              │                          │                     │ Confirme
     │                              │<─────────────────────────┼─────────────────────┤
     │                              │                          │ Stock -1            │
     │                              │         LIVREE           │                     │
```

---

**SYSTÈME D'ASSIGNATION PRÊT ! 🚀**

**Dans 10 minutes, connectez-vous et testez l'assignation de livreur pour les expéditions !**

