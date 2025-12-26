# 🔧 PROPOSITION D'AMÉLIORATION - API AJUSTEMENT STOCK

## 🎯 **OBJECTIF**

Permettre aux rôles **ADMIN** et **GESTIONNAIRE_STOCK** d'ajuster les 3 types de stock d'un produit :
1. `stockActuel` : Stock disponible en magasin
2. `stockLocalReserve` : Stock en livraison avec les livreurs (LOCAL)
3. `stockExpress` : Stock réservé pour les commandes EXPRESS (10% payé)

---

## 📍 **ROUTE ACTUELLE**

`POST /api/products/:id/stock/adjust`

**Limitations :**
- ❌ Ajuste **UNIQUEMENT** le `stockActuel`
- ❌ Ne permet pas d'ajuster `stockLocalReserve` ou `stockExpress`
- ❌ Pas de paramètre pour spécifier quel type de stock ajuster

---

## ✅ **PROPOSITION DE MODIFICATION**

### **Nouveaux paramètres :**

```json
{
  "quantite": -16,
  "type": "CORRECTION",
  "motif": "Correction stock négatif suite à bug",
  "stockType": "LOCAL_RESERVE"  // <--- NOUVEAU PARAMÈTRE
}
```

### **Valeurs possibles pour `stockType` :**
- `"ACTUEL"` (par défaut) : Ajuste `stockActuel`
- `"LOCAL_RESERVE"` : Ajuste `stockLocalReserve`
- `"EXPRESS"` : Ajuste `stockExpress`

---

## 💻 **CODE PROPOSÉ**

```javascript
// POST /api/products/:id/stock/adjust - Ajuster le stock manuellement
router.post('/:id/stock/adjust', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), [
  body('quantite').isInt().withMessage('Quantité invalide'),
  body('type').isIn(['APPROVISIONNEMENT', 'CORRECTION', 'PERTE']).withMessage('Type invalide'),
  body('motif').notEmpty().withMessage('Motif requis'),
  body('stockType').optional().isIn(['ACTUEL', 'LOCAL_RESERVE', 'EXPRESS'])
    .withMessage('Type de stock invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantite, type, motif, stockType = 'ACTUEL' } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé.' });
    }

    const qte = parseInt(quantite);
    
    // Déterminer quel champ de stock ajuster
    let fieldName, stockAvant, stockApres;
    
    switch (stockType) {
      case 'LOCAL_RESERVE':
        fieldName = 'stockLocalReserve';
        stockAvant = product.stockLocalReserve;
        break;
      case 'EXPRESS':
        fieldName = 'stockExpress';
        stockAvant = product.stockExpress;
        break;
      case 'ACTUEL':
      default:
        fieldName = 'stockActuel';
        stockAvant = product.stockActuel;
        break;
    }
    
    stockApres = stockAvant + qte;

    // Transaction pour assurer la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le stock approprié
      const updatedProduct = await tx.product.update({
        where: { id: parseInt(id) },
        data: { [fieldName]: stockApres }
      });

      // Créer le mouvement (avec indication du type de stock)
      const movement = await tx.stockMovement.create({
        data: {
          productId: parseInt(id),
          type,
          quantite: qte,
          stockAvant,
          stockApres,
          effectuePar: req.user.id,
          motif: `[${stockType}] ${motif}`
        }
      });

      return { product: updatedProduct, movement };
    });

    res.json({ 
      ...result, 
      message: `Stock ${stockType} ajusté avec succès.` 
    });
  } catch (error) {
    console.error('Erreur ajustement stock:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajustement du stock.' });
  }
});
```

---

## 🎨 **MODIFICATION FRONTEND**

Dans `frontend/src/pages/stock/Products.tsx`, ajouter un sélecteur :

```typescript
const [adjustStockType, setAdjustStockType] = useState('ACTUEL');

// Dans le modal d'ajustement :
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Type de stock à ajuster
  </label>
  <select
    value={adjustStockType}
    onChange={(e) => setAdjustStockType(e.target.value)}
    className="input"
  >
    <option value="ACTUEL">Stock disponible (magasin)</option>
    <option value="LOCAL_RESERVE">Stock en livraison (livreurs)</option>
    <option value="EXPRESS">Stock EXPRESS réservé</option>
  </select>
</div>
```

---

## ⚠️ **ATTENTION - RÈGLES MÉTIER**

**NORMALEMENT, vous ne devriez PAS avoir besoin d'ajuster manuellement :**

### ❌ **`stockLocalReserve`** 
- Géré **automatiquement** par :
  - ✅ `REMISE` confirmée par GESTIONNAIRE_STOCK → Stock sort
  - ✅ `RETOUR` confirmé par GESTIONNAIRE_STOCK → Stock rentre

### ❌ **`stockExpress`**
- Géré **automatiquement** par :
  - ✅ Création commande EXPRESS → Réservation 10%
  - ✅ EXPRESS_ARRIVE → Libération si refusé
  - ✅ EXPRESS_LIVRE → Réduction définitive

### ✅ **`stockActuel`**
- Ajustement manuel **OK** pour :
  - 📦 Approvisionnement fournisseur
  - 🔧 Inventaire physique / Correction
  - 💔 Perte, casse, vol

---

## 🚀 **QUAND IMPLÉMENTER ?**

**Priorité : BASSE** ⚠️

Cette amélioration n'est nécessaire que :
- ✅ **Pour corriger des incohérences** dues à des bugs (comme actuellement)
- ✅ **Pour auditer et débugger** le système

**Sinon, le flux automatique doit gérer tout le stock.**

---

## 📝 **ALTERNATIVE : SCRIPT PONCTUEL**

Au lieu de modifier l'API, vous pouvez simplement :
1. ✅ Utiliser le script `fix-stock-en-livraison-negatif.js` (créé)
2. ✅ Exécuter des requêtes SQL directes pour les corrections exceptionnelles
3. ✅ Garder l'API simple et éviter les manipulations manuelles

**Recommandation : Utiliser cette approche pour l'instant.**


