# 📋 PROMPT : Page "Livraisons en Cours" - Suivi du Stock en Livraison

## 🎯 OBJECTIF

Créer une page de suivi en temps réel du stock physiquement avec les livreurs, permettant d'analyser les commandes en cours de livraison et de synchroniser les données avec la réalité du terrain.

---

## 📊 SPÉCIFICATIONS FONCTIONNELLES

### Vue d'ensemble

**Page : Livraisons en Cours**
- **URL** : `/admin/livraisons-en-cours` (ou `/stock/livraisons-en-cours`)
- **Rôles autorisés** : ADMIN, GESTIONNAIRE, GESTIONNAIRE_STOCK
- **Objectif** : Visualiser en temps réel quel stock est physiquement avec quels livreurs

### Données à afficher

**Commandes concernées :**
- Statuts : `ASSIGNEE`, `REFUSEE`, `ANNULEE_LIVRAISON`, `RETOURNE`
- Type : `LOCAL` uniquement (livraison locale)
- Exclure : Commandes dont la tournée est terminée (`colisRetourConfirme = true`)

**Informations affichées :**
1. Statistiques globales (4 cartes)
2. Liste des produits chez chaque livreur (vue par livreur)
3. Stock en livraison par produit (vue par produit)
4. Filtres par date (Aujourd'hui / Cette semaine / Ce mois / Tout)

---

## 🎨 DESIGN & INTERFACE

### 1. En-tête de la page

```
┌─────────────────────────────────────────────────────────┐
│  Livraisons en Cours                      [Actualiser]  │
│  Suivi du stock sorti avec les livreurs  [Synchroniser]│
└─────────────────────────────────────────────────────────┘
```

- **Titre** : "Livraisons en Cours"
- **Sous-titre** : "Suivi du stock sorti avec les livreurs"
- **Boutons** :
  - `Actualiser` : Rafraîchir les données (icône RefreshCw)
  - `Synchroniser` : Recalculer le stock (visible uniquement pour ADMIN)

### 2. Filtres par date

```
┌─────────────────────────────────────────────────────────┐
│  📅 Filtrer par période                                 │
│  [Aujourd'hui] [Cette semaine] [Ce mois] [Tout]        │
└─────────────────────────────────────────────────────────┘
```

- Boutons toggle (un seul actif à la fois)
- Couleur active : `bg-primary-600 text-white`
- Couleur inactive : `bg-gray-100 text-gray-700`

### 3. Statistiques globales (4 cartes)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Commandes │ │ 📦 Quantité  │ │ 🚚 Livreurs  │ │ ⚠️ Produits  │
│ en livraison │ │ totale       │ │ actifs       │ │ concernés    │
│     125      │ │     347      │ │      8       │ │      24      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Styles :**
- Carte 1 : `bg-blue-50 border-blue-200`
- Carte 2 : `bg-green-50 border-green-200`
- Carte 3 : `bg-purple-50 border-purple-200`
- Carte 4 : `bg-amber-50 border-amber-200`

### 4. Produits chez chaque livreur (Section principale)

```
┌─────────────────────────────────────────────────────────┐
│  🚚 Produits chez chaque livreur                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 👤 Jean Dupont (07 12 34 56 78)         [v]       │ │
│  │ 📦 45 produits | 📋 18 commandes | 🏷️ 5 types     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Cliquable - Affiche détails en expansion]             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 👤 Marie Martin (07 98 76 54 32)        [v]       │ │
│  │ 📦 32 produits | 📋 12 commandes | 🏷️ 4 types     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Expansion (quand cliqué) :**

```
┌────────────────────────────────────────────────────────┐
│ 📦 Produits en possession                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │ Crème Anti   │ │ Patch Anti   │ │ Gaine        │   │
│ │ Cerne        │ │ Bouton       │ │ Tourmaline   │   │
│ │    ×15       │ │    ×8        │ │    ×12       │   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                        │
│ 📦 Détail des commandes (18)                          │
│ ┌──────────────────────────────────────────────────┐ │
│ │ CMD-12345  [En livraison]              ×2        │ │
│ │ 📦 Crème Anti Cerne                              │ │
│ │ 👤 Client A                                       │ │
│ │ 📅 Lundi 3 février 2026                          │ │
│ └──────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────┐ │
│ │ CMD-12346  [Refusé]                    ×1        │ │
│ │ 📦 Patch Anti Bouton                             │ │
│ │ 👤 Client B                                       │ │
│ └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 5. Stock par produit (Section secondaire)

```
┌─────────────────────────────────────────────────────────┐
│  📦 Stock en livraison par produit                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Crème Anti Cerne [CREME_ANTI_CERNE]      [v]      │ │
│  │ Quantité: 45 | Commandes: 18 | Livreurs: 3        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Cliquable - Affiche détails en expansion]             │
└─────────────────────────────────────────────────────────┘
```

### 6. Message informatif (Footer)

```
┌─────────────────────────────────────────────────────────┐
│  ℹ️ Informations                                        │
│  • Affiche TOUS les produits avec les livreurs          │
│  • Inclut: En livraison, Refusé, Annulé, Retourné      │
│  • Utilisez "Synchroniser" pour corriger les écarts     │
│  • Les commandes livrées sont automatiquement retirées  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 SPÉCIFICATIONS TECHNIQUES

### API Backend

**Route GET : `/api/stock-analysis/local-reserve`**

```javascript
// Authentification requise
// Rôles autorisés : ADMIN, GESTIONNAIRE, GESTIONNAIRE_STOCK

// Réponse JSON
{
  summary: {
    totalCommandes: number,
    totalQuantite: number,
    totalProduitsConcernes: number,
    totalLivreurs: number
  },
  parProduit: [{
    product: {
      id: number,
      code: string,
      nom: string,
      stockLocalReserve: number
    },
    quantiteReelle: number,
    nombreLivreurs: number,
    commandes: [{
      id: number,
      orderReference: string,
      clientNom: string,
      clientTelephone: string,
      clientVille: string,
      quantite: number,
      status: string,
      deliveryDate: string,
      deliverer: {
        id: number,
        prenom: string,
        nom: string
      }
    }]
  }],
  parLivreur: [{
    deliverer: {
      id: number,
      nom: string,
      prenom: string,
      telephone: string
    },
    totalQuantite: number,
    produits: {
      [productId]: {
        nom: string,
        quantite: number
      }
    },
    commandes: [{
      id: number,
      orderReference: string,
      clientNom: string,
      produitNom: string,
      quantite: number,
      status: string,
      deliveryDate: string
    }]
  }]
}
```

**Route POST : `/api/stock-analysis/recalculate-local-reserve`**

```javascript
// Authentification requise
// Rôle autorisé : ADMIN uniquement

// Action : Synchronise le stockLocalReserve de chaque produit
// avec la réalité des commandes en cours

// Réponse JSON
{
  message: string,
  totalCorrections: number,
  totalCommandesAnalysees: number,
  corrections: [{
    productId: number,
    productNom: string,
    ancien: number,
    nouveau: number,
    ecart: number,
    commandes: [{
      ref: string,
      quantite: number,
      livreur: string
    }]
  }]
}
```

### Frontend (React + TypeScript)

**Technologies :**
- React 18 + TypeScript
- TanStack Query (React Query)
- Tailwind CSS
- Lucide React (icônes)
- React Hot Toast (notifications)

**Structure du composant :**

```typescript
// État local
const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
const [expandedDeliverer, setExpandedDeliverer] = useState<number | null>(null);
const [dateFilter, setDateFilter] = useState<DateFilter>('all');

// Queries
const { data: analysisData, isLoading, refetch } = useQuery({
  queryKey: ['stock-analysis-local'],
  queryFn: async () => {
    const { data } = await api.get('/stock-analysis/local-reserve');
    return data;
  }
});

// Mutation (Synchroniser)
const syncMutation = useMutation({
  mutationFn: async () => {
    const { data } = await api.post('/stock-analysis/recalculate-local-reserve');
    return data;
  },
  onSuccess: (data) => {
    toast.success(data.message);
    queryClient.invalidateQueries({ queryKey: ['stock-analysis-local'] });
  }
});
```

**Filtrage par date :**

```typescript
type DateFilter = 'today' | 'week' | 'month' | 'all';

const filterByDate = (items: any[]) => {
  if (dateFilter === 'all') return items;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return items.map(item => {
    const filteredCommandes = item.commandes.filter((cmd: any) => {
      const cmdDate = cmd.deliveryDate ? new Date(cmd.deliveryDate) : new Date();
      
      switch (dateFilter) {
        case 'today':
          return cmdDate >= today;
        case 'week':
          return cmdDate >= weekAgo;
        case 'month':
          return cmdDate >= monthAgo;
        default:
          return true;
      }
    });

    if (filteredCommandes.length === 0) return null;

    const quantite = filteredCommandes.reduce((sum: number, cmd: any) => sum + cmd.quantite, 0);

    return {
      ...item,
      commandes: filteredCommandes,
      quantiteReelle: quantite,
      totalQuantite: quantite
    };
  }).filter(Boolean);
};
```

**Badges de statut :**

```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ASSIGNEE':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} /> En livraison
        </span>
      );
    case 'REFUSEE':
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} /> Refusé
        </span>
      );
    case 'ANNULEE_LIVRAISON':
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} /> Annulé
        </span>
      );
    case 'RETOURNE':
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
          <RotateCcw size={12} /> Retourné
        </span>
      );
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
  }
};
```

---

## 🎨 CLASSES TAILWIND CSS UTILISÉES

### Cartes principales

```css
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}
```

### Cartes statistiques

```css
/* Carte 1 - Commandes */
bg-blue-50 border-blue-200

/* Carte 2 - Quantité */
bg-green-50 border-green-200

/* Carte 3 - Livreurs */
bg-purple-50 border-purple-200

/* Carte 4 - Produits */
bg-amber-50 border-amber-200
```

### Boutons

```css
/* Bouton primaire */
.btn-primary {
  @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2;
}

/* Bouton secondaire */
.btn-secondary {
  @apply px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2;
}
```

### En-têtes de livreur (expansion)

```css
/* Header collapsed */
bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer hover:border-primary-300

/* Header expanded */
border rounded-lg overflow-hidden
```

### Produits (cartes mini)

```css
bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200
```

### Commandes individuelles

```css
bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors
```

---

## 🔄 INTERACTIONS UTILISATEUR

### 1. Actualiser

```typescript
<button
  onClick={() => refetch()}
  className="btn btn-secondary flex items-center gap-2"
>
  <RefreshCw size={18} />
  Actualiser
</button>
```

### 2. Synchroniser (Admin uniquement)

```typescript
{canSync && (
  <button
    onClick={() => {
      const ok = confirm(
        'Synchroniser le stock "en livraison" (stockLocalReserve) avec la réalité des commandes en cours ?\n\n' +
        'Cela corrige les valeurs négatives/erronées et crée des mouvements de type CORRECTION.\n' +
        'Aucun stock magasin (stockActuel) ni EXPRESS ne sera modifié.'
      );
      if (ok) syncMutation.mutate();
    }}
    className="btn btn-primary flex items-center gap-2"
    disabled={syncMutation.isPending}
  >
    <RotateCcw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />
    {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser'}
  </button>
)}
```

### 3. Expansion/Collapse

```typescript
const toggleProduct = (productId: number) => {
  setExpandedProduct(expandedProduct === productId ? null : productId);
};

const toggleDeliverer = (delivererId: number) => {
  setExpandedDeliverer(expandedDeliverer === delivererId ? null : delivererId);
};
```

### 4. Filtres de date

```typescript
<button
  onClick={() => setDateFilter('today')}
  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
    dateFilter === 'today'
      ? 'bg-primary-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
  Aujourd'hui
</button>
```

---

## 📱 RESPONSIVE DESIGN

### Mobile (< 768px)

```css
/* Statistiques en colonne */
grid-cols-1

/* En-tête empilé */
flex-col gap-4

/* Boutons pleine largeur */
w-full
```

### Tablet (768px - 1024px)

```css
/* Statistiques 2 colonnes */
md:grid-cols-2

/* En-tête en ligne */
sm:flex-row sm:justify-between
```

### Desktop (> 1024px)

```css
/* Statistiques 4 colonnes */
lg:grid-cols-4

/* Produits du livreur 3 colonnes */
lg:grid-cols-3
```

---

## ⚡ OPTIMISATIONS

### Performance

1. **Pagination backend** (si > 1000 commandes)
2. **Index Supabase** :
   ```sql
   CREATE INDEX idx_orders_stock_analysis 
     ON orders(status, "deliveryType", "productId", "delivererId");
   ```
3. **Lazy loading** des détails (expansion)

### UX

1. **Loading states** : Spinner pendant chargement
2. **Empty states** : Message si aucune donnée
3. **Confirmations** : Modale avant synchronisation
4. **Toasts** : Notifications de succès/erreur

---

## 🎯 CAS D'USAGE

### Cas 1 : Admin consulte le stock avec les livreurs

1. Admin se connecte
2. Va sur "Livraisons en cours"
3. Voit immédiatement les 4 statistiques
4. Clique sur un livreur pour voir ses produits
5. Exporte ou prend des décisions

### Cas 2 : Gestionnaire détecte un écart

1. Gestionnaire voit qu'un produit a un écart
2. Clique sur le produit pour voir le détail
3. Contacte le livreur concerné
4. Admin clique "Synchroniser" pour corriger

### Cas 3 : Consultation mobile

1. Livreur/Admin sur mobile
2. Interface responsive
3. Statistiques empilées
4. Navigation facile

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### Backend
- [ ] Route GET `/api/stock-analysis/local-reserve`
- [ ] Route POST `/api/stock-analysis/recalculate-local-reserve`
- [ ] Middleware d'authentification
- [ ] Autorisation par rôle (ADMIN, GESTIONNAIRE, GESTIONNAIRE_STOCK)
- [ ] Gestion des erreurs
- [ ] Logs console pour debug

### Frontend
- [ ] Composant React `LiveraisonEnCours.tsx`
- [ ] Query TanStack pour GET
- [ ] Mutation TanStack pour POST
- [ ] État local (expansion, filtres)
- [ ] Filtrage par date
- [ ] Badges de statut
- [ ] Cards statistiques
- [ ] Vue par livreur (expandable)
- [ ] Vue par produit (expandable)
- [ ] Responsive design
- [ ] Loading states
- [ ] Empty states
- [ ] Toasts (notifications)

### Styling
- [ ] Tailwind CSS configuré
- [ ] Classes utilitaires
- [ ] Couleurs cohérentes (primary, blue, green, etc.)
- [ ] Icônes Lucide React
- [ ] Animations (hover, transitions)

### Tests
- [ ] Tester avec 0 commande
- [ ] Tester avec 1000+ commandes
- [ ] Tester filtres de date
- [ ] Tester synchronisation
- [ ] Tester responsive (mobile/tablet/desktop)
- [ ] Tester permissions (Admin vs Gestionnaire)

---

## 🚀 EXEMPLE DE PROMPT POUR CRÉER UNE PAGE SIMILAIRE

```
Crée une page de suivi en temps réel du [CONCEPT] avec les caractéristiques suivantes :

FONCTIONNALITÉS :
- Afficher des statistiques globales (4 cartes)
- Vue par [ENTITÉ 1] (expandable)
- Vue par [ENTITÉ 2] (expandable)
- Filtres par date (Aujourd'hui / Semaine / Mois / Tout)
- Bouton "Actualiser" pour rafraîchir les données
- Bouton "Synchroniser" (Admin uniquement) pour corriger les écarts

API BACKEND :
- Route GET `/api/[RESOURCE]/analyze` qui retourne :
  - summary (statistiques globales)
  - par[Entité1] (array)
  - par[Entité2] (array)

- Route POST `/api/[RESOURCE]/synchronize` (Admin uniquement)

DESIGN :
- 4 cartes statistiques colorées (blue, green, purple, amber)
- Sections expandables avec chevron up/down
- Badges de statut colorés
- Design responsive (mobile first)
- Animations smooth

TECH STACK :
- React 18 + TypeScript
- TanStack Query
- Tailwind CSS
- Lucide React (icônes)
- React Hot Toast

Utilise le même style et la même structure que la page "Livraisons en cours" existante.
```

---

## 📝 NOTES IMPORTANTES

1. **Ne pas modifier stockActuel** : La synchronisation touche UNIQUEMENT `stockLocalReserve`
2. **Confirmation obligatoire** : Toujours demander confirmation avant sync
3. **Logs console** : Ajouter des logs pour debug
4. **Performance** : Ajouter des index si > 1000 commandes
5. **Responsive** : Tester sur mobile/tablet/desktop

---

**Date de création :** 1er février 2026  
**Auteur :** GS Pipeline Documentation  
**Version :** 1.0

