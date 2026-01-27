# ✅ TODO : Tarification par Paliers

## 📋 Checklist d'Installation

### Étape 1 : Exécuter la Migration ⏳

```powershell
# Option A : Utiliser le script automatique (recommandé)
.\INSTALLER_TARIFICATION_PALIERS.ps1

# Option B : Exécution manuelle
npx prisma generate
npx prisma migrate deploy
```

**Statut :** ⏳ À FAIRE

---

### Étape 2 : Redémarrer le Serveur ⏳

```powershell
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer
npm run dev
```

**Statut :** ⏳ À FAIRE

---

### Étape 3 : Configurer les Prix ⏳

1. Connectez-vous en tant qu'**Admin**
2. Allez dans **"Gestion des Produits"**
3. Pour chaque produit, cliquez sur **"Modifier"**
4. Renseignez les prix :
   - **Prix x1** : (déjà rempli)
   - **Prix x2** : Ex: 18000 (optionnel)
   - **Prix x3** : Ex: 25000 (optionnel)
5. Cliquez sur **"Enregistrer les modifications"**

**Statut :** ⏳ À FAIRE

---

### Étape 4 : Tester ⏳

#### Test 1 : Vérifier l'Affichage

- [ ] Les produits affichent bien leurs 3 prix
- [ ] Les prix x2 et x3 apparaissent en vert et bleu
- [ ] Les prix manquants ne cassent pas l'affichage

#### Test 2 : Créer une Commande

- [ ] Envoyer une commande via webhook avec quantité = 2
- [ ] Vérifier que le montant = prix x2 (et non prix x1 × 2)

#### Test 3 : Modifier une Quantité

- [ ] Ouvrir une commande en tant qu'appelant
- [ ] Modifier la quantité de 1 à 2
- [ ] Vérifier que le montant se met à jour automatiquement

**Statut :** ⏳ À FAIRE

---

## 📁 Fichiers Créés

Voici tous les nouveaux fichiers créés pour cette fonctionnalité :

### Backend
- ✅ `prisma/migrations/20260127000000_add_prix_paliers/migration.sql`

### Frontend
- ✅ `frontend/src/utils/pricingHelpers.ts`

### Documentation
- ✅ `GUIDE_TARIFICATION_PALIERS.md` (guide complet)
- ✅ `RESUME_TARIFICATION_PALIERS.md` (résumé)
- ✅ `TARIFICATION_PALIERS_TODO.md` (ce fichier)
- ✅ `INSTALLER_TARIFICATION_PALIERS.ps1` (script d'installation)

### Fichiers Modifiés
- ✅ `prisma/schema.prisma`
- ✅ `routes/product.routes.js`
- ✅ `routes/order.routes.js`
- ✅ `routes/webhook.routes.js`
- ✅ `utils/pricing.js`
- ✅ `frontend/src/pages/stock/Products.tsx`
- ✅ `frontend/src/pages/appelant/Orders.tsx`

---

## 🎯 Résumé Fonctionnalité

### Ce Qui Fonctionne Maintenant

✅ **3 prix par produit** : Définissez prix x1, x2, x3+  
✅ **Calcul automatique** : Le système applique le bon prix selon la quantité  
✅ **Interface intuitive** : Formulaires avec 3 champs de prix  
✅ **Affichage clair** : Les prix s'affichent avec des couleurs différentes  
✅ **Webhook compatible** : Les commandes reçues utilisent les bons prix  
✅ **Modification quantité** : Recalcul automatique du prix  
✅ **Optionnel** : Si prix x2/x3 non définis, calcul classique × quantité  
✅ **Validation** : Vérification que les prix ont du sens  

### Exemple Concret

```yaml
Produit : Crème Anti-Lipome

Avant (sans paliers) :
  Quantité 1 → 9 900 FCFA
  Quantité 2 → 19 800 FCFA (9 900 × 2)
  Quantité 3 → 29 700 FCFA (9 900 × 3)

Après (avec paliers) :
  Quantité 1 → 9 900 FCFA
  Quantité 2 → 18 000 FCFA ✨ (économie de 1 800)
  Quantité 3 → 25 000 FCFA ✨ (économie de 4 700)
```

---

## 🚨 Points d'Attention

### 1. Migration Requise

⚠️ **IMPORTANT** : La migration DOIT être appliquée avant de pouvoir utiliser cette fonctionnalité.

```powershell
npx prisma migrate deploy
```

### 2. Redémarrage Serveur

⚠️ Après la migration, **redémarrez votre serveur backend**.

### 3. Cache Navigateur

⚠️ Videz le cache du navigateur (Ctrl+F5) si l'interface ne se met pas à jour.

### 4. Prix Optionnels

💡 Les prix x2 et x3 sont **optionnels**. Si vous ne les renseignez pas :
- Prix x2 = Prix x1 × 2
- Prix x3 = Prix x1 × 3

### 5. Validation Automatique

✅ Le système vérifie que :
- Prix x2 ≤ Prix x1 × 2
- Prix x3 ≤ Prix x1 × 3

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs** :
   - Backend : Terminal où tourne `npm run dev`
   - Frontend : Console navigateur (F12)

2. **Migration échouée** :
   ```powershell
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

3. **Interface ne se met pas à jour** :
   - Vider le cache (Ctrl+F5)
   - Redémarrer le serveur
   - Vérifier que la migration est appliquée

4. **Consulter la documentation** :
   - `RESUME_TARIFICATION_PALIERS.md` (guide rapide)
   - `GUIDE_TARIFICATION_PALIERS.md` (guide complet)

---

## 🎯 Prochaines Actions Recommandées

### Immédiat (Aujourd'hui)

1. ✅ [FAIT] Développement terminé
2. ⏳ Exécuter `.\INSTALLER_TARIFICATION_PALIERS.ps1`
3. ⏳ Redémarrer le serveur
4. ⏳ Tester sur un produit

### Court terme (Cette semaine)

1. ⏳ Configurer les prix pour tous les produits
2. ⏳ Former l'équipe sur la nouvelle fonctionnalité
3. ⏳ Surveiller les premières commandes avec les nouveaux prix

### Moyen terme (Ce mois)

1. ⏳ Analyser l'impact sur les ventes
2. ⏳ Ajuster les prix selon les retours
3. ⏳ Créer des promotions spéciales

---

## 📊 Métriques de Succès

Pour vérifier que tout fonctionne :

- ✅ Tous les produits ont au moins 1 prix défini
- ✅ Les commandes avec quantité > 1 utilisent les bons prix
- ✅ Aucune erreur dans les logs
- ✅ Les appelants voient les tarifs spéciaux
- ✅ Le webhook crée des commandes avec les bons montants

---

## 🎉 Une Fois Terminé

Cochez cette case quand tout est opérationnel :

- [ ] ✅ **SYSTÈME DE TARIFICATION PAR PALIERS ACTIF**

---

**Date de création :** 27 janvier 2026  
**Dernière mise à jour :** 27 janvier 2026  
**Version :** 1.0.0

---

## 📝 Notes

Espace pour vos notes personnelles :

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
