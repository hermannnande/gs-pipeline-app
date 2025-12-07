# 🧪 Guide de Test - Commandes et Système de Stock

## ✅ Ce qui a été fait

### 💰 Devise changée en Franc CFA (XOF)
- ✅ Tous les prix convertis de MAD à XOF
- ✅ Taux de conversion : 1 MAD ≈ 100 XOF
- ✅ Tous les montants mis à jour

### 📦 12 Commandes de test créées

**Répartition :**
- 📦 **6 commandes NOUVELLES** - À traiter par le système
- 📞 **3 commandes À APPELER** - Prêtes pour les appelants
- ✅ **3 commandes VALIDÉES** - Prêtes pour création de tournées

**Produits :**
- Montre Connectée Pro : **59 900 XOF** (4 commandes)
- Écouteurs Sans Fil : **19 900 XOF** (4 commandes)
- Batterie Externe 20000mAh : **14 900 XOF** (4 commandes)

**Clients fictifs :**
Tous basés au Sénégal (Dakar, Thiès, Saint-Louis, Rufisque, Mbour)

---

## 🎯 Comment tester tout le système

### 1️⃣ **Test en tant qu'APPELANT**

**Se connecter :**
- Email : `appelant@gs-pipeline.com`
- Mot de passe : `appelant123`

**Actions à tester :**
1. Aller dans "À appeler"
2. Voir les 3 commandes À APPELER
3. Cliquer sur une commande
4. Marquer comme "VALIDÉE" avec une note
5. Vérifier que la commande disparaît de votre liste
6. Aller dans "Mes statistiques" pour voir vos performances

**Résultat attendu :**
- Les commandes validées passent au Gestionnaire principal
- Vos stats se mettent à jour automatiquement

---

### 2️⃣ **Test en tant que GESTIONNAIRE**

**Se connecter :**
- Email : `gestionnaire@gs-pipeline.com`
- Mot de passe : `gestionnaire123`

**Actions à tester :**
1. Aller dans "Commandes validées"
2. Voir toutes les commandes VALIDÉES (au moins 3)
3. Créer une nouvelle tournée :
   - Nom : "Tournée Dakar Zone 1"
   - Date : Aujourd'hui
   - Livreur : Hassan Alami
   - Sélectionner 3-4 commandes
4. Valider la création
5. Aller dans "Livraisons" pour voir la tournée créée

**Résultat attendu :**
- Les commandes assignées passent au statut "ASSIGNEE"
- La tournée est visible par le Gestionnaire de Stock et le Livreur
- Les commandes disparaissent de la liste "Commandes validées"

---

### 3️⃣ **Test en tant que GESTIONNAIRE DE STOCK** ⭐ NOUVEAU

**Se connecter :**
- Email : `stock@gs-pipeline.com`
- Mot de passe : `stock123`

#### A) Confirmer la remise des colis

1. Aller dans "Tournées"
2. Voir la tournée créée par le Gestionnaire
3. Cliquer sur "Confirmer la remise"
4. Entrer le nombre de colis (ex: 4 colis)
5. Valider

**Résultat attendu :**
- La remise est enregistrée
- Le statut passe à "Remise confirmée"
- Le bouton change pour "Confirmer le retour"

#### B) Voir l'inventaire

1. Aller dans "Produits"
2. Voir les 3 produits avec leur stock actuel :
   - Montre : 50 unités
   - Écouteurs : 100 unités
   - Batterie : 75 unités
3. Tester l'ajustement de stock :
   - Cliquer sur "Ajuster le stock"
   - Type : Approvisionnement
   - Quantité : +20
   - Motif : "Réception fournisseur"
   - Valider

**Résultat attendu :**
- Le stock augmente de 20
- Un mouvement est créé dans l'historique

---

### 4️⃣ **Test en tant que LIVREUR**

**Se connecter :**
- Email : `livreur@gs-pipeline.com`
- Mot de passe : `livreur123`

**Actions à tester :**
1. Aller dans "Mes livraisons"
2. Voir la tournée assignée (4 commandes)
3. Pour chaque commande :
   - **2 commandes → Marquer "LIVREE"** ✅
   - **1 commande → Marquer "REFUSEE"** ❌
   - **1 commande → Laisser en attente**

**Résultat attendu :**
- Les statuts se mettent à jour
- **IMPORTANT : Le stock diminue automatiquement pour les 2 commandes LIVREES** 🎯
- Vos statistiques se mettent à jour

**Vérification du stock automatique :**
- Si vous avez livré 2 Montres → Stock passe de 50 à 48
- Si vous avez livré 1 Écouteurs → Stock passe de 100 à 99

---

### 5️⃣ **Test retour au GESTIONNAIRE DE STOCK**

**Retourner sur le compte :**
- Email : `stock@gs-pipeline.com`
- Mot de passe : `stock123`

#### A) Confirmer le retour des colis

1. Aller dans "Tournées"
2. Cliquer sur "Confirmer le retour"
3. Le système affiche :
   - Colis remis : 4
   - Colis livrés : 2 (d'après le livreur)
   - Colis attendus en retour : 2
4. Entrer le nombre de colis physiquement retournés : **2**
5. Le système calcule l'écart : `4 = 2 + 2` ✅ Pas d'écart
6. Valider

**Résultat attendu :**
- Les colis non livrés sont réintégrés au stock
- Les produits refusés retournent dans l'inventaire
- Un mouvement de type "RETOUR" est créé

#### B) Vérifier les mouvements

1. Aller dans "Mouvements"
2. Voir tous les mouvements de stock :
   - 🟢 APPROVISIONNEMENT (stock initial)
   - 🔴 LIVRAISON (commandes livrées - stock diminué)
   - 🔵 RETOUR (colis refusés - stock augmenté)
3. Filtrer par produit, par type, par date

**Résultat attendu :**
- Historique complet et traçable
- Pour chaque mouvement : date, quantité, stock avant/après, motif

---

### 6️⃣ **Test en tant qu'ADMIN**

**Se connecter :**
- Email : `admin@gs-pipeline.com`
- Mot de passe : `admin123`

**Actions à tester :**
1. **Commandes** : Voir toutes les commandes (tous statuts)
2. **Utilisateurs** : Gérer les comptes
3. **Statistiques** : Voir les performances de tous
   - Utiliser les filtres de période (Aujourd'hui, Cette semaine, etc.)
   - Voir les tableaux des appelants et livreurs
   - Vérifier les indicateurs de performance

**Résultat attendu :**
- Vision complète de tout le système
- Statistiques précises et à jour
- Filtres fonctionnels

---

## 🔄 Workflow complet à tester

### Scénario : Du début à la fin

1. **NOUVELLE commande** → arrive dans le système
2. **APPELANT** → appelle le client → valide (VALIDEE)
3. **GESTIONNAIRE** → crée une tournée → assigne au livreur (ASSIGNEE)
4. **GESTIONNAIRE STOCK** → confirme remise de 4 colis
5. **LIVREUR** → livre 2 commandes (LIVREE) → **Stock -2** ✅
6. **LIVREUR** → refuse 1 commande (REFUSEE)
7. **GESTIONNAIRE STOCK** → confirme retour de 2 colis → **Stock +2** ✅
8. **ADMIN** → voit les statistiques complètes

---

## 📊 Données de test créées

### Clients (12)
Tous au Sénégal avec adresses fictives :
- Dakar (Plateau, Almadies, Grand Yoff, Parcelles Assainies, Sacré-Cœur, Mermoz, Ouakam, Liberté 6)
- Thiès
- Saint-Louis
- Rufisque
- Mbour

### Produits (3)
| Code | Nom | Prix | Stock |
|------|-----|------|-------|
| MON-001 | Montre Connectée Pro | 59 900 XOF | 50 |
| ECO-001 | Écouteurs Sans Fil | 19 900 XOF | 100 |
| POW-001 | Batterie Externe 20000mAh | 14 900 XOF | 75 |

### Commandes (12 + 4 initiales = 16 total)
- 6 NOUVELLES
- 3 À APPELER
- 3 VALIDÉES
- 4 anciennes (du seed initial)

---

## 🎯 Points importants à vérifier

### ✅ Stock automatique
- Le stock ne diminue **QUE** quand on marque "LIVREE"
- Le stock remonte quand le Gestionnaire Stock confirme un retour
- Les commandes reçues n'impactent PAS le stock

### ✅ Traçabilité
- Tous les mouvements sont enregistrés
- Chaque action a un motif
- Historique complet disponible

### ✅ Contrôle des écarts
- Si `colis remis ≠ colis livrés + colis retour`, le système demande une explication

### ✅ Devise XOF
- Tous les montants affichés en Franc CFA
- Format : "59 900 XOF" ou "59 900 F CFA"

---

## 🚀 Pour créer plus de commandes

Si vous voulez créer encore plus de commandes de test :

```bash
node prisma/create-test-orders.js
```

Ce script crée automatiquement 12 nouvelles commandes variées.

---

## 📱 Accès au système

**Frontend :** `http://localhost:3001`  
**Backend :** `http://localhost:5000`

---

## 💡 Astuces de test

1. **Ouvrez plusieurs onglets** avec différents comptes pour voir les changements en temps réel
2. **Testez les filtres** sur chaque page
3. **Vérifiez les statistiques** après chaque action
4. **Regardez les mouvements de stock** après les livraisons
5. **Testez les écarts** en mettant volontairement un mauvais nombre de retours

---

**Bon test ! 🎉**

Tout le système est maintenant prêt avec des données réalistes en Franc CFA.








