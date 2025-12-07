# 📋 ACCÈS "TOUTES LES COMMANDES"

## 🎯 VUE D'ENSEMBLE

La page **"Toutes les commandes"** est maintenant accessible aux rôles suivants :
- ✅ **ADMIN** : Accès complet (visualisation + suppression)
- ✅ **GESTIONNAIRE** : Accès en lecture seule (visualisation uniquement)
- ✅ **APPELANT** : Accès en lecture seule (visualisation uniquement)

---

## 🔐 PERMISSIONS PAR RÔLE

### **1️⃣ ADMIN** 👑

| Permission | Accès |
|-----------|-------|
| Voir toutes les commandes | ✅ Oui |
| Filtrer par statut, produit, date | ✅ Oui |
| Rechercher par nom, téléphone, référence | ✅ Oui |
| **Supprimer une commande** | ✅ Oui |

**Interface** :
```
┌────────────────────────────────────────────────────────┐
│ Référence │ Client │ Téléphone │ ... │ Statut │ Actions│
├────────────────────────────────────────────────────────┤
│ CMD-123   │ Hassan │ 0778...   │ ... │ Nouvelle│  🗑️   │
│ CMD-124   │ Yao    │ 0708...   │ ... │ Livrée  │  🗑️   │
└────────────────────────────────────────────────────────┘
          ↑ Colonne "Actions" avec bouton de suppression
```

---

### **2️⃣ GESTIONNAIRE** 👔

| Permission | Accès |
|-----------|-------|
| Voir toutes les commandes | ✅ Oui |
| Filtrer par statut, produit, date | ✅ Oui |
| Rechercher par nom, téléphone, référence | ✅ Oui |
| **Supprimer une commande** | ❌ Non |

**Interface** :
```
┌──────────────────────────────────────────────────────┐
│ Référence │ Client │ Téléphone │ ... │ Statut │ Date │
├──────────────────────────────────────────────────────┤
│ CMD-123   │ Hassan │ 0778...   │ ... │ Nouvelle│ ... │
│ CMD-124   │ Yao    │ 0708...   │ ... │ Livrée  │ ... │
└──────────────────────────────────────────────────────┘
          ↑ PAS de colonne "Actions" (pas de suppression)
```

---

### **3️⃣ APPELANT** 📞

| Permission | Accès |
|-----------|-------|
| Voir toutes les commandes | ✅ Oui |
| Filtrer par statut, produit, date | ✅ Oui |
| Rechercher par nom, téléphone, référence | ✅ Oui |
| **Supprimer une commande** | ❌ Non |

**Interface** :
```
┌──────────────────────────────────────────────────────┐
│ Référence │ Client │ Téléphone │ ... │ Statut │ Date │
├──────────────────────────────────────────────────────┤
│ CMD-123   │ Hassan │ 0778...   │ ... │ Nouvelle│ ... │
│ CMD-124   │ Yao    │ 0708...   │ ... │ Livrée  │ ... │
└──────────────────────────────────────────────────────┘
          ↑ PAS de colonne "Actions" (pas de suppression)
```

---

## 🗺️ ACCÈS DANS LE MENU

### **ADMIN**

```
📱 Menu (Sidebar)
├─ 🏠 Dashboard
├─ 📞 À appeler
├─ 🛒 Commandes ← "Toutes les commandes"
├─ ⚡ Expéditions & EXPRESS
├─ 👥 Utilisateurs
├─ 🚚 Gestion des Tournées
├─ 📦 Gestion des Produits
├─ 📜 Historique Mouvements
├─ 💾 Base Clients
├─ 👁️ Supervision Appelants
└─ 📊 Statistiques
```

**URL** : `/admin/orders`

---

### **GESTIONNAIRE**

```
📱 Menu (Sidebar)
├─ 🏠 Dashboard
├─ 📞 À appeler
├─ 🛒 Toutes les commandes ← NOUVEAU 🆕
├─ ✅ Commandes validées
├─ ⚡ Expéditions & EXPRESS
├─ 🚚 Livraisons
├─ 💾 Base Clients
├─ 👁️ Supervision Appelants
└─ 📊 Statistiques
```

**URL** : `/gestionnaire/all-orders`

---

### **APPELANT**

```
📱 Menu (Sidebar)
├─ 🏠 Dashboard
├─ 📞 À appeler
├─ 🛒 Toutes les commandes ← NOUVEAU 🆕
├─ ⚡ Expéditions & EXPRESS
├─ ✅ Mes commandes traitées
├─ 💾 Base Clients
└─ 📊 Mes statistiques
```

**URL** : `/appelant/all-orders`

---

## 🎨 DIFFÉRENCES VISUELLES

### **Interface pour ADMIN**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Toutes les commandes                                         │
│ Gestion complète des commandes                                  │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Rechercher...                        [🔽 Filtres avancés]    │
├─────────────────────────────────────────────────────────────────┤
│ Référence │ Client │ Téléphone │ Ville │ Produit │ ... │ Actions│
├─────────────────────────────────────────────────────────────────┤
│ CMD-123   │ Hassan │ 077803... │ Bouaké│ Patch   │ ... │  🗑️   │ ← Bouton de suppression visible
└─────────────────────────────────────────────────────────────────┘
```

---

### **Interface pour GESTIONNAIRE / APPELANT**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Toutes les commandes                                         │
│ Gestion complète des commandes                                  │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 Rechercher...                        [🔽 Filtres avancés]    │
├─────────────────────────────────────────────────────────────────┤
│ Référence │ Client │ Téléphone │ Ville │ Produit │ Montant │ ... │
├─────────────────────────────────────────────────────────────────┤
│ CMD-123   │ Hassan │ 077803... │ Bouaké│ Patch   │ 9 900 F │ ... │ ← PAS de colonne "Actions"
└─────────────────────────────────────────────────────────────────┘
```

**Différence clé** : La colonne **"Actions"** avec le bouton de suppression 🗑️ n'apparaît **que pour l'ADMIN**.

---

## 🔧 FONCTIONNALITÉS COMMUNES

### **Recherche** 🔍

Tous les rôles peuvent rechercher par :
- ✅ Nom du client
- ✅ Numéro de téléphone
- ✅ Référence de commande

**Exemple** :
```
🔍 [hermann]
```
→ Affiche toutes les commandes de "Hermann Nande"

---

### **Filtres avancés** 🔽

Tous les rôles peuvent filtrer par :

| Filtre | Options |
|--------|---------|
| **Statut** | Tous, Nouvelle, À appeler, Validée, Assignée, etc. |
| **Produit** | Tous les produits (liste déroulante) |
| **Date début** | Sélecteur de date |
| **Date fin** | Sélecteur de date |

**Interface filtres** :
```
┌──────────────────────────────────────────────────┐
│ Statut        [v] Tous les statuts               │
│ Produit       [v] Tous les produits              │
│ Date début    [📅] jj/mm/aaaa                    │
│ Date fin      [📅] jj/mm/aaaa                    │
└──────────────────────────────────────────────────┘
```

---

### **Actualisation automatique** 🔄

- Rafraîchissement automatique **toutes les 30 secondes**
- Indicateur "Mis à jour il y a X s"
- Bouton "🔄 Actualiser" pour rafraîchir manuellement

---

### **Pagination** 📄

- **20 commandes par page**
- Navigation entre pages
- Indicateur "Page X sur Y"

---

## 📊 COLONNES AFFICHÉES

| Colonne | Description | Visible pour tous |
|---------|-------------|-------------------|
| **Référence** | Référence unique (CMD-xxx) | ✅ |
| **Client** | Nom du client | ✅ |
| **Téléphone** | Numéro de téléphone | ✅ |
| **Ville** | Ville du client | ✅ |
| **Produit** | Nom du produit commandé | ✅ |
| **Montant** | Montant total en FCFA | ✅ |
| **Statut** | Badge coloré du statut | ✅ |
| **Date** | Date de création | ✅ |
| **Actions** | Bouton de suppression 🗑️ | ❌ **Admin uniquement** |

---

## 🎯 CAS D'USAGE

### **Cas 1 : Gestionnaire supervise toutes les commandes**

**Besoin** : Le gestionnaire principal veut voir l'état de toutes les commandes en temps réel.

**Actions** :
1. Va dans **"Toutes les commandes"** (menu sidebar)
2. Applique un filtre par date (cette semaine)
3. Filtre par statut "NOUVELLE"
4. **Visualise** toutes les nouvelles commandes
5. ❌ **Ne peut pas** supprimer de commandes

---

### **Cas 2 : Appelant vérifie si une commande existe déjà**

**Besoin** : Un client rappelle pour savoir où en est sa commande.

**Actions** :
1. Va dans **"Toutes les commandes"**
2. Recherche par **nom du client** ou **téléphone**
3. **Visualise** la commande et son statut
4. Informe le client
5. ❌ **Ne peut pas** supprimer la commande

---

### **Cas 3 : Admin corrige une erreur de commande**

**Besoin** : Une commande a été créée par erreur avec de mauvaises données.

**Actions** :
1. Va dans **"Toutes les commandes"**
2. Recherche la commande par **référence**
3. Clique sur 🗑️ **Supprimer**
4. Confirme la suppression
5. ✅ **Peut** supprimer la commande (Admin uniquement)

---

## ⚠️ IMPORTANT : SUPPRESSION

### **Qui peut supprimer ?**

- ✅ **ADMIN** : Peut supprimer toutes les commandes
- ❌ **GESTIONNAIRE** : Ne peut PAS supprimer
- ❌ **APPELANT** : Ne peut PAS supprimer

---

### **Comportement de la suppression (Admin)**

Quand un Admin supprime une commande :

1. **Modal de confirmation** s'affiche avec :
   - Référence de la commande
   - Nom du client
   - Produit
   - Montant
   - **Avertissement si commande LIVRÉE** : Le stock sera restauré

2. **Si la commande était LIVRÉE** :
   - ✅ Le stock du produit est **restauré**
   - ✅ Un mouvement de stock de type "CORRECTION" est créé
   - ✅ L'historique est préservé

3. **Nettoyage** :
   - ✅ Mouvements de stock liés supprimés
   - ✅ Historique de statuts supprimé
   - ✅ Commande supprimée définitivement

---

## 🚀 DÉPLOIEMENT

### **Modifications apportées**

**Frontend** :

1. **`frontend/src/pages/admin/Orders.tsx`**
   - Ajout de `useAuthStore` pour récupérer le rôle
   - Variable `canDelete = user?.role === 'ADMIN'`
   - Colonne "Actions" conditionnée avec `{canDelete && ...}`
   - Bouton de suppression conditionné avec `{canDelete && ...}`

2. **`frontend/src/pages/gestionnaire/Dashboard.tsx`**
   - Ajout de la route `<Route path="all-orders" element={<AllOrders />} />`

3. **`frontend/src/pages/appelant/Dashboard.tsx`**
   - Ajout de la route `<Route path="all-orders" element={<AllOrders />} />`

4. **`frontend/src/components/Layout.tsx`**
   - Ajout du lien "Toutes les commandes" pour GESTIONNAIRE
   - Ajout du lien "Toutes les commandes" pour APPELANT

---

### **Backend**

Aucune modification backend nécessaire :
- ✅ Les permissions de suppression sont déjà en place (`authorize('ADMIN')`)
- ✅ Les permissions de visualisation sont déjà en place (tous les rôles)

---

## 🧪 TESTER

### **Test 1 : Gestionnaire (Lecture seule)**

1. Connectez-vous en tant que **GESTIONNAIRE**
2. Allez dans le menu sidebar
3. ✅ **Vérifiez** : Le lien "🛒 Toutes les commandes" est visible
4. Cliquez sur "Toutes les commandes"
5. ✅ **Vérifiez** : La page s'affiche avec toutes les commandes
6. ✅ **Vérifiez** : **PAS de colonne "Actions"**
7. ✅ **Vérifiez** : Vous pouvez rechercher et filtrer
8. ❌ **Vérifiez** : Aucun bouton de suppression 🗑️ visible

---

### **Test 2 : Appelant (Lecture seule)**

1. Connectez-vous en tant que **APPELANT**
2. Allez dans le menu sidebar
3. ✅ **Vérifiez** : Le lien "🛒 Toutes les commandes" est visible
4. Cliquez sur "Toutes les commandes"
5. ✅ **Vérifiez** : La page s'affiche avec toutes les commandes
6. ✅ **Vérifiez** : **PAS de colonne "Actions"**
7. ✅ **Vérifiez** : Vous pouvez rechercher et filtrer
8. ❌ **Vérifiez** : Aucun bouton de suppression 🗑️ visible

---

### **Test 3 : Admin (Accès complet)**

1. Connectez-vous en tant que **ADMIN**
2. Allez dans "🛒 Commandes"
3. ✅ **Vérifiez** : La page s'affiche avec toutes les commandes
4. ✅ **Vérifiez** : La colonne "Actions" **EST visible**
5. ✅ **Vérifiez** : Chaque ligne a un bouton 🗑️
6. Cliquez sur 🗑️ d'une commande test
7. ✅ **Vérifiez** : Modal de confirmation s'affiche
8. Confirmez la suppression
9. ✅ **Vérifiez** : La commande est supprimée

---

## ✅ RÉSUMÉ

**CE QUI A ÉTÉ FAIT** :

✅ **Gestionnaire Principal** peut voir toutes les commandes (lecture seule)
✅ **Appelant** peut voir toutes les commandes (lecture seule)
✅ **Admin** peut voir ET supprimer toutes les commandes
✅ Lien ajouté dans le menu pour GESTIONNAIRE et APPELANT
✅ Routes ajoutées dans les dashboards respectifs
✅ Colonne "Actions" masquée pour non-admin
✅ Bouton de suppression masqué pour non-admin

---

**AVANTAGES** :

- ✅ **Transparence** : Tous peuvent voir l'état des commandes
- ✅ **Sécurité** : Seul l'Admin peut supprimer
- ✅ **Productivité** : Gestionnaires et appelants peuvent vérifier les commandes sans déranger l'admin
- ✅ **Cohérence** : Même interface pour tous, seuls les droits changent

---

**DANS 3-5 MINUTES, RAFRAÎCHISSEZ ET TESTEZ L'ACCÈS ! 🚀**

**Gestionnaires et Appelants auront un nouveau lien "Toutes les commandes" dans leur menu ! ✨**




