import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Zap, Package, CheckCircle, Phone, MapPin, DollarSign, Calendar, Users, Search, Filter, X } from 'lucide-react';
import { ordersApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import type { Order } from '@/types';
import { VILLES_AGENCES_EXPRESS } from '@/constants/cities';

export default function ExpeditionsExpress() {
  const [activeTab, setActiveTab] = useState<'expeditions' | 'express-pending' | 'express-arrived' | 'history'>('expeditions');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showArriveModal, setShowArriveModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivererId, setSelectedDelivererId] = useState<number | null>(null);
  const [finalizeData, setFinalizeData] = useState({
    montantPaye: 0,
    modePaiement: '',
    referencePayment: '',
  });

  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVille, setFilterVille] = useState('');
  const [filterProduit, setFilterProduit] = useState('');
  const [filterAgence, setFilterAgence] = useState('');
  const [filterLivreur, setFilterLivreur] = useState('');
  const [filterPaiement, setFilterPaiement] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Vérifier si l'utilisateur peut assigner des livreurs
  const canAssignDeliverer = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';

  // Récupérer les livreurs
  const { data: deliverersData } = useQuery({
    queryKey: ['deliverers'],
    queryFn: () => usersApi.getAll({ role: 'LIVREUR', actif: true }),
  });

  const deliverers = deliverersData?.users || [];

  // Récupérer toutes les commandes EXPÉDITION
  const { data: expeditionsData, isLoading: loadingExpeditions } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => ordersApi.getAll({ status: 'EXPEDITION', limit: 100 }),
    refetchInterval: 30000,
  });

  // Récupérer les commandes EXPÉDITION assignées
  const { data: assignedData, isLoading: loadingAssigned } = useQuery({
    queryKey: ['expeditions-assigned'],
    queryFn: () => ordersApi.getAll({ status: 'ASSIGNEE', deliveryType: 'EXPEDITION', limit: 100 }),
    refetchInterval: 30000,
  });

  // Fusionner les expéditions non assignées et assignées
  const allExpeditions = [
    ...(expeditionsData?.orders || []),
    ...(assignedData?.orders || [])
  ];

  const { data: expressData, isLoading: loadingExpress } = useQuery({
    queryKey: ['express-pending'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS', limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: expressArrivedData, isLoading: loadingArrived } = useQuery({
    queryKey: ['express-arrived'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS_ARRIVE', limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['express-history'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS_LIVRE', limit: 100 }),
  });

  // Mutation pour marquer EXPRESS comme arrivé
  const arriveExpressMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.markExpressArrived(orderId),
    onSuccess: () => {
      toast.success('✅ Colis marqué comme arrivé en agence');
      queryClient.invalidateQueries({ queryKey: ['express-pending'] });
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
      setShowArriveModal(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour notifier le client
  const notifyClientMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.notifyExpressClient(orderId),
    onSuccess: () => {
      toast.success('✅ Client notifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour finaliser EXPRESS
  const finalizeExpressMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: any }) => 
      ordersApi.finalizeExpress(orderId, data),
    onSuccess: () => {
      toast.success('✅ EXPRESS finalisé avec succès');
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
      queryClient.invalidateQueries({ queryKey: ['express-history'] });
      setShowFinalizeModal(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour assigner un livreur à une EXPÉDITION
  const assignDelivererMutation = useMutation({
    mutationFn: ({ orderId, delivererId }: { orderId: number; delivererId: number }) => 
      ordersApi.assignExpeditionDeliverer(orderId, delivererId),
    onSuccess: () => {
      toast.success('✅ Livreur assigné avec succès');
      queryClient.invalidateQueries({ queryKey: ['expeditions'] });
      queryClient.invalidateQueries({ queryKey: ['expeditions-assigned'] });
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedDelivererId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'assignation');
    },
  });

  const handleFinalizeExpress = () => {
    if (!selectedOrder) return;
    finalizeExpressMutation.mutate({
      orderId: selectedOrder.id,
      data: finalizeData,
    });
  };

  const handleAssignDeliverer = () => {
    if (!selectedOrder || !selectedDelivererId) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }
    assignDelivererMutation.mutate({
      orderId: selectedOrder.id,
      delivererId: selectedDelivererId,
    });
  };

  // Fonction de filtrage générique
  const filterOrders = (orders: Order[]) => {
    if (!orders) return [];
    
    return orders.filter((order) => {
      // Recherche par texte
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          order.clientNom?.toLowerCase().includes(term) ||
          order.clientTelephone?.toLowerCase().includes(term) ||
          order.orderReference?.toLowerCase().includes(term) ||
          order.produitNom?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Filtre par ville
      if (filterVille && order.clientVille !== filterVille) return false;

      // Filtre par produit
      if (filterProduit && !order.produitNom?.toLowerCase().includes(filterProduit.toLowerCase())) return false;

      // Filtre par agence
      if (filterAgence && order.agenceRetrait !== filterAgence) return false;

      // Filtre par livreur
      if (filterLivreur) {
        const livreurId = parseInt(filterLivreur);
        if (livreurId === 0) {
          // Filtre "Non assigné"
          if (order.delivererId !== null) return false;
        } else {
          if (order.delivererId !== livreurId) return false;
        }
      }

      // Filtre par mode de paiement
      if (filterPaiement && order.modePaiement !== filterPaiement) return false;

      // Filtre par période
      if (filterStartDate) {
        const orderDate = new Date(order.createdAt);
        const startDate = new Date(filterStartDate);
        if (orderDate < startDate) return false;
      }
      if (filterEndDate) {
        const orderDate = new Date(order.createdAt);
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) return false;
      }

      return true;
    });
  };

  // Appliquer les filtres
  const filteredExpeditions = useMemo(() => filterOrders(allExpeditions), [allExpeditions, searchTerm, filterVille, filterProduit, filterLivreur, filterPaiement, filterStartDate, filterEndDate]);
  const filteredExpress = useMemo(() => filterOrders(expressData?.orders || []), [expressData, searchTerm, filterVille, filterProduit, filterAgence, filterPaiement, filterStartDate, filterEndDate]);
  const filteredExpressArrived = useMemo(() => filterOrders(expressArrivedData?.orders || []), [expressArrivedData, searchTerm, filterVille, filterProduit, filterAgence, filterPaiement, filterStartDate, filterEndDate]);
  const filteredHistory = useMemo(() => filterOrders(historyData?.orders || []), [historyData, searchTerm, filterVille, filterProduit, filterAgence, filterLivreur, filterPaiement, filterStartDate, filterEndDate]);

  // Utiliser la liste fixe des villes et agences EXPRESS (Côte d'Ivoire)
  const uniqueVilles = [...VILLES_AGENCES_EXPRESS];
  const uniqueAgences = [...VILLES_AGENCES_EXPRESS];

  const uniquePaiements = useMemo(() => {
    const allOrders = [...allExpeditions, ...(expressData?.orders || []), ...(expressArrivedData?.orders || []), ...(historyData?.orders || [])];
    return Array.from(new Set(allOrders.map(o => o.modePaiement).filter(Boolean))).sort();
  }, [allExpeditions, expressData, expressArrivedData, historyData]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterVille('');
    setFilterProduit('');
    setFilterAgence('');
    setFilterLivreur('');
    setFilterPaiement('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const tabs = [
    { id: 'expeditions', label: 'Expéditions', icon: Truck, count: filteredExpeditions.length },
    { id: 'express-pending', label: 'EXPRESS - À expédier', icon: Zap, count: filteredExpress.length },
    { id: 'express-arrived', label: 'EXPRESS - En agence', icon: Package, count: filteredExpressArrived.length },
    { id: 'history', label: 'Historique', icon: CheckCircle, count: filteredHistory.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expéditions & EXPRESS</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Gestion des livraisons vers les villes éloignées</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card">
        {/* Barre de recherche */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher (nom, téléphone, référence, produit)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2 whitespace-nowrap`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtres</span>
            <span className="sm:hidden">Filtrer</span>
            {(filterVille || filterProduit || filterAgence || filterLivreur || filterPaiement || filterStartDate || filterEndDate) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {[filterVille, filterProduit, filterAgence, filterLivreur, filterPaiement, filterStartDate, filterEndDate].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtre par ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Ville client
                </label>
                <select
                  value={filterVille}
                  onChange={(e) => setFilterVille(e.target.value)}
                  className="input"
                >
                  <option value="">Toutes les villes</option>
                  {uniqueVilles.map((ville) => (
                    <option key={ville} value={ville}>{ville}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📦 Produit
                </label>
                <input
                  type="text"
                  placeholder="Nom du produit..."
                  value={filterProduit}
                  onChange={(e) => setFilterProduit(e.target.value)}
                  className="input"
                />
              </div>

              {/* Filtre par agence (pour EXPRESS) */}
              {(activeTab === 'express-pending' || activeTab === 'express-arrived' || activeTab === 'history') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏢 Agence de retrait
                  </label>
                  <select
                    value={filterAgence}
                    onChange={(e) => setFilterAgence(e.target.value)}
                    className="input"
                  >
                    <option value="">Toutes les agences</option>
                    {uniqueAgences.map((agence) => (
                      <option key={agence} value={agence}>{agence}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtre par livreur (pour EXPÉDITIONS) */}
              {(activeTab === 'expeditions' || activeTab === 'history') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🚚 Livreur
                  </label>
                  <select
                    value={filterLivreur}
                    onChange={(e) => setFilterLivreur(e.target.value)}
                    className="input"
                  >
                    <option value="">Tous les livreurs</option>
                    <option value="0">Non assigné</option>
                    {deliverers.map((livreur: any) => (
                      <option key={livreur.id} value={livreur.id}>
                        {livreur.prenom} {livreur.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtre par mode de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💳 Mode de paiement
                </label>
                <select
                  value={filterPaiement}
                  onChange={(e) => setFilterPaiement(e.target.value)}
                  className="input"
                >
                  <option value="">Tous les modes</option>
                  {uniquePaiements.map((paiement) => (
                    <option key={paiement} value={paiement}>{paiement}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date début
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="input"
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Date fin
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Bouton réinitialiser */}
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="btn btn-secondary text-sm flex items-center gap-2"
              >
                <X size={16} />
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count > 0 && (
                  <span className={`
                    ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-bold
                    ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="card">
        {/* ONGLET 1 : EXPÉDITIONS */}
        {activeTab === 'expeditions' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="text-blue-600" />
              Expéditions en cours ({filteredExpeditions.length})
              {filteredExpeditions.length !== allExpeditions.length && (
                <span className="text-sm font-normal text-gray-500">
                  (sur {allExpeditions.length} total)
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Commandes avec paiement 100% effectué, en attente de livraison
            </p>

            {(loadingExpeditions || loadingAssigned) ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredExpeditions.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {allExpeditions.length === 0 
                    ? 'Aucune expédition en cours' 
                    : 'Aucun résultat ne correspond aux filtres'}
                </p>
                {allExpeditions.length > 0 && (
                  <button onClick={resetFilters} className="btn btn-secondary mt-4">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date & Heure</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant payé</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Paiement</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Livreur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpeditions.map((order: Order) => {
                      const deliverer = order.delivererId 
                        ? deliverers.find((d: any) => d.id === order.delivererId)
                        : null;
                      
                      return (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{order.clientNom}</div>
                            <div className="text-xs text-gray-500">{order.clientTelephone}</div>
                          </td>
                          <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                          <td className="py-3 px-4 text-sm">{order.produitNom} (x{order.quantite})</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formatDateTime(order.expedieAt || order.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-green-600">
                            {formatCurrency(order.montantPaye || order.montant)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div>{order.modePaiement}</div>
                            {order.referencePayment && (
                              <div className="text-xs text-gray-500">{order.referencePayment}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {deliverer ? (
                              <div className="text-sm">
                                <div className="font-medium">{deliverer.prenom} {deliverer.nom}</div>
                                <div className="text-xs text-gray-500">{deliverer.telephone}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Non assigné</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!order.delivererId && canAssignDeliverer && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowAssignModal(true);
                                }}
                                className="btn btn-sm btn-primary flex items-center gap-1"
                              >
                                <Users size={16} />
                                Assigner livreur
                              </button>
                            )}
                            {!order.delivererId && !canAssignDeliverer && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                ⏳ En attente d'assignation
                              </span>
                            )}
                            {order.delivererId && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                ✓ Assignée - Préparer le colis
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : EXPRESS À EXPÉDIER */}
        {activeTab === 'express-pending' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-amber-600" />
              EXPRESS - À expédier ({filteredExpress.length})
              {filteredExpress.length !== (expressData?.orders?.length || 0) && (
                <span className="text-sm font-normal text-gray-500">
                  (sur {expressData?.orders?.length || 0} total)
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Commandes avec acompte 10% payé, en attente d'expédition vers l'agence
            </p>

            {loadingExpress ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : filteredExpress.length === 0 ? (
              <div className="text-center py-12">
                <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {(expressData?.orders?.length || 0) === 0 
                    ? 'Aucun EXPRESS en attente' 
                    : 'Aucun résultat ne correspond aux filtres'}
                </p>
                {(expressData?.orders?.length || 0) > 0 && (
                  <button onClick={resetFilters} className="btn btn-secondary mt-4">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date & Heure</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acompte (10%)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Restant (90%)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpress.map((order: Order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{order.clientNom}</div>
                          <div className="text-xs text-gray-500">{order.clientTelephone}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">{order.produitNom} (x{order.quantite})</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDateTime(order.expedieAt || order.createdAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-green-600">
                          {formatCurrency(order.montantPaye || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-amber-600">
                          {formatCurrency(order.montantRestant || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {order.agenceRetrait}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowArriveModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            Marquer arrivé
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : EXPRESS EN AGENCE */}
        {activeTab === 'express-arrived' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="text-cyan-600" />
              EXPRESS - En agence ({filteredExpressArrived.length})
              {filteredExpressArrived.length !== (expressArrivedData?.orders?.length || 0) && (
                <span className="text-sm font-normal text-gray-500">
                  (sur {expressArrivedData?.orders?.length || 0} total)
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Colis arrivés en agence, en attente du retrait par le client (paiement des 90% restants)
            </p>

            {loadingArrived ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              </div>
            ) : filteredExpressArrived.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {(expressArrivedData?.orders?.length || 0) === 0 
                    ? 'Aucun colis en attente de retrait' 
                    : 'Aucun résultat ne correspond aux filtres'}
                </p>
                {(expressArrivedData?.orders?.length || 0) > 0 && (
                  <button onClick={resetFilters} className="btn btn-secondary mt-4">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredExpressArrived.map((order: Order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{order.clientNom}</h3>
                          {order.clientNotifie ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              ✓ Notifié
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              ⚠️ À notifier
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <Phone size={14} className="inline mr-1" />
                          {order.clientTelephone}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="inline mr-1" />
                          <strong>Agence :</strong> {order.agenceRetrait}
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Référence :</strong> {order.orderReference}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Arrivé le</p>
                        <p className="text-sm font-medium">{order.arriveAt ? formatDateTime(order.arriveAt) : '-'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Acompte payé</p>
                          <p className="font-bold text-green-600">{formatCurrency(order.montantPaye || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">À payer au retrait</p>
                          <p className="font-bold text-amber-600">{formatCurrency(order.montantRestant || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-bold">{formatCurrency(order.montant)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!order.clientNotifie && (
                        <button
                          onClick={() => notifyClientMutation.mutate(order.id)}
                          className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                          disabled={notifyClientMutation.isPending}
                        >
                          <Phone size={16} />
                          Notifier le client
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setFinalizeData({
                            montantPaye: order.montantRestant || 0,
                            modePaiement: '',
                            referencePayment: '',
                          });
                          setShowFinalizeModal(true);
                        }}
                        className="btn btn-success flex-1 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Client a retiré
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 4 : HISTORIQUE */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Historique EXPRESS livrés ({filteredHistory.length})
              {filteredHistory.length !== (historyData?.orders?.length || 0) && (
                <span className="text-sm font-normal text-gray-500">
                  (sur {historyData?.orders?.length || 0} total)
                </span>
              )}
            </h2>

            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {(historyData?.orders?.length || 0) === 0 
                    ? 'Aucun historique' 
                    : 'Aucun résultat ne correspond aux filtres'}
                </p>
                {(historyData?.orders?.length || 0) > 0 && (
                  <button onClick={resetFilters} className="btn btn-secondary mt-4">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant total</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date retrait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((order: Order) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{order.orderReference}</td>
                        <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                        <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                        <td className="py-3 px-4 text-sm">{order.agenceRetrait}</td>
                        <td className="py-3 px-4 text-sm font-bold">{formatCurrency(order.montant)}</td>
                        <td className="py-3 px-4 text-sm">{order.deliveredAt ? formatDateTime(order.deliveredAt) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Assigner un livreur */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Assigner un livreur</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-1">
                <strong>Référence :</strong> {selectedOrder.orderReference}
              </p>
              <p className="text-sm text-blue-800 mb-1">
                <strong>Client :</strong> {selectedOrder.clientNom}
              </p>
              <p className="text-sm text-blue-800 mb-1">
                <strong>Ville :</strong> {selectedOrder.clientVille}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Produit :</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un livreur <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDelivererId || ''}
                onChange={(e) => setSelectedDelivererId(parseInt(e.target.value))}
                className="input"
                required
              >
                <option value="">Choisir un livreur...</option>
                {deliverers.map((deliverer: any) => (
                  <option key={deliverer.id} value={deliverer.id}>
                    {deliverer.prenom} {deliverer.nom} - {deliverer.telephone}
                  </option>
                ))}
              </select>
              {deliverers.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Aucun livreur disponible. Veuillez créer un compte livreur d'abord.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedDelivererId(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignDeliverer}
                className="btn btn-primary flex-1"
                disabled={assignDelivererMutation.isPending || !selectedDelivererId}
              >
                {assignDelivererMutation.isPending ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Marquer EXPRESS comme arrivé */}
      {showArriveModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmer l'arrivée en agence</h3>
            <p className="text-gray-600 mb-4">
              Le colis <strong>{selectedOrder.orderReference}</strong> pour <strong>{selectedOrder.clientNom}</strong> est bien arrivé à l'agence <strong>{selectedOrder.agenceRetrait}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowArriveModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => arriveExpressMutation.mutate(selectedOrder.id)}
                className="btn btn-primary flex-1"
                disabled={arriveExpressMutation.isPending}
              >
                {arriveExpressMutation.isPending ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Finaliser EXPRESS */}
      {showFinalizeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Finaliser le retrait EXPRESS</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 mb-1">
                <strong>Client :</strong> {selectedOrder.clientNom}
              </p>
              <p className="text-sm text-green-800 mb-1">
                <strong>Produit :</strong> {selectedOrder.produitNom}
              </p>
              <p className="text-sm text-green-800 mb-2">
                <strong>Agence :</strong> {selectedOrder.agenceRetrait}
              </p>
              <div className="border-t border-green-200 pt-2 mt-2">
                <p className="text-sm text-green-800">Le client doit payer :</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(selectedOrder.montantRestant || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={finalizeData.montantPaye}
                  onChange={(e) => setFinalizeData({...finalizeData, montantPaye: parseFloat(e.target.value) || 0})}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement <span className="text-red-500">*</span>
                </label>
                <select
                  value={finalizeData.modePaiement}
                  onChange={(e) => setFinalizeData({...finalizeData, modePaiement: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  <option value="Cash">Cash</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="MTN Money">MTN Money</option>
                  <option value="Moov Money">Moov Money</option>
                  <option value="Wave">Wave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence de transaction (optionnel)
                </label>
                <input
                  type="text"
                  value={finalizeData.referencePayment}
                  onChange={(e) => setFinalizeData({...finalizeData, referencePayment: e.target.value})}
                  className="input"
                  placeholder="Ex: TRX123456789"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFinalizeModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleFinalizeExpress}
                className="btn btn-success flex-1"
                disabled={!finalizeData.modePaiement || finalizeExpressMutation.isPending}
              >
                {finalizeExpressMutation.isPending ? 'Finalisation...' : 'Finaliser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

