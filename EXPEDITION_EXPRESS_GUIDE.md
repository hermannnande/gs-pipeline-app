# 📦 SYSTÈME EXPÉDITION & EXPRESS - Guide Complet

## ✅ DÉJÀ IMPLÉMENTÉ

### 1. Base de données mise à jour
✅ Nouveaux statuts ajoutés:
- `EXPEDITION` - Paiement 100% avant envoi
- `EXPRESS` - Paiement 10% avant envoi
- `EXPRESS_ARRIVE` - Colis arrivé en agence
- `EXPRESS_LIVRE` - Colis retiré après paiement 90%

✅ Nouveaux champs dans la table commandes:
- `deliveryType` - Type de livraison (LOCAL, EXPEDITION, EXPRESS)
- `montantPaye` - Montant déjà payé
- `montantRestant` - Montant restant à payer
- `modePaiement` - Mode de paiement (Mobile Money, etc.)
- `referencePayment` - Référence de transaction
- `clientNotifie` - Client notifié de l'arrivée
- `notifieAt` - Date de notification
- `notifiePar` - Appelant qui a notifié
- `agenceRetrait` - Nom de l'agence
- `expedieAt` - Date d'expédition
- `arriveAt` - Date d'arrivée en agence

---

## 🚀 PROCHAINES ÉTAPES DE DÉVELOPPEMENT

### ÉTAPE 1 : Appliquer la migration sur Railway ⏳
**Ce que je dois faire:**
```bash
cd backend
DATABASE_URL='postgresql://...' npx prisma migrate dev --name add_expedition_express
DATABASE_URL='postgresql://...' npx prisma generate
```

**Statut:** À faire par le développeur

---

### ÉTAPE 2 : Modifier l'interface Appelant 🔧

**Fichier à modifier:** `frontend/src/pages/appelant/Orders.tsx`

**Changements à apporter:**

#### 2.1 Modal de traitement amélioré
Ajouter 3 nouveaux boutons dans le modal de traitement d'appel:

```typescript
// Après "Commande validée" (livraison locale)

<button onClick={() => setShowExpeditionModal(true)}>
  📦 EXPÉDITION (Paiement 100%)
</button>

<button onClick={() => setShowExpressModal(true)}>
  ⚡ EXPRESS (Paiement 10%)
</button>
```

#### 2.2 Modal EXPÉDITION
Nouveau modal pour saisir:
- ✅ Confirmation du paiement 100%
- ✅ Mode de paiement (Mobile Money, etc.)
- ✅ Référence de transaction
- ✅ Note

Action: Créer commande avec statut `EXPEDITION`

#### 2.3 Modal EXPRESS
Nouveau modal pour saisir:
- ✅ Montant payé (10% du total)
- ✅ Mode de paiement
- ✅ Référence de transaction
- ✅ Agence de retrait
- ✅ Note

Action: Créer commande avec statut `EXPRESS`

---

### ÉTAPE 3 : Créer la page "Expéditions & Express" 📋

**Nouveau fichier:** `frontend/src/pages/admin/ExpeditionsExpress.tsx`

**Fonctionnalités:**

#### Onglet 1 : EXPÉDITIONS
Liste des commandes avec statut `EXPEDITION`:
- 📦 Référence commande
- 👤 Client (Nom, Téléphone, Ville)
- 💰 Montant payé (100%)
- 📱 Mode paiement + Référence
- 🚚 Bouton "Préparer expédition" → Assigner au gestionnaire de stock

#### Onglet 2 : EXPRESS - En attente d'expédition
Liste des commandes avec statut `EXPRESS`:
- 📦 Référence commande
- 👤 Client
- 💰 10% payé / 90% restant
- 🏢 Agence de retrait
- 🚚 Bouton "Expédier" → Changer en `EXPRESS_ARRIVE`

#### Onglet 3 : EXPRESS - Arrivé en agence
Liste des commandes avec statut `EXPRESS_ARRIVE`:
- 📦 Référence commande
- 👤 Client
- 💰 90% à payer
- 🏢 Agence
- 📞 Bouton "Notifier client" → Appelant appelle le client
- ✅ Indication si client déjà notifié

#### Onglet 4 : EXPRESS - Livrés
Liste des commandes avec statut `EXPRESS_LIVRE`:
- Historique des retraits
- Filtres par date, agence

---

### ÉTAPE 4 : Modifier les routes backend 🔧

**Fichier:** `routes/order.routes.js`

#### 4.1 Route: Créer commande EXPÉDITION
```javascript
POST /api/orders/expedition
Body: {
  orderId: number,
  montantPaye: number,
  modePaiement: string,
  referencePayment: string,
  note?: string
}
```

#### 4.2 Route: Créer commande EXPRESS
```javascript
POST /api/orders/express
Body: {
  orderId: number,
  montantPaye: number, // 10%
  montantRestant: number, // 90%
  modePaiement: string,
  referencePayment: string,
  agenceRetrait: string,
  note?: string
}
```

#### 4.3 Route: Marquer EXPRESS comme arrivé
```javascript
PUT /api/orders/:id/express/arrive
Body: {
  arriveAt: DateTime
}
```

#### 4.4 Route: Notifier client (EXPRESS arrivé)
```javascript
POST /api/orders/:id/express/notifier
Body: {
  notifiedBy: userId
}
```

#### 4.5 Route: Finaliser EXPRESS (après paiement 90%)
```javascript
POST /api/orders/:id/express/finaliser
Body: {
  montantPaye: number, // Total final
  modePaiement: string,
  referencePayment: string
}
```

---

### ÉTAPE 5 : Ajouter dans le menu de navigation 🎯

**Fichier:** `frontend/src/components/Layout.tsx`

Ajouter un nouveau lien dans le menu Admin:
```typescript
{
  to: '/admin/expeditions',
  icon: Package,
  label: 'Expéditions & Express',
  roles: ['ADMIN', 'GESTIONNAIRE']
}
```

---

### ÉTAPE 6 : Intégration avec gestion de stock 📦

**Modifications:**
- Lorsqu'une EXPÉDITION est validée → Notifier le gestionnaire de stock
- Créer une liste d'expédition (séparée des tournées locales)
- Décrémenter le stock lors de l'expédition

---

### ÉTAPE 7 : Notifications et alertes 🔔

**À implémenter:**
- 📧 Email au client quand EXPÉDITION est expédiée
- 📱 SMS au client quand EXPRESS arrive en agence
- 🔔 Notification appelant pour rappeler de notifier les clients EXPRESS
- ⏰ Alerte si EXPRESS non retiré après 7 jours

---

### ÉTAPE 8 : Rapports et statistiques 📊

**Ajouter dans `/admin/stats`:**
- 📦 Nombre d'expéditions par mois
- ⚡ Nombre d'EXPRESS par mois
- 💰 Chiffre d'affaires EXPEDITION vs EXPRESS
- ⏱️ Délai moyen de retrait EXPRESS
- 📍 Agences les plus actives

---

## 📋 WORKFLOW COMPLET

### WORKFLOW EXPÉDITION

```
1. Client passe commande → NOUVELLE
2. Appelant appelle client
3. Client confirme + Paie 100% par Mobile Money
4. Appelant clique "EXPÉDITION" → Saisit infos paiement → EXPEDITION
5. Gestionnaire de stock prépare le colis
6. Colis expédié → EXPEDITION (reste dans ce statut)
7. Client reçoit le colis → Manuel: Admin marque LIVREE
```

### WORKFLOW EXPRESS

```
1. Client passe commande → NOUVELLE
2. Appelant appelle client
3. Client confirme + Paie 10% par Mobile Money
4. Appelant clique "EXPRESS" → Saisit infos (10%, agence) → EXPRESS
5. Gestionnaire de stock prépare le colis
6. Colis expédié vers agence
7. Colis arrive en agence → Admin clique "Arrivé" → EXPRESS_ARRIVE
8. Appelant appelle client pour notification
9. Client vient en agence + Paie 90%
10. Agence valide paiement → Admin clique "Finaliser" → EXPRESS_LIVRE
```

---

## 🎯 RÉSUMÉ DES DIFFÉRENCES

| Critère | LIVRAISON LOCALE | EXPÉDITION | EXPRESS |
|---------|------------------|------------|---------|
| **Zone** | Ville locale | Autre ville | Autre ville |
| **Paiement initial** | 0% | 100% | 10% |
| **Paiement à réception** | 100% | 0% | 90% |
| **Livraison** | À domicile | À domicile | Retrait en agence |
| **Statut final** | LIVREE | LIVREE | EXPRESS_LIVRE |

---

## 🔧 CODE EXEMPLE - Modal Expédition

```tsx
// À ajouter dans frontend/src/pages/appelant/Orders.tsx

const [showExpeditionModal, setShowExpeditionModal] = useState(false);
const [expeditionData, setExpeditionData] = useState({
  modePaiement: '',
  referencePayment: '',
  note: ''
});

const handleExpedition = async () => {
  await ordersApi.createExpedition(selectedOrder.id, {
    montantPaye: selectedOrder.montant,
    montantRestant: 0,
    ...expeditionData
  });
  
  toast.success('✅ Commande transférée en EXPÉDITION');
  setShowExpeditionModal(false);
  refetch();
};

// Dans le JSX
{showExpeditionModal && (
  <div className="modal">
    <h3>📦 EXPÉDITION - Paiement 100%</h3>
    
    <div className="alert alert-info">
      <p>Le client a payé la totalité du montant</p>
      <p className="font-bold">{formatCurrency(selectedOrder.montant)}</p>
    </div>
    
    <select 
      value={expeditionData.modePaiement}
      onChange={(e) => setExpeditionData({...expeditionData, modePaiement: e.target.value})}
    >
      <option value="">Mode de paiement</option>
      <option value="Orange Money">Orange Money</option>
      <option value="MTN Money">MTN Money</option>
      <option value="Moov Money">Moov Money</option>
      <option value="Autre">Autre</option>
    </select>
    
    <input
      type="text"
      placeholder="Référence de transaction"
      value={expeditionData.referencePayment}
      onChange={(e) => setExpeditionData({...expeditionData, referencePayment: e.target.value})}
    />
    
    <textarea
      placeholder="Note (optionnel)"
      value={expeditionData.note}
      onChange={(e) => setExpeditionData({...expeditionData, note: e.target.value})}
    />
    
    <button onClick={handleExpedition}>
      Confirmer EXPÉDITION
    </button>
  </div>
)}
```

---

## 📞 SUPPORT DÉVELOPPEUR

Pour toute question ou assistance technique :
1. Lire ce guide complet
2. Vérifier le schéma de base de données
3. Tester en local avant de déployer
4. Créer une branche Git pour chaque fonctionnalité

---

**Statut du projet:** Base de données prête ✅ | Frontend en attente ⏳ | Backend en attente ⏳







