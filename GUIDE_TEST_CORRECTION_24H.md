# 🧪 GUIDE DE TEST - CORRECTION BUG MODIFICATION < 24H

**Date :** 26 Décembre 2025  
**Testeur :** Nande Hermann (ADMIN)  
**Correction :** Bug modification livraison < 24h

---

## 🎯 **OBJECTIF DES TESTS**

Vérifier que le stock retourne dans le **bon compartiment** lors de la correction d'une livraison par le livreur dans les 24 heures.

---

## ⚠️ **IMPORTANT AVANT DE TESTER**

### **Attendre le déploiement Railway (2-3 minutes)**

Railway a détecté le push et va automatiquement :
1. Télécharger le nouveau code
2. Exécuter `npx prisma generate`
3. Redémarrer le serveur

**Vérifier le déploiement :**
- Aller sur : https://railway.app
- Projet : gs-pipeline-backend
- Onglet : Deployments
- Status : Should show "Active" avec le dernier commit

---

## 🧪 **TEST 1 : CORRECTION LOCAL (PRIORITAIRE)**

### **Préparation :**

1. **Créer un produit test** (si pas déjà existant)
   ```
   Menu : Gestion Stock → Produits
   Nom : "PRODUIT TEST CORRECTION"
   Code : "TEST-001"
   Prix : 5000 FCFA
   Stock initial : 100 unités
   ```

2. **Noter les stocks initiaux**
   ```
   Stock disponible : 100
   Stock en livraison : 0
   ```

### **Étape 1 : Créer une commande**

```
Menu : Nouvelles commandes
- Client : Test Correction
- Téléphone : 0123456789
- Ville : Abidjan
- Produit : PRODUIT TEST CORRECTION
- Quantité : 1
- Type : LOCAL
```

### **Étape 2 : Valider et assigner**

```
1. Appelant valide la commande (statut → VALIDEE)
2. Gestionnaire crée une tournée
3. Assigne à un livreur (ex: Hassan)
4. Statut → ASSIGNEE
```

**Vérifier stocks (ne doivent pas bouger) :**
```
Stock disponible : 100 ✅
Stock en livraison : 0 ✅
```

### **Étape 3 : Gestionnaire Stock confirme REMISE**

```
Menu : Gestion Stock → Tournées
1. Sélectionner la tournée
2. Cliquer "Confirmer remise"
3. Entrer : 1 colis
4. Confirmer
```

**Vérifier stocks (doivent bouger) :**
```
Stock disponible : 99 ✅ (100 - 1)
Stock en livraison : 1 ✅ (0 + 1)
```

**Vérifier mouvement créé :**
```
Menu : Gestion Stock → Produits → PRODUIT TEST → Mouvements
Dernier mouvement :
- Type : RESERVATION_LOCAL
- Quantité : 1
- Stock avant : 100 → 99
```

### **Étape 4 : Livreur marque LIVREE**

```
Connexion livreur (Hassan)
Menu : Mes livraisons
1. Trouver la commande "Test Correction"
2. Cliquer "Livrer"
3. Confirmer
```

**Vérifier stocks :**
```
Stock disponible : 99 ✅ (pas changé)
Stock en livraison : 0 ✅ (1 - 1)
```

**Vérifier mouvement créé :**
```
Type : LIVRAISON_LOCAL
Quantité : -1
Stock avant : 1 → 0
```

### **Étape 5 : Livreur corrige (< 24h) - LE TEST CRITIQUE !**

```
Menu : Mes livraisons → Onglet "Terminées"
1. Trouver la commande "Test Correction"
2. Cliquer sur "Modifier" (icône crayon)
3. Sélectionner nouveau statut : REFUSEE
4. Note : "Erreur, client absent"
5. Confirmer
```

**✅ VÉRIFIER STOCKS (CRITIQUE) :**
```
Stock disponible : 99 ✅ (PAS CHANGÉ - IMPORTANT !)
Stock en livraison : 1 ✅ (0 + 1 - RETOUR DANS LIVRAISON !)
```

**❌ SI INCORRECT (ancien bug) :**
```
Stock disponible : 100 ❌ (augmenté - MAUVAIS !)
Stock en livraison : 0 ❌ (pas changé - MAUVAIS !)
```

**Vérifier mouvement créé :**
```
Type : CORRECTION_LIVRAISON_LOCAL ← NOUVEAU TYPE !
Quantité : +1
Stock avant : 0 → 1
Motif : "Correction livraison LOCAL [...] - LIVREE → REFUSEE (< 24h) - Colis encore chez livreur"
```

### **Étape 6 : Gestionnaire Stock confirme RETOUR**

```
Menu : Gestion Stock → Tournées
1. Sélectionner la tournée
2. Cliquer "Confirmer retour"
3. Colis retournés : 1
4. Raison : "Client absent"
5. Confirmer
```

**Vérifier stocks finaux :**
```
Stock disponible : 100 ✅ (99 + 1 - retour au magasin)
Stock en livraison : 0 ✅ (1 - 1)
```

**Vérifier mouvement créé :**
```
Type : RETOUR_LOCAL
Quantité : +1
Stock avant : 99 → 100
```

---

## ✅ **RÉSULTAT ATTENDU TEST 1**

### **Flux complet :**

| Étape | Action | Stock Dispo | Stock Livraison | Mouvement |
|-------|--------|-------------|-----------------|-----------|
| 0 | Initial | 100 | 0 | - |
| 1-2 | Créer + Assigner | 100 | 0 | - |
| 3 | REMISE | 99 | 1 | RESERVATION_LOCAL |
| 4 | LIVREE | 99 | 0 | LIVRAISON_LOCAL |
| 5 | **CORRECTION** | **99** | **1** | **CORRECTION_LIVRAISON_LOCAL** |
| 6 | RETOUR | 100 | 0 | RETOUR_LOCAL |

**✅ Stock final = Stock initial (cohérence parfaite !)**

---

## 🧪 **TEST 2 : CORRECTION EXPEDITION (OPTIONNEL)**

### **Préparation :**

```
Stock disponible PRODUIT TEST : 100
```

### **Étape 1 : Créer EXPEDITION**

```
Menu : Nouvelles commandes
Type : EXPEDITION
Client : Test Expedition
Produit : PRODUIT TEST CORRECTION
Quantité : 1
Paiement : 5000 FCFA (100%)
```

**Vérifier stocks :**
```
Stock disponible : 99 ✅ (100 - 1 immédiatement)
```

### **Étape 2 : Assigner et REMISE**

```
Assigner à livreur
Gestionnaire Stock confirme remise (pour traçabilité)
```

**Vérifier stocks (ne bougent pas) :**
```
Stock disponible : 99 ✅ (déjà réduit à la création)
```

### **Étape 3 : Livreur marque LIVREE (expédié)**

```
Livreur confirme expédition avec code tracking
```

**Vérifier stocks (ne bougent pas) :**
```
Stock disponible : 99 ✅
```

### **Étape 4 : Correction < 24h**

```
Livreur corrige : LIVREE → REFUSEE
Raison : "Expédition échouée"
```

**Vérifier stocks :**
```
Stock disponible : 100 ✅ (99 + 1 - retour possible)
```

**Vérifier mouvement :**
```
Type : RETOUR_EXPEDITION ← NOUVEAU TYPE !
Quantité : +1
Stock avant : 99 → 100
```

---

## 🧪 **TEST 3 : CORRECTION EXPRESS (OPTIONNEL)**

### **Préparation :**

```
Stock disponible PRODUIT TEST : 100
Stock EXPRESS : 0
```

### **Étape 1 : Créer EXPRESS**

```
Menu : Nouvelles commandes
Type : EXPRESS
Client : Test Express
Produit : PRODUIT TEST CORRECTION
Quantité : 1
Paiement 10% : 500 FCFA
Agence : Abidjan
```

**Vérifier stocks :**
```
Stock disponible : 99 ✅ (100 - 1)
Stock EXPRESS : 1 ✅ (0 + 1)
```

### **Étape 2 : Client retire (paiement 90%)**

```
Menu : Commandes EXPRESS
Colis arrivé → Paiement final 4500 FCFA
```

**Vérifier stocks :**
```
Stock disponible : 99 ✅
Stock EXPRESS : 0 ✅ (1 - 1)
```

### **Étape 3 : Correction < 24h (cas rare)**

```
Admin annule : EXPRESS_LIVRE → ANNULEE
Raison : "Erreur de paiement"
```

**Vérifier stocks :**
```
Stock disponible : 99 ✅ (pas changé)
Stock EXPRESS : 1 ✅ (0 + 1 - retour réservation)
```

**Vérifier mouvement :**
```
Type : CORRECTION_EXPRESS ← NOUVEAU TYPE !
Quantité : +1
Stock avant : 0 → 1
```

---

## 📊 **CHECKLIST DE VALIDATION**

### **Test 1 - LOCAL (OBLIGATOIRE)**

- [ ] Stock disponible ne change pas lors de la correction
- [ ] Stock en livraison augmente lors de la correction
- [ ] Mouvement CORRECTION_LIVRAISON_LOCAL créé
- [ ] Motif contient "< 24h" et "Colis encore chez livreur"
- [ ] Stock final = Stock initial (cohérence)

### **Test 2 - EXPEDITION (RECOMMANDÉ)**

- [ ] Stock disponible augmente lors de la correction
- [ ] Mouvement RETOUR_EXPEDITION créé
- [ ] Motif contient "< 24h"

### **Test 3 - EXPRESS (OPTIONNEL)**

- [ ] Stock EXPRESS augmente lors de la correction
- [ ] Mouvement CORRECTION_EXPRESS créé

---

## ⚠️ **EN CAS D'ÉCHEC**

### **Symptômes d'échec :**

1. **Stock disponible augmente lors de correction LOCAL**
   → Le bug n'est pas corrigé

2. **Pas de mouvement CORRECTION_LIVRAISON_LOCAL**
   → Client Prisma pas à jour

3. **Erreur 500 lors de la correction**
   → Vérifier logs Railway

### **Solutions :**

```bash
# 1. Vérifier déploiement Railway
# Aller sur https://railway.app
# Vérifier que le dernier commit est déployé

# 2. Forcer redémarrage Railway
# Railway > Service > Restart

# 3. Vérifier logs Railway
# Railway > Service > Logs
# Chercher erreurs Prisma

# 4. Régénérer Prisma en local (si nécessaire)
cd "C:\Users\nande\Desktop\GS cursor"
npx prisma generate
```

---

## 📝 **RAPPORT DE TEST**

### **À remplir après les tests :**

**Test 1 - LOCAL :**
- Résultat : ☐ ✅ Réussi  ☐ ❌ Échoué
- Stock disponible après correction : ___ (devrait être 99)
- Stock en livraison après correction : ___ (devrait être 1)
- Mouvement créé : ☐ Oui ☐ Non
- Type de mouvement : _______________

**Test 2 - EXPEDITION :**
- Résultat : ☐ ✅ Réussi  ☐ ❌ Échoué
- Stock disponible après correction : ___ (devrait être 100)
- Mouvement créé : ☐ Oui ☐ Non

**Test 3 - EXPRESS :**
- Résultat : ☐ ✅ Réussi  ☐ ❌ Échoué
- Stock EXPRESS après correction : ___ (devrait être 1)
- Mouvement créé : ☐ Oui ☐ Non

**Conclusion globale :**
- ☐ Tous les tests réussis → Correction validée ✅
- ☐ Échecs détectés → À corriger ❌

---

## 🎯 **TEST RAPIDE (5 MINUTES)**

Si vous voulez tester rapidement uniquement le LOCAL :

```
1. Créer commande LOCAL → Assigner → REMISE → LIVREE
2. Noter : Stock disponible (X), Stock livraison (0)
3. Corriger vers REFUSEE
4. Vérifier : Stock disponible = X (PAS CHANGÉ)
5. Vérifier : Stock livraison = 1 (AUGMENTÉ)
6. Si OK → Correction fonctionne ! ✅
```

---

**Guide de test généré le 26 Décembre 2025**  
**Par : Assistant IA - GS Pipeline**


