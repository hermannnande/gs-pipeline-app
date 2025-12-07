# 👤 GUIDE GESTION DES UTILISATEURS - ADMIN

## 🎯 VUE D'ENSEMBLE

En tant qu'**Admin**, vous pouvez maintenant **créer, modifier et supprimer** tous les types d'utilisateurs, y compris les **Gestionnaires de Stock**.

---

## 📊 TABLEAU DE BORD UTILISATEURS

### **Accès**
```
Menu → Utilisateurs
```

### **Statistiques rapides** 📈

Vous verrez 5 cartes avec le nombre d'utilisateurs actifs par rôle :

```
┌───────────┬───────────────┬─────────┬──────────┬─────────┐
│  ADMIN    │ GESTIONNAIRE  │  STOCK  │ APPELANT │ LIVREUR │
│     1     │       2       │    1    │     8    │    2    │
└───────────┴───────────────┴─────────┴──────────┴─────────┘
```

---

## ✅ 1. CRÉER UN UTILISATEUR

### **Étapes** :

1. Cliquez sur **"➕ Nouvel utilisateur"** (en haut à droite)

2. **Remplissez le formulaire** :

```
┌─────────────────────────────────────────────┐
│ Créer un utilisateur                        │
├─────────────────────────────────────────────┤
│ Prénom *                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Hassan                                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Nom *                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Alami                                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Email *                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ hassan.alami@example.com                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Téléphone                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ +212633333333                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Rôle *                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ [v] Sélectionner un rôle                │ │
│ │  Admin                                  │ │
│ │  Gestionnaire                           │ │
│ │  Gestionnaire de Stock               ⭐ │ │
│ │  Appelant                               │ │
│ │  Livreur                                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Mot de passe (min 6 caractères) *           │
│ ┌─────────────────────────────────────────┐ │
│ │ ••••••••                                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  [    Créer    ]  [   Annuler   ]          │
└─────────────────────────────────────────────┘
```

3. Cliquez **"Créer"**

4. ✅ **Résultat** : "Utilisateur créé avec succès"

---

## 🆕 NOUVEAU : GESTIONNAIRE DE STOCK

### **Rôle** : `GESTIONNAIRE_STOCK`

**Permissions** :
- ✅ Voir tous les produits
- ✅ Gérer le stock (approvisionnements, corrections)
- ✅ Voir toutes les commandes
- ✅ Voir les expéditions et EXPRESS (pour préparation)
- ✅ Voir les mouvements de stock
- ❌ Créer des commandes
- ❌ Assigner des livreurs
- ❌ Gérer les utilisateurs

**Utilité** :
Le Gestionnaire de Stock est responsable de :
1. **Approvisionner** les produits
2. **Préparer** les colis pour livraison
3. **Remettre** les colis aux livreurs
4. **Suivre** les stocks EXPRESS réservés

---

## ✏️ 2. MODIFIER UN UTILISATEUR

### **Étapes** :

1. Dans la liste des utilisateurs, cliquez sur l'icône **✏️ Modifier** (bleue)

2. **Le modal s'ouvre avec les données actuelles** :

```
┌─────────────────────────────────────────────┐
│ Modifier l'utilisateur                      │
├─────────────────────────────────────────────┤
│ Prénom *                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Hassan                                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Nom *                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Alami                                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Email * (non modifiable)                    │
│ ┌─────────────────────────────────────────┐ │
│ │ hassan.alami@example.com          [🔒] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Téléphone                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ +212633333333                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Rôle *                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ [v] Livreur                             │ │
│ │  Admin                                  │ │
│ │  Gestionnaire                           │ │
│ │  Gestionnaire de Stock                  │ │
│ │  Appelant                               │ │
│ │  Livreur                                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Statut *                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ [v] Actif                               │ │
│ │  Actif                                  │ │
│ │  Désactivé                              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Nouveau mot de passe (optionnel)            │
│ ┌─────────────────────────────────────────┐ │
│ │ Laisser vide pour ne pas changer        │ │
│ └─────────────────────────────────────────┘ │
│ ℹ️ Minimum 6 caractères si vous souhaitez  │
│   le changer                                │
│                                             │
│  [  Modifier  ]  [   Annuler   ]           │
└─────────────────────────────────────────────┘
```

3. **Modifiez** les champs que vous souhaitez changer

4. Cliquez **"Modifier"**

5. ✅ **Résultat** : "Utilisateur modifié avec succès"

---

### **Champs modifiables** :

| Champ | Modifiable | Note |
|-------|-----------|------|
| **Prénom** | ✅ Oui | |
| **Nom** | ✅ Oui | |
| **Email** | ❌ Non | L'email ne peut pas être changé (identifiant unique) |
| **Téléphone** | ✅ Oui | Peut être vide |
| **Rôle** | ✅ Oui | Peut changer entre tous les rôles |
| **Statut** | ✅ Oui | Actif / Désactivé |
| **Mot de passe** | ✅ Optionnel | Laisser vide pour ne pas changer |

---

## 🗑️ 3. SUPPRIMER (DÉSACTIVER) UN UTILISATEUR

### **Étapes** :

1. Dans la liste des utilisateurs, cliquez sur l'icône **🗑️ Supprimer** (rouge)

2. **Confirmation** :

```
┌─────────────────────────────────────────────┐
│ ⚠️ Confirmation                             │
├─────────────────────────────────────────────┤
│                                             │
│ Êtes-vous sûr de vouloir désactiver         │
│ l'utilisateur Hassan Alami ?                │
│                                             │
│  [    Oui    ]  [   Annuler   ]            │
└─────────────────────────────────────────────┘
```

3. Cliquez **"Oui"**

4. ✅ **Résultat** : "Utilisateur désactivé avec succès"

---

### **⚠️ IMPORTANT : DÉSACTIVATION, PAS SUPPRESSION**

- L'utilisateur n'est **PAS supprimé** de la base de données
- Il est **désactivé** (statut `actif: false`)
- Il **ne peut plus se connecter**
- Son badge devient **rouge "Désactivé"**
- Vous pouvez le **réactiver** en le modifiant (statut → Actif)

**Raison** : Préserver l'historique des commandes et mouvements liés à cet utilisateur.

---

## 📋 LISTE DES UTILISATEURS

### **Colonnes affichées** :

| Colonne | Contenu | Exemple |
|---------|---------|---------|
| **Nom** | Prénom + Nom | Hassan Alami |
| **Email** | Adresse email | hassan@example.com |
| **Téléphone** | Numéro | +212633333333 |
| **Rôle** | Badge avec rôle | 🔵 LIVREUR |
| **Statut** | Actif / Désactivé | 🟢 Actif |
| **Actions** | Boutons | ✏️ 🗑️ |

---

## 🎯 CAS D'USAGE

### **Cas 1 : Créer un nouveau gestionnaire de stock**

**Situation** : Vous embauchez Karim pour gérer le stock.

**Actions** :
1. Cliquez **"Nouvel utilisateur"**
2. Prénom : `Karim`
3. Nom : `Benjelloun`
4. Email : `karim@gs-pipeline.com`
5. Téléphone : `+212644444444`
6. Rôle : **Gestionnaire de Stock**
7. Mot de passe : `Stock2025!`
8. Cliquez **"Créer"**

**✅ Karim peut maintenant** :
- Se connecter avec `karim@gs-pipeline.com` / `Stock2025!`
- Gérer les stocks
- Voir les commandes à préparer
- Faire les approvisionnements

---

### **Cas 2 : Promouvoir un appelant en gestionnaire**

**Situation** : Mariam (APPELANT) devient Gestionnaire.

**Actions** :
1. Trouvez "Mariam Coulibaly" dans la liste
2. Cliquez sur ✏️ **Modifier**
3. Rôle : Changez de `APPELANT` → `GESTIONNAIRE`
4. Cliquez **"Modifier"**

**✅ Mariam a maintenant** :
- Accès à tous les dashboards de gestion
- Peut créer des EXPÉDITIONS et EXPRESS
- Peut assigner des livreurs
- Peut gérer les utilisateurs (si Admin)

---

### **Cas 3 : Changer le mot de passe d'un utilisateur**

**Situation** : Hassan a oublié son mot de passe.

**Actions** :
1. Trouvez "Hassan Alami" dans la liste
2. Cliquez sur ✏️ **Modifier**
3. **Nouveau mot de passe** : `NouveauMdp123`
4. Cliquez **"Modifier"**

**✅ Hassan peut maintenant** :
- Se connecter avec son nouveau mot de passe `NouveauMdp123`

---

### **Cas 4 : Désactiver un utilisateur qui a quitté l'entreprise**

**Situation** : Gerard G a quitté l'entreprise.

**Actions** :
1. Trouvez "Gerard G" dans la liste
2. Cliquez sur 🗑️ **Supprimer**
3. Confirmez

**✅ Gerard ne peut plus** :
- Se connecter à l'application
- Accéder aux données

**✅ Historique préservé** :
- Ses commandes passées restent visibles
- Ses mouvements de stock sont conservés

---

### **Cas 5 : Réactiver un utilisateur**

**Situation** : Gerard revient dans l'entreprise.

**Actions** :
1. Trouvez "Gerard G" (badge 🔴 Désactivé)
2. Cliquez sur ✏️ **Modifier**
3. Statut : Changez de `Désactivé` → `Actif`
4. Cliquez **"Modifier"**

**✅ Gerard peut à nouveau** :
- Se connecter avec ses anciens identifiants
- Reprendre son travail

---

## 🔐 SÉCURITÉ

### **Bonnes pratiques** :

1. ✅ **Mot de passe fort** : Minimum 6 caractères, idéalement 8+ avec chiffres et symboles
2. ✅ **Email unique** : Chaque utilisateur doit avoir un email différent
3. ✅ **Rôle approprié** : Donnez le rôle le plus restrictif nécessaire
4. ✅ **Désactivation** : Désactivez immédiatement les utilisateurs qui quittent
5. ✅ **Vérification** : Vérifiez régulièrement la liste des utilisateurs actifs

---

## 📊 RÔLES DISPONIBLES

### **Récapitulatif des rôles** :

| Rôle | Accès principal | Créer commandes | Gérer stock | Gérer users |
|------|----------------|-----------------|-------------|-------------|
| **ADMIN** | Tout | ✅ | ✅ | ✅ |
| **GESTIONNAIRE** | Gestion complète | ✅ | ✅ | ❌ |
| **GESTIONNAIRE_STOCK** | Stock & préparation | ❌ | ✅ | ❌ |
| **APPELANT** | Appels & commandes | ✅ | ❌ | ❌ |
| **LIVREUR** | Livraisons | ❌ | ❌ | ❌ |

---

## 🆕 NOUVELLES FONCTIONNALITÉS

### **Ce qui a été ajouté** :

1. ✅ **Rôle GESTIONNAIRE_STOCK** dans le menu de création
2. ✅ **Card "STOCK"** dans les statistiques (5 cartes au lieu de 4)
3. ✅ **Modal de modification** complet avec tous les champs
4. ✅ **Changement de rôle** possible lors de la modification
5. ✅ **Changement de statut** (Actif/Désactivé) lors de la modification
6. ✅ **Changement de mot de passe optionnel** lors de la modification
7. ✅ **Email non modifiable** (identifiant unique préservé)

---

## 🚀 DÉPLOIEMENT

- ✅ **Frontend modifié** : `frontend/src/pages/admin/Users.tsx`
- ✅ **Rôle ajouté** : GESTIONNAIRE_STOCK
- ✅ **Modal d'édition créé**
- ✅ **Statistiques mises à jour** (5 cartes)
- ✅ **Code poussé** sur GitHub
- ⏳ **Vercel redéploie** (3 min)

---

## 🧪 TESTER

### **Dans 3-5 minutes, rafraîchissez et testez** :

#### **Test 1 : Créer un Gestionnaire de Stock**

1. Allez dans **"Utilisateurs"**
2. Cliquez **"Nouvel utilisateur"**
3. Remplissez le formulaire
4. Rôle : **Gestionnaire de Stock**
5. Créez
6. ✅ Vérifiez : Le compte apparaît dans la liste avec badge "GESTIONNAIRE_STOCK"

---

#### **Test 2 : Modifier un utilisateur**

1. Cliquez sur ✏️ d'un utilisateur existant
2. Changez le téléphone ou le rôle
3. Cliquez **"Modifier"**
4. ✅ Vérifiez : Les modifications sont appliquées

---

#### **Test 3 : Changer un mot de passe**

1. Cliquez sur ✏️ d'un utilisateur test
2. Dans **"Nouveau mot de passe"** : Tapez un nouveau mot de passe
3. Cliquez **"Modifier"**
4. Déconnectez-vous
5. Reconnectez-vous avec le nouveau mot de passe
6. ✅ Vérifiez : La connexion fonctionne

---

#### **Test 4 : Désactiver puis réactiver**

1. Cliquez sur 🗑️ d'un utilisateur test
2. Confirmez
3. ✅ Badge devient 🔴 "Désactivé"
4. Cliquez sur ✏️ du même utilisateur
5. Statut : **Actif**
6. Cliquez **"Modifier"**
7. ✅ Badge devient 🟢 "Actif"

---

## ✅ RÉSUMÉ

**L'ADMIN PEUT MAINTENANT** :

✅ **Créer** tous les types d'utilisateurs (y compris GESTIONNAIRE_STOCK)
✅ **Modifier** nom, prénom, téléphone, rôle, statut
✅ **Changer** le mot de passe d'un utilisateur
✅ **Désactiver** un utilisateur (suppression soft)
✅ **Réactiver** un utilisateur désactivé
✅ **Voir** les statistiques par rôle (5 cartes)

**DANS 3-5 MINUTES, TOUTES CES FONCTIONNALITÉS SERONT DISPONIBLES ! 🚀**

**Rafraîchissez la page et testez la gestion complète des utilisateurs ! ✨**





