# 🔧 SPÉCIFICATIONS TECHNIQUES - EXPÉDITION & EXPRESS
## Pour le développeur frontend

---

## 📚 TABLE DES MATIÈRES
1. [Architecture](#architecture)
2. [Modifications API Backend](#api-backend)
3. [Modifications Frontend](#frontend)
4. [Types TypeScript](#types-typescript)
5. [Composants à créer](#composants)
6. [Tests](#tests)

---

## 🏗️ ARCHITECTURE

### Schéma de la base de données (Déjà fait ✅)

```prisma
enum OrderStatus {
  // ... statuts existants
  EXPEDITION        // Nouveau
  EXPRESS           // Nouveau
  EXPRESS_ARRIVE    // Nouveau
  EXPRESS_LIVRE     // Nouveau
}

enum DeliveryType {
  LOCAL       
  EXPEDITION  
  EXPRESS     
}

model Order {
  // ... champs existants
  
  // Nouveaux champs
  deliveryType     DeliveryType @default(LOCAL)
  montantPaye      Float?
  montantRestant   Float?
  modePaiement     String?
  referencePayment String?
  clientNotifie    Boolean? @default(false)
  notifieAt        DateTime?
  notifiePar       Int?
  agenceRetrait    String?
  expedieAt        DateTime?
  arriveAt         DateTime?
}
```

---

## 🔌 MODIFICATIONS API BACKEND

### Routes à créer dans `routes/order.routes.js`

#### 1. Créer EXPÉDITION
```javascript
router.post('/:id/expedition', authorize('APPELANT', 'ADMIN'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
  body('referencePayment').optional(),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, note } = req.body;

    // Vérifier que montantPaye = montant total
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (parseFloat(montantPaye) < order.montant) {
      return res.status(400).json({ 
        error: 'Le montant payé doit être égal au montant total pour une EXPÉDITION' 
      });
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPEDITION',
        deliveryType: 'EXPEDITION',
        montantPaye: parseFloat(montantPaye),
        montantRestant: 0,
        modePaiement,
        referencePayment,
        noteAppelant: note,
        validatedAt: new Date(),
        callerId: req.user.id,
        calledAt: new Date(),
      },
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPEDITION',
        changedBy: req.user.id,
        comment: `EXPÉDITION - Paiement total: ${montantPaye} via ${modePaiement}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande transférée en EXPÉDITION avec succès' 
    });
  } catch (error) {
    console.error('Erreur création EXPÉDITION:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'expédition' });
  }
});
```

#### 2. Créer EXPRESS
```javascript
router.post('/:id/express', authorize('APPELANT', 'ADMIN'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
  body('agenceRetrait').notEmpty().withMessage('Agence de retrait requise'),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, agenceRetrait, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Calculer 10% et 90%
    const dixPourcent = order.montant * 0.10;
    const montantRestant = order.montant - parseFloat(montantPaye);

    if (parseFloat(montantPaye) < dixPourcent * 0.9) { // Tolérance 10%
      return res.status(400).json({ 
        error: `Le montant payé doit être au moins 10% du total (${dixPourcent.toFixed(0)} FCFA)` 
      });
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS',
        deliveryType: 'EXPRESS',
        montantPaye: parseFloat(montantPaye),
        montantRestant,
        modePaiement,
        referencePayment,
        agenceRetrait,
        noteAppelant: note,
        validatedAt: new Date(),
        callerId: req.user.id,
        calledAt: new Date(),
      },
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS',
        changedBy: req.user.id,
        comment: `EXPRESS - Acompte: ${montantPaye} via ${modePaiement} | Restant: ${montantRestant} | Agence: ${agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande transférée en EXPRESS avec succès' 
    });
  } catch (error) {
    console.error('Erreur création EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'express' });
  }
});
```

#### 3. Marquer EXPRESS comme arrivé
```javascript
router.put('/:id/express/arrive', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order || order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Commande non valide' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS_ARRIVE',
        arriveAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS',
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Colis arrivé en agence: ${order.agenceRetrait}`,
      },
    });

    res.json({ order: updatedOrder, message: 'Colis marqué comme arrivé en agence' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});
```

#### 4. Notifier client
```javascript
router.post('/:id/express/notifier', authorize('APPELANT', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order || order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Commande non valide' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        clientNotifie: true,
        notifieAt: new Date(),
        notifiePar: req.user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Client ${order.clientNom} notifié de l'arrivée du colis`,
      },
    });

    res.json({ order: updatedOrder, message: 'Client notifié avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la notification' });
  }
});
```

#### 5. Finaliser EXPRESS (paiement 90%)
```javascript
router.post('/:id/express/finaliser', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment } = req.body;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order || order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Commande non valide' });
    }

    const montantTotal = (order.montantPaye || 0) + parseFloat(montantPaye);
    
    if (montantTotal < order.montant * 0.95) { // Tolérance 5%
      return res.status(400).json({ error: 'Le montant total payé est insuffisant' });
    }

    // Transaction pour gérer le stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS_LIVRE',
          montantPaye: montantTotal,
          montantRestant: 0,
          deliveredAt: new Date(),
        },
      });

      // Décrémenter le stock si lié à un produit
      if (order.productId) {
        const product = await tx.product.findUnique({ where: { id: order.productId } });
        if (product) {
          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: product.stockActuel - order.quantite },
          });

          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'LIVRAISON',
              quantite: -order.quantite,
              stockAvant: product.stockActuel,
              stockApres: product.stockActuel - order.quantite,
              effectuePar: req.user.id,
              motif: `EXPRESS livré - ${order.orderReference}`,
            },
          });
        }
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_LIVRE',
        changedBy: req.user.id,
        comment: `Paiement final: ${montantPaye} via ${modePaiement} | Total: ${montantTotal}`,
      },
    });

    res.json({ order: updatedOrder, message: 'EXPRESS finalisé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la finalisation' });
  }
});
```

---

## 💻 MODIFICATIONS FRONTEND

### Types TypeScript à ajouter

```typescript
// frontend/src/types/index.ts

export type DeliveryType = 'LOCAL' | 'EXPEDITION' | 'EXPRESS';

export type OrderStatus = 
  | 'NOUVELLE'
  | 'A_APPELER'
  | 'VALIDEE'
  | 'ANNULEE'
  | 'INJOIGNABLE'
  | 'ASSIGNEE'
  | 'LIVREE'
  | 'REFUSEE'
  | 'ANNULEE_LIVRAISON'
  | 'EXPEDITION'
  | 'EXPRESS'
  | 'EXPRESS_ARRIVE'
  | 'EXPRESS_LIVRE';

export interface Order {
  // ... champs existants
  
  // Nouveaux champs
  deliveryType: DeliveryType;
  montantPaye?: number;
  montantRestant?: number;
  modePaiement?: string;
  referencePayment?: string;
  clientNotifie?: boolean;
  notifieAt?: string;
  notifiePar?: number;
  agenceRetrait?: string;
  expedieAt?: string;
  arriveAt?: string;
}

export interface ExpeditionData {
  modePaiement: string;
  referencePayment: string;
  note?: string;
}

export interface ExpressData {
  montantPaye: number;
  modePaiement: string;
  referencePayment: string;
  agenceRetrait: string;
  note?: string;
}
```

### API Client à ajouter

```typescript
// frontend/src/lib/api.ts

export const ordersApi = {
  // ... fonctions existantes
  
  createExpedition: async (orderId: number, data: ExpeditionData) => {
    const { data: response } = await api.post(`/orders/${orderId}/expedition`, data);
    return response;
  },
  
  createExpress: async (orderId: number, data: ExpressData) => {
    const { data: response } = await api.post(`/orders/${orderId}/express`, data);
    return response;
  },
  
  markExpressArrived: async (orderId: number) => {
    const { data: response } = await api.put(`/orders/${orderId}/express/arrive`);
    return response;
  },
  
  notifyExpressClient: async (orderId: number) => {
    const { data: response } = await api.post(`/orders/${orderId}/express/notifier`);
    return response;
  },
  
  finalizeExpress: async (orderId: number, data: { montantPaye: number; modePaiement: string; referencePayment: string }) => {
    const { data: response } = await api.post(`/orders/${orderId}/express/finaliser`, data);
    return response;
  },
};
```

### Composants à créer

#### 1. `ExpeditionModal.tsx`
```tsx
// frontend/src/components/modals/ExpeditionModal.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Truck, DollarSign, CreditCard } from 'lucide-react';

interface ExpeditionModalProps {
  order: Order;
  onClose: () => void;
}

export default function ExpeditionModal({ order, onClose }: ExpeditionModalProps) {
  const [formData, setFormData] = useState({
    modePaiement: '',
    referencePayment: '',
    note: '',
  });
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => ordersApi.createExpedition(order.id, {
      montantPaye: order.montant,
      ...formData
    }),
    onSuccess: () => {
      toast.success('✅ Commande transférée en EXPÉDITION');
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Truck className="text-blue-600" />
          EXPÉDITION - Paiement complet
        </h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 mb-2">
            Le client a payé la totalité du montant :
          </p>
          <p className="text-2xl font-bold text-blue-900">
            {order.montant.toLocaleString()} FCFA
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement *
            </label>
            <select
              value={formData.modePaiement}
              onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
              className="input"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN Money">MTN Money</option>
              <option value="Moov Money">Moov Money</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence de transaction
            </label>
            <input
              type="text"
              value={formData.referencePayment}
              onChange={(e) => setFormData({...formData, referencePayment: e.target.value})}
              className="input"
              placeholder="Ex: TRX123456789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (optionnel)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="input"
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
            disabled={mutation.isPending}
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            className="btn btn-primary flex-1"
            disabled={!formData.modePaiement || mutation.isPending}
          >
            {mutation.isPending ? 'Traitement...' : 'Confirmer EXPÉDITION'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2. `ExpressModal.tsx`
Similaire à ExpeditionModal mais avec :
- Calcul automatique du 10%
- Champ pour l'agence de retrait
- Validation du montant payé (doit être >= 10%)

---

## 📊 GUIDE D'IMPLÉMENTATION PAR ÉTAPE

### Étape 1 : Backend ✅
Migration database déjà faite

### Étape 2 : Routes API
Ajouter les 5 routes listées ci-dessus dans `routes/order.routes.js`

### Étape 3 : Frontend - Types
Mettre à jour `frontend/src/types/index.ts`

### Étape 4 : Frontend - API Client
Ajouter les fonctions dans `frontend/src/lib/api.ts`

### Étape 5 : Frontend - Composants
Créer `ExpeditionModal.tsx` et `ExpressModal.tsx`

### Étape 6 : Frontend - Page Appelant
Modifier `frontend/src/pages/appelant/Orders.tsx` pour intégrer les modals

### Étape 7 : Frontend - Page Expéditions
Créer `frontend/src/pages/admin/ExpeditionsExpress.tsx`

### Étape 8 : Frontend - Navigation
Ajouter le lien dans le menu

### Étape 9 : Tests
Tester chaque workflow complet

### Étape 10 : Déploiement
- Appliquer migration sur Railway
- Déployer backend
- Déployer frontend

---

## ✅ CHECKLIST COMPLÈTE

### Backend
- [ ] Appliquer migration SQL sur Railway
- [ ] Créer route POST /orders/:id/expedition
- [ ] Créer route POST /orders/:id/express
- [ ] Créer route PUT /orders/:id/express/arrive
- [ ] Créer route POST /orders/:id/express/notifier
- [ ] Créer route POST /orders/:id/express/finaliser
- [ ] Tester toutes les routes avec Postman

### Frontend
- [ ] Mettre à jour types TypeScript
- [ ] Ajouter fonctions API client
- [ ] Créer ExpeditionModal.tsx
- [ ] Créer ExpressModal.tsx
- [ ] Modifier page Appelant avec nouveaux boutons
- [ ] Créer page ExpeditionsExpress.tsx
- [ ] Ajouter lien dans navigation
- [ ] Ajouter labels pour nouveaux statuts
- [ ] Tester workflow EXPÉDITION complet
- [ ] Tester workflow EXPRESS complet

---

**Bonne chance pour l'implémentation ! 🚀**





