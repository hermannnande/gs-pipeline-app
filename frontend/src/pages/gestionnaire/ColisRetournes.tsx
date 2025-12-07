import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Phone, MapPin, Calendar, AlertCircle, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import type { Order } from '@/types';

const RAISONS_RETOUR = {
  CLIENT_ABSENT: 'Client absent / Injoignable',
  CLIENT_REFUSE: 'Client a refusé le colis',
  CLIENT_REPORTE: 'Client veut reporter la livraison',
  ADRESSE_INCORRECTE: 'Adresse incorrecte / Introuvable',
  ZONE_DANGEREUSE: 'Zone dangereuse / Inaccessible',
  AUTRE: 'Autre raison'
};

export default function ColisRetournes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [raisonFilter, setRaisonFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['returned-orders'],
    queryFn: () => ordersApi.getAll({ status: 'RETOURNE' }),
  });

  const relancerMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await ordersApi.updateStatus(orderId, 'VALIDEE', 'Livraison relancée par le gestionnaire');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returned-orders'] });
      setSelectedOrder(null);
      toast.success('Livraison relancée avec succès. La commande peut maintenant être réassignée.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la relance');
    },
  });

  const filteredOrders = ordersData?.orders?.filter((order: Order) => {
    const matchesSearch = !searchTerm || 
      order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientTelephone.includes(searchTerm) ||
      order.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.produitNom.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRaison = !raisonFilter || order.raisonRetour === raisonFilter;
    
    return matchesSearch && matchesRaison;
  }) || [];

  const handleRelancer = (order: Order) => {
    setSelectedOrder(order);
  };

  const confirmRelancer = () => {
    if (!selectedOrder) return;
    relancerMutation.mutate(selectedOrder.id);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Colis Retournés</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Colis non livrés retournés par les livreurs
          </p>
        </div>
        <div className="bg-orange-100 px-4 py-2 rounded-lg">
          <span className="text-2xl font-bold text-orange-600">{filteredOrders.length}</span>
          <span className="text-sm text-orange-600 ml-2">colis retournés</span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom, téléphone, référence, produit..."
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Raison du retour
            </label>
            <select
              value={raisonFilter}
              onChange={(e) => setRaisonFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Toutes les raisons</option>
              {Object.entries(RAISONS_RETOUR).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des colis retournés */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Chargement...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun colis retourné</h3>
          <p className="text-gray-500">
            {searchTerm || raisonFilter
              ? 'Aucun colis ne correspond à vos critères de recherche'
              : 'Tous les colis ont été livrés avec succès'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order: Order) => (
            <div
              key={order.id}
              className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-orange-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Informations principales */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                      {order.orderReference}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                      Retourné
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.clientNom}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.clientTelephone}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {order.clientVille}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">{order.produitNom}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantité: {order.quantite} • {formatCurrency(order.montant)}
                      </p>
                      {order.deliverer && (
                        <p className="text-sm text-gray-600 mt-1">
                          Livreur: {order.deliverer.prenom} {order.deliverer.nom}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Raison du retour */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-900">
                          {RAISONS_RETOUR[order.raisonRetour as keyof typeof RAISONS_RETOUR] || order.raisonRetour}
                        </p>
                        {order.noteLivreur && (
                          <p className="text-sm text-orange-700 mt-1">
                            Note: {order.noteLivreur}
                          </p>
                        )}
                        {order.retourneAt && (
                          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Retourné le {formatDateTime(order.retourneAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  <button
                    onClick={() => handleRelancer(order)}
                    className="btn btn-primary flex items-center gap-2 flex-1 lg:flex-none"
                    disabled={relancerMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Relancer la livraison</span>
                    <span className="sm:hidden">Relancer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de relance */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Relancer la livraison ?
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Commande</p>
                <p className="font-medium text-gray-900">{selectedOrder.orderReference}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{selectedOrder.clientNom}</p>
                <p className="text-sm text-gray-600">{selectedOrder.clientTelephone}</p>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-600">Raison du retour</p>
                <p className="font-medium text-orange-900">
                  {RAISONS_RETOUR[selectedOrder.raisonRetour as keyof typeof RAISONS_RETOUR] || selectedOrder.raisonRetour}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
              <p className="text-sm text-blue-900">
                ℹ️ La commande passera au statut "VALIDÉE" et pourra être réassignée à un livreur.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmRelancer}
                className="btn btn-primary flex-1"
                disabled={relancerMutation.isPending}
              >
                {relancerMutation.isPending ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


