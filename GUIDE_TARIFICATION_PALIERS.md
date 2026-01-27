# 📋 Guide : Tarification par Paliers de Quantité

## 🎯 Vue d'ensemble

Le système permet maintenant de définir **3 prix différents** par produit selon la quantité commandée :

- **Prix x1** : Prix pour 1 unité (obligatoire)
- **Prix x2** : Prix spécial pour 2 unités (optionnel)
- **Prix x3+** : Prix spécial pour 3 unités ou plus (optionnel)

### Avantages
✅ **Promotions automatiques** : Offrez des réductions pour les achats multiples  
✅ **Flexibilité** : Chaque produit peut avoir ses propres paliers  
✅ **Calcul automatique** : Le système applique le bon prix automatiquement  
✅ **Compatible** : Fonctionne avec les commandes existantes  

---

## 🚀 Installation

### 1. Appliquer la migration

```bash
# Depuis la racine du projet
npx prisma migrate dev

# Ou si vous utilisez Railway/Production
npx prisma migrate deploy
```

### 2. Redémarrer le serveur

```bash
npm run dev
```

---

## 📝 Configuration des produits

### Dans l'interface (Gestion des Produits)

1. **Accédez à** : Gestion des Produits (rôle Admin requis)
2. **Ajoutez ou modifiez** un produit
3. **Renseignez les prix** :
   - **Prix pour 1 unité** : 9 900 FCFA (obligatoire)
   - **Prix pour 2 unités** : 18 000 FCFA (optionnel - réduction de 1 900)
   - **Prix pour 3 unités** : 25 000 FCFA (optionnel - réduction de 4 700)

4. **Enregistrez** : Les prix sont maintenant actifs !

### Exemple concret

```
Produit : Crème Anti-Lipome
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prix x1  : 9 900 FCFA  (prix unitaire normal)
Prix x2  : 18 000 FCFA (au lieu de 19 800, économie de 1 800)
Prix x3+ : 25 000 FCFA (au lieu de 29 700, économie de 4 700)
```

---

## 🔄 Fonctionnement

### 1. Lors de la réception d'une commande (webhook)

Le système détecte automatiquement la quantité et applique le bon prix :

```javascript
// Quantité = 1 → 9 900 FCFA
// Quantité = 2 → 18 000 FCFA (prix2Unites)
// Quantité = 3 → 25 000 FCFA (prix3Unites)
// Quantité = 4 → 25 000 FCFA (utilise prix3Unites)
```

### 2. Interface des appelants

Lorsqu'un appelant :
- **Consulte une commande** : Le montant affiché correspond au bon tarif
- **Modifie la quantité** : Le prix est recalculé automatiquement
- **Voit les détails** : Un label indique le tarif appliqué

**Affichage dans le modal :**
```
Produit : Crème Anti-Lipome (x2)
Montant : 18 000 FCFA
Prix pour 2 unités (tarif spécial)
```

### 3. Modification de quantité

Si un appelant ou gestionnaire change la quantité :

```
Quantité actuelle : 1 → Montant : 9 900 FCFA
Nouvelle quantité : 2 → Nouveau montant : 18 000 FCFA (tarif spécial)
```

---

## 🎨 Affichage dans l'interface

### Gestion des Produits

Chaque carte de produit affiche maintenant :

```
💰 Prix x1  : 9 900 FCFA
💰 Prix x2  : 18 000 FCFA (vert)
💰 Prix x3  : 25 000 FCFA (bleu)
```

### Interface Appelants

Dans le modal de traitement :

```
Produit: Crème Anti-Lipome (x2)
Montant: 18 000 FCFA
Prix pour 2 unités (tarif spécial)
```

---

## 🧪 Tests

### Tester la création de produit

1. Connectez-vous en tant qu'**Admin**
2. Allez dans **Gestion des Produits**
3. Cliquez sur **Ajouter un produit**
4. Remplissez :
   - Code : `TEST_PRIX_PALIERS`
   - Nom : `Produit Test Paliers`
   - Prix x1 : `10000`
   - Prix x2 : `18000` (optionnel)
   - Prix x3 : `24000` (optionnel)
5. **Enregistrer**

### Tester via webhook

```bash
curl -X POST http://localhost:5000/api/webhook/make \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: votre_api_key" \
  -d '{
    "product_key": "TEST_PRIX_PALIERS",
    "customer_name": "Test Client",
    "customer_phone": "0123456789",
    "customer_city": "Dakar",
    "quantity": 2
  }'
```

**Résultat attendu :**
- Montant calculé : `18 000 FCFA` (et non 20 000)

### Tester la modification de quantité

1. Connectez-vous en tant qu'**Appelant** ou **Admin**
2. Trouvez une commande avec quantité = 1
3. Cliquez sur **✏️ Modifier**
4. Changez la quantité à **2**
5. **Le montant doit se mettre à jour automatiquement** avec le prix x2 s'il existe

---

## 🔧 Logique technique

### Ordre de priorité du calcul

```javascript
function calculatePrice(product, quantity) {
  // 1. Quantité = 1 → toujours prix unitaire
  if (quantity === 1) return product.prixUnitaire;
  
  // 2. Quantité = 2 ET prix2Unites existe → utiliser prix2Unites
  if (quantity === 2 && product.prix2Unites) return product.prix2Unites;
  
  // 3. Quantité ≥ 3 ET prix3Unites existe → utiliser prix3Unites
  if (quantity >= 3 && product.prix3Unites) return product.prix3Unites;
  
  // 4. Fallback : prix unitaire × quantité
  return product.prixUnitaire * quantity;
}
```

### Fichiers modifiés

**Backend :**
- ✅ `prisma/schema.prisma` - Ajout des champs prix2Unites, prix3Unites
- ✅ `prisma/migrations/20260127000000_add_prix_paliers/` - Migration SQL
- ✅ `routes/product.routes.js` - Création/modification de produits
- ✅ `routes/order.routes.js` - Modification de quantité
- ✅ `routes/webhook.routes.js` - Réception des commandes
- ✅ `utils/pricing.js` - Logique de calcul des prix

**Frontend :**
- ✅ `frontend/src/pages/stock/Products.tsx` - Gestion des produits
- ✅ `frontend/src/pages/appelant/Orders.tsx` - Interface appelants
- ✅ `frontend/src/utils/pricingHelpers.ts` - Fonctions utilitaires

---

## 💡 Cas d'usage

### Exemple 1 : Produit sans prix spéciaux

```
Prix x1  : 9 900 FCFA
Prix x2  : (non défini)
Prix x3+ : (non défini)

→ Quantité 2 = 9 900 × 2 = 19 800 FCFA
→ Quantité 3 = 9 900 × 3 = 29 700 FCFA
```

### Exemple 2 : Produit avec tous les prix

```
Prix x1  : 9 900 FCFA
Prix x2  : 18 000 FCFA
Prix x3+ : 25 000 FCFA

→ Quantité 1 = 9 900 FCFA
→ Quantité 2 = 18 000 FCFA ✨
→ Quantité 3 = 25 000 FCFA ✨
→ Quantité 4 = 25 000 FCFA (utilise le prix x3)
```

### Exemple 3 : Produit avec prix x2 seulement

```
Prix x1  : 9 900 FCFA
Prix x2  : 18 000 FCFA
Prix x3+ : (non défini)

→ Quantité 1 = 9 900 FCFA
→ Quantité 2 = 18 000 FCFA ✨
→ Quantité 3 = 9 900 × 3 = 29 700 FCFA
```

---

## ⚠️ Remarques importantes

1. **Validation des prix** : Le système vérifie que prix2 ≤ prix1 × 2 et prix3 ≤ prix1 × 3
2. **Optionnel** : Si vous ne renseignez pas prix2 ou prix3, le calcul classique s'applique
3. **Rétrocompatibilité** : Les anciennes commandes continuent de fonctionner
4. **Migration** : Les produits existants gardent leur prix unitaire, vous pouvez ajouter les prix spéciaux progressivement

---

## 🆘 Dépannage

### Le prix ne se met pas à jour automatiquement

**Vérifiez :**
1. ✅ La migration a bien été appliquée : `npx prisma db pull`
2. ✅ Le serveur a été redémarré
3. ✅ Les prix x2 et x3 sont bien renseignés dans le produit
4. ✅ Le cache du navigateur a été vidé (Ctrl+F5)

### L'appelant ne voit pas les prix spéciaux

**Solution :**
- Les prix spéciaux s'appliquent automatiquement au montant total
- Le label "tarif spécial" s'affiche uniquement si la quantité > 1 ET qu'un prix spécial existe

### Erreur lors de la modification de produit

**Vérifiez :**
- Prix x2 < Prix x1 × 2
- Prix x3 < Prix x1 × 3
- Tous les prix sont des nombres positifs

---

## 📞 Support

En cas de problème, vérifiez les logs :

```bash
# Logs backend
npm run dev

# Logs frontend
cd frontend && npm run dev
```

---

**Dernière mise à jour :** 27 janvier 2026  
**Version :** 1.0.0  
**Auteur :** Système de gestion de commandes GS Pipeline
