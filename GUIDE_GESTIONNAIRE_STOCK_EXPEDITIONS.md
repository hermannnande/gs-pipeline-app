# 📦 GUIDE GESTIONNAIRE DE STOCK - EXPÉDITIONS

## 🎯 VOTRE RÔLE DANS LES EXPÉDITIONS

En tant que **Gestionnaire de Stock**, vous êtes responsable de :
1. ✅ **Voir** toutes les expéditions (assignées ou non)
2. ✅ **Préparer** les colis pour les expéditions assignées
3. ✅ **Remettre** les colis aux livreurs appropriés

**IMPORTANT** : Vous ne pouvez **PAS** assigner de livreurs. C'est le rôle du **Gestionnaire Principal**.

---

## 📱 ACCÉDER AUX EXPÉDITIONS

### **Connexion**
1. Allez sur **obgestion.com**
2. Connectez-vous avec vos identifiants :
   - Email : `stock@gs-pipeline.com`
   - Mot de passe : `stock123`

### **Navigation**
1. Menu latéral → **"⚡ Expéditions & EXPRESS"**
2. Vous arrivez sur l'onglet **"Expéditions"** par défaut

---

## 📊 COMPRENDRE LE TABLEAU DES EXPÉDITIONS

### **Vue d'ensemble**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🚚 Expéditions en cours (5)                                                │
│ Commandes avec paiement 100% effectué, en attente de livraison             │
├────────────────────────────────────────────────────────────────────────────┤
│ Référence  │ Client     │ Ville      │ Produit  │ Livreur    │ Actions    │
├────────────────────────────────────────────────────────────────────────────┤
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ Non        │ ⏳ En att. │
│            │ 97123456   │            │ 9900 F   │ assigné    │ assignation│
├────────────────────────────────────────────────────────────────────────────┤
│ CMD-12346  │ Marie K.   │ Parakou    │ Crème x2 │ ✓ Kofi     │ ✓ Assignée │← PRÉPARER !
│            │ 96789123   │            │ 8500 F   │ 91234567   │ Préparer   │
├────────────────────────────────────────────────────────────────────────────┤
│ CMD-12347  │ Paul A.    │ Bohicon    │ Savon x3 │ ✓ Ama      │ ✓ Assignée │← PRÉPARER !
│            │ 95456789   │            │ 5400 F   │ 96456789   │ Préparer   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 LES DIFFÉRENTS STATUTS

### **1️⃣ "Non assigné" - ⏳ En attente d'assignation**

```
│ CMD-12345  │ Jean D.    │ Porto-Novo │ Gaine x1 │ Non        │ ⏳ En att. │
│            │ 97123456   │            │ 9900 F   │ assigné    │ assignation│
```

**Signification :**
- ✅ Client a payé 100% par Mobile Money
- ⏳ Le gestionnaire principal n'a PAS encore assigné de livreur
- ❌ **NE PAS PRÉPARER** - Attendre l'assignation

**Action :**
- ⏳ Attendre que le gestionnaire principal assigne un livreur

---

### **2️⃣ "✓ [Nom du livreur]" - ✓ Assignée - Préparer le colis**

```
│ CMD-12346  │ Marie K.   │ Parakou    │ Crème x2 │ ✓ Kofi     │ ✓ Assignée │
│            │ 96789123   │            │ 8500 F   │ 91234567   │ Préparer   │
```

**Signification :**
- ✅ Client a payé 100%
- ✅ Livreur assigné : **Kofi Mensah** (91234567)
- 🎯 **À PRÉPARER MAINTENANT !**

**Action :**
1. ✅ Préparer le colis du **stock normal**
2. ✅ Étiqueter avec : Référence (CMD-12346), Client (Marie K.), Ville (Parakou)
3. ✅ Appeler le livreur **Kofi** au **91234567**
4. ✅ Lui remettre le colis

---

## 📋 WORKFLOW ÉTAPE PAR ÉTAPE

### **Étape 1 : Identifier les colis à préparer**

1. Connectez-vous
2. Menu → **"⚡ Expéditions & EXPRESS"**
3. Regardez la colonne **"Actions"**
4. Cherchez les lignes avec **"✓ Assignée - Préparer le colis"**

---

### **Étape 2 : Vérifier les détails**

Pour chaque expédition assignée, notez :

```
Référence : CMD-12346
Client : Marie Konan
Téléphone : 96789123
Ville : Parakou
Produit : Crème Anti-Cerne x2
Montant : 8 500 FCFA (DÉJÀ PAYÉ ✅)
Livreur : Kofi Mensah - 91234567
```

---

### **Étape 3 : Préparer le colis**

1. ✅ Allez au **stock normal** (pas le stock EXPRESS)
2. ✅ Prenez **2 unités** de Crème Anti-Cerne
3. ✅ Emballez soigneusement
4. ✅ Étiquetez le colis :
   ```
   ┌──────────────────────────────┐
   │ CMD-12346                    │
   │ Client : Marie Konan         │
   │ Tél : 96789123               │
   │ Ville : Parakou              │
   │ Produit : Crème x2           │
   │ Livreur : Kofi - 91234567    │
   └──────────────────────────────┘
   ```

---

### **Étape 4 : Contacter le livreur**

1. ✅ Appelez **Kofi** au **91234567**
2. ✅ Informez-le : "Bonjour Kofi, j'ai un colis EXPÉDITION pour Parakou. Référence CMD-12346. Quand peux-tu passer ?"
3. ✅ Notez l'heure prévue

---

### **Étape 5 : Remettre le colis au livreur**

Quand le livreur arrive :

1. ✅ Vérifiez son identité (Kofi Mensah)
2. ✅ Donnez-lui le colis CMD-12346
3. ✅ Confirmez l'adresse : Parakou
4. ✅ Rappelez : "Client a déjà payé 100%. Pas de collecte d'argent."
5. ✅ Le livreur part livrer

---

## ⚠️ IMPORTANT : STOCK NORMAL vs STOCK EXPRESS

### **EXPÉDITION → Stock Normal** 📦

```
Pour les EXPÉDITIONS :
- Client a payé 100%
- Prendre du STOCK NORMAL
- Stock réduit APRÈS livraison confirmée
```

### **EXPRESS → Stock EXPRESS** ⚡

```
Pour les EXPRESS :
- Client a payé 10%
- Prendre du STOCK EXPRESS (déjà réservé)
- Stock réduit APRÈS retrait en agence
```

---

## 🎨 CODES COULEURS ET BADGES

### **Badge Jaune/Ambre** ⏳
```
⏳ En attente d'assignation
```
→ **NE PAS PRÉPARER** - Attendre

### **Badge Vert** ✅
```
✓ Assignée - Préparer le colis
```
→ **PRÉPARER MAINTENANT** !

---

## 📱 EXEMPLE COMPLET

### **Situation**

Vous vous connectez et voyez :

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CMD-12346  │ Marie K.   │ Parakou    │ Crème x2 │ ✓ Kofi     │ ✓ Assignée │
│            │ 96789123   │            │ 8500 F   │ 91234567   │ Préparer   │
├────────────────────────────────────────────────────────────────────────────┤
│ CMD-12347  │ Paul A.    │ Bohicon    │ Savon x3 │ ✓ Ama      │ ✓ Assignée │
│            │ 95456789   │            │ 5400 F   │ 96456789   │ Préparer   │
└────────────────────────────────────────────────────────────────────────────┘
```

### **Actions à faire**

#### **Colis 1 : CMD-12346**

1. ✅ Préparer 2 Crèmes Anti-Cerne du stock normal
2. ✅ Étiqueter : CMD-12346, Marie K., Parakou, Kofi
3. ✅ Appeler Kofi (91234567)
4. ✅ Lui remettre le colis

#### **Colis 2 : CMD-12347**

1. ✅ Préparer 3 Savons du stock normal
2. ✅ Étiqueter : CMD-12347, Paul A., Bohicon, Ama
3. ✅ Appeler Ama (96456789)
4. ✅ Lui remettre le colis

---

## ❓ QUESTIONS FRÉQUENTES

### **Q1 : Je vois "Non assigné". Que faire ?**

✅ **Réponse :** 
- Ne rien faire
- Attendre que le gestionnaire principal assigne un livreur
- Rafraîchir la page de temps en temps (ou la page se rafraîchit automatiquement toutes les 30 secondes)

---

### **Q2 : Puis-je assigner un livreur moi-même ?**

❌ **Non**. Seuls le **Gestionnaire Principal** et l'**Admin** peuvent assigner des livreurs.

Votre rôle est de **préparer** et **remettre** les colis aux livreurs assignés.

---

### **Q3 : Le stock EXPRESS et le stock normal sont-ils au même endroit ?**

✅ **Réponse :**
- Physiquement, c'est le même entrepôt
- Mais dans le système, ils sont séparés
- Pour les **EXPÉDITIONS** → Stock **normal**
- Pour les **EXPRESS** → Stock **EXPRESS** (réservé)

**Conseil :** Organisez une étagère séparée pour les colis EXPRESS pour éviter la confusion.

---

### **Q4 : Comment savoir si j'ai bien pris du bon stock ?**

✅ **Réponse :**

**Regardez la colonne "Type"** (si visible) ou **le statut** :

- **EXPÉDITION** / **ASSIGNEE** → Stock **normal** ✅
- **EXPRESS** / **EXPRESS_ARRIVE** → Stock **EXPRESS** ⚡

Si vous êtes dans l'onglet **"Expéditions"**, c'est **toujours le stock normal**.

---

### **Q5 : Que se passe-t-il après que j'ai remis le colis au livreur ?**

✅ **Réponse :**

1. Le livreur part livrer le colis
2. Le livreur confirme la livraison dans son dashboard
3. Le stock normal se réduit automatiquement
4. La commande passe en statut LIVREE
5. Elle disparaît de votre liste "Expéditions"

---

### **Q6 : Je ne vois aucune expédition. Est-ce normal ?**

✅ **Réponse :**

Oui, c'est normal si :
- Aucun appelant n'a créé d'EXPÉDITION récemment
- Toutes les expéditions ont déjà été livrées

**Pour tester :**
1. Demandez à un appelant de créer une EXPÉDITION test
2. Demandez au gestionnaire de l'assigner à un livreur
3. Rafraîchissez la page
4. Vous devriez voir l'expédition

---

## 🔄 SUIVI EN TEMPS RÉEL

La page se **rafraîchit automatiquement** toutes les **30 secondes**.

Vous n'avez pas besoin de recharger la page manuellement.

Si une nouvelle expédition est assignée, elle apparaîtra automatiquement.

---

## ✅ CHECKLIST GESTIONNAIRE DE STOCK

Pour chaque expédition assignée :

- [ ] J'ai vérifié la référence de la commande
- [ ] J'ai noté le nom du client et le téléphone
- [ ] J'ai noté la ville de destination
- [ ] J'ai préparé le bon produit et la bonne quantité
- [ ] J'ai pris du **stock normal** (pas EXPRESS)
- [ ] J'ai étiqueté le colis clairement
- [ ] J'ai noté le nom et téléphone du livreur
- [ ] J'ai contacté le livreur
- [ ] J'ai remis le colis au bon livreur
- [ ] J'ai rappelé que le client a déjà payé 100%

---

## 🎯 RÉSUMÉ VISUEL

```
VOTRE RÔLE
    │
    ├─> 1. Voir les expéditions assignées
    │
    ├─> 2. Préparer les colis (stock normal)
    │
    ├─> 3. Contacter les livreurs
    │
    └─> 4. Remettre les colis aux livreurs
```

---

## 📞 BESOIN D'AIDE ?

Si vous rencontrez un problème :

1. ✅ Vérifiez que vous êtes sur la bonne page : **"⚡ Expéditions & EXPRESS"** > **"Expéditions"**
2. ✅ Rafraîchissez la page (F5)
3. ✅ Contactez le gestionnaire principal ou l'admin

---

**VOUS ÊTES PRÊT À GÉRER LES EXPÉDITIONS ! 📦🚀**

**Dans 10 minutes, connectez-vous et vous verrez toutes les expéditions (assignées ou non) !**

