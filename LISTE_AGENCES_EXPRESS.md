# 📍 LISTE DES AGENCES DE RETRAIT EXPRESS

## 🗂️ VILLES PAR ORDRE ALPHABÉTIQUE

La liste des agences de retrait pour les commandes EXPRESS a été mise à jour avec **24 villes** de Côte d'Ivoire, triées par ordre alphabétique :

1. **Beoumi**
2. **Bocanda**
3. **Bonon**
4. **Bouaflé**
5. **Bouaké**
6. **Daloa**
7. **Dimbokro**
8. **Divo**
9. **Duékoué**
10. **Gabiadji**
11. **Gagnoa**
12. **Gonaté**
13. **Guibéroua**
14. **Hiré**
15. **Issia**
16. **Man**
17. **Méagui**
18. **San Pedro**
19. **Sinfra**
20. **Soubré**
21. **Tiébissou**
22. **Toumodi**
23. **Yabayo**
24. **Yamoussoukro**

---

## 📋 OÙ CETTE LISTE EST UTILISÉE

### **Modal EXPRESS** (Création d'un EXPRESS)

Quand un appelant crée un EXPRESS (paiement 10%), il doit sélectionner une **agence de retrait** parmi ces 24 villes.

**Chemin** : `frontend/src/components/modals/ExpressModal.tsx`

**Interface** :
```
┌─────────────────────────────────────┐
│ Agence de retrait *                 │
│ ┌─────────────────────────────────┐ │
│ │ [v] Sélectionnez...             │ │
│ │  Beoumi                         │ │
│ │  Bocanda                        │ │
│ │  Bonon                          │ │
│ │  Bouaflé                        │ │
│ │  Bouaké                         │ │
│ │  ...                            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎯 UTILISATION

### **Workflow EXPRESS**

```
1️⃣ CLIENT COMMANDE
   └─> Ville éloignée (ex: Bouaké)

2️⃣ APPELANT CRÉE EXPRESS
   ├─> Client paie 10% Mobile Money
   ├─> Sélectionne "Agence de retrait" : Bouaké ⭐
   └─> Confirme

3️⃣ COLIS EXPÉDIÉ VERS BOUAKÉ
   └─> Stock EXPRESS réservé

4️⃣ GESTIONNAIRE MARQUE ARRIVÉ
   └─> Colis arrive à l'agence de Bouaké

5️⃣ APPELANT NOTIFIE CLIENT
   └─> "Votre colis est arrivé à Bouaké"

6️⃣ CLIENT VIENT RETIRER
   └─> Paie 90% à l'agence de Bouaké
```

---

## 📊 STATISTIQUES PAR AGENCE

Vous pouvez voir les statistiques par agence dans la page **"Expéditions & EXPRESS"** :

- Nombre d'EXPRESS par agence
- EXPRESS en attente de retrait
- EXPRESS livrés

---

## 🔍 FILTRAGE PAR AGENCE

Dans la page **"Expéditions & EXPRESS"** > Onglet **"EXPRESS - En agence"**, vous pouvez filtrer par agence :

```
┌──────────────────────────────────────┐
│ Agence : [v] Toutes les agences      │
│           Beoumi                      │
│           Bocanda                     │
│           Bouaké                      │
│           ...                         │
└──────────────────────────────────────┘
```

---

## ⚠️ IMPORTANT

### **Calcul des frais d'expédition**

Les frais d'expédition peuvent varier selon la ville de destination :

- **Villes proches** (ex: Yamoussoukro) : Frais réduits
- **Villes éloignées** (ex: San Pedro, Man) : Frais plus élevés

**Note** : Le montant affiché au client doit inclure les frais d'expédition + le prix du produit.

---

## 📱 EXEMPLE CONCRET

### **Commande EXPRESS pour Daloa**

**Détails** :
- Produit : Gaine Minceur Tourmaline (9 900 FCFA)
- Ville client : Daloa
- Agence de retrait : **Daloa** ⭐

**Paiements** :
- **10% initial** : 990 FCFA (Mobile Money)
- **90% au retrait** : 8 910 FCFA (Cash à l'agence de Daloa)

**Process** :
1. Appelant sélectionne **"Daloa"** dans la liste déroulante
2. Stock EXPRESS réservé
3. Colis expédié vers Daloa
4. Client notifié quand le colis arrive à Daloa
5. Client vient à l'agence de Daloa, paie 8 910 FCFA, récupère son colis

---

## ✅ AVANTAGES DE CETTE LISTE

1. ✅ **Ordre alphabétique** : Facile à trouver une ville
2. ✅ **24 villes** : Couverture complète de la Côte d'Ivoire
3. ✅ **Simplicité** : Nom de ville uniquement (pas "Agence de...")
4. ✅ **Traçabilité** : Suivi par agence facilité

---

## 🔄 MISE À JOUR DE LA LISTE

Pour ajouter ou supprimer une ville :

1. Ouvrir : `frontend/src/components/modals/ExpressModal.tsx`
2. Trouver la section `<select>` avec `agenceRetrait`
3. Ajouter/supprimer/modifier les `<option>`
4. **Maintenir l'ordre alphabétique** ⭐
5. Commit et push

**Exemple** :
```tsx
<option value="Nouvelle Ville">Nouvelle Ville</option>
```

---

## 📋 VÉRIFICATION

### **Pour tester la nouvelle liste :**

1. Connectez-vous en **Appelant**
2. Allez dans **"À appeler"**
3. Sélectionnez une commande
4. Cliquez **"⚡ EXPRESS"**
5. Dans le formulaire, cliquez sur **"Agence de retrait"**
6. ✅ **Vérifiez** : Vous voyez les 24 villes par ordre alphabétique

---

**LISTE MISE À JOUR ET DÉPLOYÉE ! 🚀**

**Dans 3-5 minutes, rafraîchissez et testez la nouvelle liste !**

