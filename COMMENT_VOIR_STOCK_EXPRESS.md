# 👀 COMMENT VOIR LE STOCK EXPRESS

## 📍 OÙ LE TROUVER

### **Dans la page "Gestion des Produits"**

1. Connectez-vous sur **obgestion.com**
2. Menu latéral → **"Gestion des Produits"**
3. Regardez n'importe quel produit

---

## 📊 CE QUE VOUS VERREZ

### **AFFICHAGE AVANT (Ancien)**
```
┌────────────────────────────────┐
│ Gaine Minceur Tourmaline       │
│ 9 900 FCFA                     │
│                                 │
│ Stock disponible : 45          │
│ ─────────────────              │
│ [███████████████░░░]           │
│                                 │
│ Seuil d'alerte: 10             │
└────────────────────────────────┘
```

### **AFFICHAGE APRÈS (Nouveau)** ✨
```
┌────────────────────────────────────────┐
│ Gaine Minceur Tourmaline               │
│ 9 900 FCFA                             │
│                                         │
│ Stock disponible : 45                  │
│ ──────────────────────                 │
│ [███████████████░░░]                   │
│                                         │
│ ⚡ Stock EXPRESS (réservé) : 3         │  ← NOUVEAU !
│ Clients ayant payé 10%, en attente     │
│                                         │
│ 📊 Stock total (physique) : 48         │  ← NOUVEAU !
│                                         │
│ Seuil d'alerte: 10                     │
└────────────────────────────────────────┘
```

---

## 🎨 COULEURS ET STYLES

### **Si Stock EXPRESS = 0** (Aucune réservation)
```
┌───────────────────────────────┐
│ ⚡ Stock EXPRESS (réservé) : 0│  ← Gris
│ Aucune réservation EXPRESS    │  ← Gris
└───────────────────────────────┘
```

### **Si Stock EXPRESS > 0** (Des clients attendent)
```
┌───────────────────────────────┐
│ ⚡ Stock EXPRESS (réservé) : 3│  ← Orange/Ambre
│ Clients ayant payé 10%...     │  ← Orange/Ambre
└───────────────────────────────┘
```

---

## 🔄 EXEMPLE EN TEMPS RÉEL

### **ÉTAPE 1 : État initial**

Vous avez 50 unités de "Crème Anti-Cerne" en stock :

```
┌────────────────────────────────┐
│ Crème Anti-Cerne               │
│                                 │
│ Stock disponible : 50          │
│ ⚡ Stock EXPRESS  : 0          │
│ 📊 Stock total   : 50          │
└────────────────────────────────┘
```

---

### **ÉTAPE 2 : Client paie 10% (EXPRESS créé)**

Un appelant crée un EXPRESS pour 2 unités :

```
┌────────────────────────────────┐
│ Crème Anti-Cerne               │
│                                 │
│ Stock disponible : 48  ← (-2)  │
│ ⚡ Stock EXPRESS  : 2   ← (+2) │  ← Stock déplacé !
│ 📊 Stock total   : 50          │  ← Inchangé
└────────────────────────────────┘
```

✅ **Explication :**
- Le stock **physique** n'a pas changé (toujours 50 unités)
- 2 unités sont **réservées** pour le client qui a payé 10%
- 48 unités restent **disponibles** pour d'autres commandes

---

### **ÉTAPE 3 : Client vient retirer (paie 90%)**

Le client vient en agence et paie les 90% restants :

```
┌────────────────────────────────┐
│ Crème Anti-Cerne               │
│                                 │
│ Stock disponible : 48          │
│ ⚡ Stock EXPRESS  : 0   ← (-2) │  ← Stock EXPRESS réduit !
│ 📊 Stock total   : 48  ← (-2)  │  ← Stock physique réduit
└────────────────────────────────┘
```

✅ **Explication :**
- Le client a retiré son colis
- Le stock EXPRESS passe de 2 à 0
- Le stock **physique total** passe de 50 à 48 (2 unités vendues)

---

## 📱 DANS L'HISTORIQUE DES MOUVEMENTS

Si vous allez dans **"Historique Mouvements"**, vous verrez :

```
┌─────────────────────────────────────────────────────────────┐
│ Type                 │ Quantité │ Stock avant → après        │
├─────────────────────────────────────────────────────────────┤
│ RESERVATION_EXPRESS  │ +2       │ Stock normal: 50 → 48     │
│                      │          │ Stock EXPRESS: 0 → 2      │
│ Motif: Réservation EXPRESS - CMD-XXX - Acompte payé        │
├─────────────────────────────────────────────────────────────┤
│ RETRAIT_EXPRESS      │ -2       │ Stock EXPRESS: 2 → 0      │
│ Motif: EXPRESS retiré par client - Agence Porto-Novo       │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏰ QUAND VERREZ-VOUS LE STOCK EXPRESS ?

### **MAINTENANT (Dans 5-10 minutes)**

Une fois Railway et Vercel redéployés :

1. Allez sur **obgestion.com**
2. Connectez-vous en **Admin** ou **Gestionnaire Stock**
3. Menu → **"Gestion des Produits"**
4. ✅ **VOUS VERREZ** sur chaque produit :
   - Stock disponible (normal)
   - ⚡ Stock EXPRESS (réservé)
   - 📊 Stock total (physique)

---

## 🧪 COMMENT TESTER

### **Test 1 : Créer un EXPRESS**

1. Connectez-vous en **Appelant**
2. Allez dans **"À appeler"**
3. Traitez une commande → Cliquez **"⚡ EXPRESS"**
4. Remplissez le formulaire (10%, agence, etc.)
5. Validez

### **Test 2 : Voir le stock EXPRESS**

1. Connectez-vous en **Admin** ou **Gestionnaire Stock**
2. Allez dans **"Gestion des Produits"**
3. Regardez le produit de la commande EXPRESS
4. ✅ **VOUS DEVRIEZ VOIR** :

```
Stock disponible : 44  (était 45 avant)
⚡ Stock EXPRESS : 1   (était 0 avant)
📊 Stock total   : 45  (inchangé)
```

---

## 🔍 SI VOUS NE VOYEZ PAS LE STOCK EXPRESS

### **Raison 1 : Migration pas encore appliquée sur Railway**

**Solution :**
- Attendez 5-10 minutes que Railway redéploie
- La migration s'appliquera automatiquement
- Rafraîchissez la page (F5)

### **Raison 2 : Aucun EXPRESS créé**

**Solution :**
- Si vous n'avez jamais créé d'EXPRESS, le stock EXPRESS sera à 0
- Créez un test EXPRESS pour voir le stock bouger
- Le champ apparaîtra quand même (affiché en gris)

### **Raison 3 : Cache du navigateur**

**Solution :**
- Rafraîchissez avec Ctrl + Shift + R (Windows)
- Ou videz le cache du navigateur

---

## ✅ CHECKLIST DE VÉRIFICATION

Après le redéploiement (dans 10 minutes) :

- [ ] Je vais sur obgestion.com
- [ ] Je me connecte en Admin ou Gestionnaire Stock
- [ ] Je vais dans "Gestion des Produits"
- [ ] Je vois **"Stock disponible"**
- [ ] Je vois **"⚡ Stock EXPRESS (réservé)"** ← NOUVEAU
- [ ] Je vois **"📊 Stock total (physique)"** ← NOUVEAU
- [ ] Je crée un EXPRESS pour tester
- [ ] Le stock EXPRESS augmente de +1
- [ ] Le stock disponible diminue de -1
- [ ] Le stock total reste identique

---

## 🎯 RÉSUMÉ VISUEL

```
AVANT EXPRESS :
┌──────────────────┐
│ Stock: 50        │
└──────────────────┘

CLIENT PAIE 10% (EXPRESS) :
┌──────────────────────────┐
│ Stock normal  : 48  ⬅️  │ Disponible pour vente
│ Stock EXPRESS : 2   🔒 │ Réservé (client a payé 10%)
│ ─────────────────────── │
│ Total physique: 50      │ Inchangé
└──────────────────────────┘

CLIENT RETIRE (PAIE 90%) :
┌──────────────────────────┐
│ Stock normal  : 48      │
│ Stock EXPRESS : 0   ⬅️  │ Client a retiré
│ ─────────────────────── │
│ Total physique: 48  ⬅️  │ 2 unités vendues
└──────────────────────────┘
```

---

**Le stock EXPRESS sera visible dans 10 minutes sur obgestion.com ! 🚀**

**Créez un EXPRESS pour le tester et voir le stock bouger en temps réel !** ⚡





