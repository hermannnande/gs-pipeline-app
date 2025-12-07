# 👥 PERMISSIONS GESTIONNAIRE - CRÉATION COMPTE LIVREUR

## 📋 RÉSUMÉ DES MODIFICATIONS

Le **Gestionnaire Principal** peut désormais créer des comptes **Livreur**, mais **ne peut ni modifier ni supprimer** les comptes utilisateurs.

---

## 🔐 PERMISSIONS PAR RÔLE

### 1️⃣ **ADMIN** 👑

```
✅ CRÉER tous les rôles (Admin, Gestionnaire, Stock, Appelant, Livreur)
✅ MODIFIER tous les utilisateurs
✅ SUPPRIMER/DÉSACTIVER tous les utilisateurs
```

### 2️⃣ **GESTIONNAIRE** 🎯

```
✅ CRÉER uniquement des LIVREUR
❌ MODIFIER des utilisateurs (interdit)
❌ SUPPRIMER des utilisateurs (interdit)
```

### 3️⃣ **Autres rôles** 👥

```
❌ CRÉER des utilisateurs (interdit)
❌ MODIFIER des utilisateurs (interdit)
❌ SUPPRIMER des utilisateurs (interdit)
```

---

## 🛠️ MODIFICATIONS TECHNIQUES

### **Backend** - `routes/user.routes.js`

#### ✅ Route POST `/api/users` - Création d'utilisateur

**AVANT** :
```javascript
router.post('/', authorize('ADMIN'), [ ... ])
```

**APRÈS** :
```javascript
router.post('/', authorize('ADMIN', 'GESTIONNAIRE'), [ ... ])

// RESTRICTION : Si l'utilisateur est GESTIONNAIRE, il ne peut créer que des LIVREUR
if (req.user.role === 'GESTIONNAIRE' && role !== 'LIVREUR') {
  return res.status(403).json({ 
    error: 'Vous n\'avez le droit de créer que des comptes Livreur.' 
  });
}
```

#### 🔒 Routes PUT et DELETE - Réservées à l'ADMIN

```javascript
// PUT /api/users/:id - Modifier un utilisateur (Admin uniquement)
router.put('/:id', authorize('ADMIN'), async (req, res) => { ... });

// DELETE /api/users/:id - Désactiver un utilisateur (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => { ... });
```

---

### **Frontend** - `frontend/src/pages/admin/Users.tsx`

#### ✅ Import du store d'authentification

```typescript
import { useAuthStore } from '@/store/authStore';

const { user: currentUser } = useAuthStore();
```

#### ✅ Permissions dynamiques

```typescript
const isAdmin = currentUser?.role === 'ADMIN';
const isGestionnaire = currentUser?.role === 'GESTIONNAIRE';
const canCreateUser = isAdmin || isGestionnaire;
const canEditUser = isAdmin;
const canDeleteUser = isAdmin;
```

#### ✅ Bouton "Nouvel utilisateur"

**Visible pour** : ADMIN et GESTIONNAIRE

```typescript
{canCreateUser && (
  <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
    <UserPlus size={20} />
    Nouvel utilisateur
  </button>
)}
```

#### ✅ Modal de création - Rôles disponibles

**Pour ADMIN** :
```
- Admin
- Gestionnaire
- Gestionnaire de Stock
- Appelant
- Livreur
```

**Pour GESTIONNAIRE** :
```
- Livreur (uniquement)
```

**Code** :
```typescript
<select name="role" className="input" required>
  <option value="">Sélectionner un rôle</option>
  {isAdmin && (
    <>
      <option value="ADMIN">Admin</option>
      <option value="GESTIONNAIRE">Gestionnaire</option>
      <option value="GESTIONNAIRE_STOCK">Gestionnaire de Stock</option>
      <option value="APPELANT">Appelant</option>
    </>
  )}
  <option value="LIVREUR">Livreur</option>
</select>
{isGestionnaire && (
  <p className="text-xs text-gray-500 italic">
    En tant que Gestionnaire, vous pouvez uniquement créer des comptes Livreur.
  </p>
)}
```

#### ✅ Boutons Modifier et Supprimer

**Visible uniquement pour ADMIN** :

```typescript
<td className="py-3 px-4">
  <div className="flex items-center gap-2">
    {canEditUser && (
      <button onClick={() => setEditingUser(user)}>
        <Edit size={18} />
      </button>
    )}
    {canDeleteUser && (
      <button onClick={() => handleDelete(user.id)}>
        <Trash2 size={18} />
      </button>
    )}
    {!canEditUser && !canDeleteUser && (
      <span className="text-sm text-gray-400">-</span>
    )}
  </div>
</td>
```

---

## 🎯 SCÉNARIOS D'UTILISATION

### **Scénario 1 : Gestionnaire crée un Livreur** ✅

```
1. Le Gestionnaire se connecte
2. Va sur la page "Utilisateurs"
3. Clique sur "Nouvel utilisateur"
4. Remplit le formulaire :
   - Prénom : Jean
   - Nom : Dupont
   - Email : jean.dupont@example.com
   - Téléphone : 0102030405
   - Rôle : LIVREUR (seule option disponible)
   - Mot de passe : ********
5. Clique sur "Créer"
6. ✅ Le compte Livreur est créé avec succès
```

### **Scénario 2 : Gestionnaire tente de créer un Admin** ❌

```
1. Le Gestionnaire tente de contourner les restrictions
2. Envoie une requête POST avec role: "ADMIN"
3. ❌ Le backend répond :
   {
     "error": "Vous n'avez le droit de créer que des comptes Livreur."
   }
4. La création est refusée
```

### **Scénario 3 : Gestionnaire tente de modifier un utilisateur** ❌

```
1. Le Gestionnaire va sur la page "Utilisateurs"
2. ❌ Les boutons "Modifier" et "Supprimer" ne sont PAS affichés
3. Il ne peut pas modifier ou supprimer d'utilisateurs
```

### **Scénario 4 : Admin gère tous les utilisateurs** ✅

```
1. L'Admin se connecte
2. Va sur la page "Utilisateurs"
3. ✅ Peut créer tous les rôles
4. ✅ Peut modifier tous les utilisateurs
5. ✅ Peut supprimer/désactiver tous les utilisateurs
```

---

## 📊 TABLEAU RÉCAPITULATIF

| Rôle             | Créer utilisateurs | Rôles créables                                      | Modifier | Supprimer |
|------------------|-------------------|-----------------------------------------------------|----------|-----------|
| **ADMIN**        | ✅ Oui             | Tous (Admin, Gestionnaire, Stock, Appelant, Livreur) | ✅ Oui    | ✅ Oui     |
| **GESTIONNAIRE** | ✅ Oui             | **LIVREUR uniquement**                              | ❌ Non    | ❌ Non     |
| **STOCK**        | ❌ Non             | Aucun                                               | ❌ Non    | ❌ Non     |
| **APPELANT**     | ❌ Non             | Aucun                                               | ❌ Non    | ❌ Non     |
| **LIVREUR**      | ❌ Non             | Aucun                                               | ❌ Non    | ❌ Non     |

---

## 🔒 SÉCURITÉ

### **Validation Backend** 🛡️

1. **Vérification du rôle de l'utilisateur connecté**
   ```javascript
   if (req.user.role === 'GESTIONNAIRE' && role !== 'LIVREUR') {
     return res.status(403).json({ error: '...' });
   }
   ```

2. **Middleware d'autorisation**
   ```javascript
   authorize('ADMIN', 'GESTIONNAIRE')
   ```

3. **Validation des données**
   ```javascript
   body('role').isIn(['ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT', 'LIVREUR'])
   ```

### **Protection Frontend** 🎨

1. **Affichage conditionnel des boutons**
   ```typescript
   {canCreateUser && <button>Nouvel utilisateur</button>}
   {canEditUser && <button>Modifier</button>}
   {canDeleteUser && <button>Supprimer</button>}
   ```

2. **Options de rôle dynamiques**
   ```typescript
   {isAdmin && <option>Admin</option>}
   <option>Livreur</option>
   ```

---

## ✅ TESTS DE VALIDATION

### **Test 1 : Création d'un Livreur par Gestionnaire**

```bash
# Connexion en tant que Gestionnaire
POST /api/auth/login
{
  "email": "gestionnaire@example.com",
  "password": "password123"
}

# Création d'un Livreur
POST /api/users
{
  "email": "nouveau.livreur@example.com",
  "password": "password123",
  "nom": "Martin",
  "prenom": "Pierre",
  "telephone": "0606060606",
  "role": "LIVREUR"
}

# ✅ Résultat attendu : 201 Created
```

### **Test 2 : Tentative de création d'un Admin par Gestionnaire**

```bash
# Connexion en tant que Gestionnaire
POST /api/auth/login

# Tentative de création d'un Admin
POST /api/users
{
  "email": "admin@example.com",
  "password": "password123",
  "nom": "Admin",
  "prenom": "Test",
  "role": "ADMIN"
}

# ❌ Résultat attendu : 403 Forbidden
{
  "error": "Vous n'avez le droit de créer que des comptes Livreur."
}
```

### **Test 3 : Vérification des boutons dans l'interface**

```
1. Connexion en tant que GESTIONNAIRE
2. Navigation vers /admin/users
3. ✅ Bouton "Nouvel utilisateur" visible
4. ❌ Boutons "Modifier" NON visibles
5. ❌ Boutons "Supprimer" NON visibles
6. Clic sur "Nouvel utilisateur"
7. ✅ Dans le dropdown "Rôle", seul "LIVREUR" est disponible
8. ✅ Message d'information affiché sous le dropdown
```

---

## 🎉 AVANTAGES

### **Pour l'Organisation** 🏢

```
✅ Délégation contrôlée de la gestion des Livreurs
✅ Autonomie du Gestionnaire Principal
✅ Sécurité maintenue (pas de modification/suppression)
✅ Réduction de la charge de travail de l'Admin
```

### **Pour le Gestionnaire** 👨‍💼

```
✅ Peut créer rapidement des comptes Livreurs
✅ Interface simple et claire
✅ Autonomie dans la gestion quotidienne
```

### **Pour l'Admin** 👑

```
✅ Garde le contrôle total
✅ Peut déléguer la création des Livreurs
✅ Reste le seul à pouvoir modifier/supprimer
```

---

## 📝 RÉSUMÉ

```
┌─────────────────────────────────────────────────────────────┐
│           PERMISSIONS GESTIONNAIRE PRINCIPAL                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ PEUT CRÉER des comptes LIVREUR                          │
│  ❌ NE PEUT PAS créer d'autres rôles (Admin, etc.)         │
│  ❌ NE PEUT PAS modifier des utilisateurs                   │
│  ❌ NE PEUT PAS supprimer des utilisateurs                  │
│                                                             │
│  🔒 Sécurité : Backend + Frontend                           │
│  🎯 Interface : Options limitées pour Gestionnaire          │
│  ✅ Tests : Validés                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Date de mise en œuvre** : 7 décembre 2025  
**Statut** : ✅ Actif et déployé

