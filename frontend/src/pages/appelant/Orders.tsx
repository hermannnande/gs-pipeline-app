import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['appelant-orders'],
    queryFn: () => ordersApi.getAll({ limit: 100 }),
    refetchInterval: 5000, // Actualisation automatique toutes les 5 secondes
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      ordersApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      setSelectedOrder(null);
      setNote('');
      toast.success('Commande mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const handleUpdateStatus = (status: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status,
      note: note || undefined,
    });
  };

  const filteredOrders = ordersData?.orders
    ?.filter((order: Order) => {
      // IMPORTANT : Afficher UNIQUEMENT les commandes NOUVELLE et A_APPELER
      // Les commandes traitées (VALIDEE, ANNULEE, INJOIGNABLE, etc.) ne doivent PAS apparaître ici
      const isToCall = ['NOUVELLE', 'A_APPELER'].includes(order.status);
      
      if (!isToCall) return false; // Exclure toutes les commandes déjà traitées
      
      const matchesSearch = order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientTelephone.includes(searchTerm);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Trier par date de création, les plus récentes en premier
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes à appeler</h1>
          <p className="text-gray-600 mt-1">Liste des commandes en attente de traitement</p>
        </div>
        {filteredOrders && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{filteredOrders.length}</p>
            <p className="text-sm text-gray-600">commande(s)</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="">Tous</option>
            <option value="NOUVELLE">Nouvelle</option>
            <option value="A_APPELER">À appeler</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredOrders && filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">Aucune commande trouvée</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders?.map((order: Order) => (
            <div key={order.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                  <p className="text-sm text-gray-600">{order.clientVille}</p>
                </div>
                <span className={`badge ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <a href={`tel:${order.clientTelephone}`} className="text-primary-600 hover:underline">
                    {order.clientTelephone}
                  </a>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Produit:</strong> {order.produitNom}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Quantité:</strong> {order.quantite}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  <strong>Montant:</strong> {formatCurrency(order.montant)}
                </div>
                {order.clientAdresse && (
                  <div className="text-sm text-gray-600">
                    <strong>Adresse:</strong> {order.clientAdresse}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(order)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                Traiter l'appel
              </button>

              <p className="text-xs text-gray-500 mt-2">
                Reçue le {formatDateTime(order.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de traitement */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Traiter l'appel</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
              <p className="text-gray-600">{selectedOrder.clientVille}</p>
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium">
                {selectedOrder.clientTelephone}
              </a>
              <p className="mt-2 text-sm">
                <strong>Produit:</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
              <p className="text-sm">
                <strong>Montant:</strong> {formatCurrency(selectedOrder.montant)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input"
                rows={3}
                placeholder="Ajouter une note..."
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('VALIDEE')}
                className="btn btn-success w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✓ Commande validée
              </button>
              <button
                onClick={() => handleUpdateStatus('INJOIGNABLE')}
                className="btn btn-secondary w-full"
                disabled={updateStatusMutation.isPending}
              >
                📵 Client injoignable
              </button>
              <button
                onClick={() => handleUpdateStatus('ANNULEE')}
                className="btn btn-danger w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✕ Commande annulée
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedOrder(null);
                setNote('');
              }}
              className="btn btn-secondary w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

