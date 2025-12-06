import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Trash2, Calendar, Package, X, RefreshCw } from 'lucide-react';
import { ordersApi, productsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';
import { toast } from 'react-hot-toast';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();

  // Récupérer la liste des produits pour le filtre
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, productFilter, startDate, endDate],
    queryFn: () => ordersApi.getAll({ 
      page, 
      limit: 20, 
      status: statusFilter || undefined,
      produit: productFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
    refetchInterval: 30000, // Actualisation automatique toutes les 30 secondes
    refetchIntervalInBackground: true, // Continue même si l'onglet n'est pas actif
  });

  // Compteur pour afficher le temps écoulé depuis la dernière actualisation
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date());
      setSecondsSinceUpdate(0);
    }
  }, [isFetching]);

  // Mise à jour du compteur toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.delete(orderId),
    onSuccess: () => {
      toast.success('Commande supprimée avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setShowDeleteModal(false);
      setOrderToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setProductFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter || productFilter || startDate || endDate;

  const filteredOrders = data?.orders?.filter((order: Order) =>
    order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clientTelephone.includes(searchTerm) ||
    order.orderReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toutes les commandes</h1>
          <p className="text-gray-600 mt-1">Gestion complète des commandes</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Actualisation...
            </span>
          )}
          {!isFetching && (
            <span className="text-xs text-gray-400">
              Mis à jour il y a {secondsSinceUpdate}s
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary flex items-center gap-2"
            title="Actualiser les commandes"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="space-y-4">
          {/* Ligne 1 : Recherche et bouton filtres */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            >
              <Filter size={20} />
              Filtres avancés
              {hasActiveFilters && (
                <span className="bg-white text-primary-600 rounded-full px-2 py-0.5 text-xs font-bold">
                  {[statusFilter, productFilter, startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Ligne 2 : Filtres avancés (affichés si showFilters est true) */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {/* Filtre par statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  <option value="">Tous les statuts</option>
                  <option value="NOUVELLE">Nouvelle</option>
                  <option value="A_APPELER">À appeler</option>
                  <option value="VALIDEE">Validée</option>
                  <option value="ASSIGNEE">Assignée</option>
                  <option value="LIVREE">Livrée</option>
                  <option value="ANNULEE">Annulée</option>
                  <option value="REFUSEE">Refusée</option>
                </select>
              </div>

              {/* Filtre par produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Package size={16} className="inline mr-1" />
                  Produit
                </label>
                <select
                  value={productFilter}
                  onChange={(e) => {
                    setProductFilter(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                >
                  <option value="">Tous les produits</option>
                  {productsData?.products?.map((product: any) => (
                    <option key={product.id} value={product.nom}>
                      {product.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par date de début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Date début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Date fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Ligne 3 : Bouton réinitialiser (affiché si filtres actifs) */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {[statusFilter, productFilter, startDate, endDate].filter(Boolean).length} filtre(s) actif(s)
              </div>
              <button
                onClick={resetFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X size={16} />
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders?.map((order: Order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                      <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                      <td className="py-3 px-4 text-sm">{order.clientTelephone}</td>
                      <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                      <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setOrderToDelete(order);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Supprimer la commande"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {data.pagination.page} sur {data.pagination.totalPages}
                  {' '}({data.pagination.total} commandes)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la commande <strong>{orderToDelete.orderReference}</strong> ?
              <br />
              <br />
              <span className="text-sm">
                <strong>Client :</strong> {orderToDelete.clientNom}
                <br />
                <strong>Produit :</strong> {orderToDelete.produitNom}
                <br />
                <strong>Montant :</strong> {formatCurrency(orderToDelete.montant)}
              </span>
              {orderToDelete.status === 'LIVREE' && (
                <>
                  <br />
                  <br />
                  <span className="text-amber-600 text-sm">
                    ⚠️ Cette commande est LIVRÉE. Le stock sera automatiquement restauré.
                  </span>
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
                className="btn btn-secondary"
                disabled={deleteOrderMutation.isPending}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteOrder}
                className="btn bg-red-600 text-white hover:bg-red-700"
                disabled={deleteOrderMutation.isPending}
              >
                {deleteOrderMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




