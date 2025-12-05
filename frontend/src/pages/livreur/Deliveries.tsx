import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Deliveries() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['livreur-deliveries', selectedDate],
    queryFn: () => deliveryApi.getMyOrders({ date: selectedDate }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      ordersApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      setSelectedOrder(null);
      setNote('');
      toast.success('Livraison mise à jour avec succès');
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

  const pendingOrders = ordersData?.orders?.filter((o: Order) => o.status === 'ASSIGNEE') || [];
  const completedOrders = ordersData?.orders?.filter((o: Order) => 
    ['LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON'].includes(o.status)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes livraisons</h1>
          <p className="text-gray-600 mt-1">Gérez vos livraisons quotidiennes</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{ordersData?.orders?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Complétées</p>
          <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Livraisons en attente */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">À livrer ({pendingOrders.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order: Order) => (
                  <div key={order.id} className="card border-2 border-orange-200 hover:shadow-lg transition-shadow">
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
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          {order.clientAdresse || order.clientCommune || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <a 
                          href={`tel:${order.clientTelephone}`} 
                          className="text-primary-600 hover:underline"
                        >
                          {order.clientTelephone}
                        </a>
                      </div>
                      <div className="text-sm text-gray-600 pt-2 border-t">
                        <strong>Produit:</strong> {order.produitNom} (x{order.quantite})
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.montant)}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-primary w-full"
                    >
                      Traiter la livraison
                    </button>

                    {/* Navigation */}
                    {order.clientAdresse && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          order.clientAdresse + ', ' + order.clientVille
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary w-full mt-2 flex items-center justify-center gap-2"
                      >
                        <Navigation size={16} />
                        Itinéraire
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Livraisons complétées */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Complétées ({completedOrders.length})</h2>
              <div className="card">
                <div className="space-y-2">
                  {completedOrders.map((order: Order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{order.clientNom}</p>
                        <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.montant)}</p>
                        <span className={`badge ${getStatusColor(order.status)} mt-1`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                  <p className="text-sm text-gray-600">
                    Total encaissé:{' '}
                    <strong className="text-lg text-green-600">
                      {formatCurrency(
                        completedOrders
                          .filter(o => o.status === 'LIVREE')
                          .reduce((sum, o) => sum + o.montant, 0)
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {ordersData?.orders?.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">Aucune livraison pour cette date</p>
            </div>
          )}
        </>
      )}

      {/* Modal de traitement */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Traiter la livraison</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
              <p className="text-gray-600">{selectedOrder.clientVille}</p>
              {selectedOrder.clientAdresse && (
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.clientAdresse}</p>
              )}
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium">
                {selectedOrder.clientTelephone}
              </a>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm">
                  <strong>Produit:</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
                </p>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {formatCurrency(selectedOrder.montant)}
                </p>
              </div>
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
                onClick={() => handleUpdateStatus('LIVREE')}
                className="btn btn-success w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✓ Livraison effectuée
              </button>
              <button
                onClick={() => handleUpdateStatus('REFUSEE')}
                className="btn btn-danger w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✕ Refusée par le client
              </button>
              <button
                onClick={() => handleUpdateStatus('ANNULEE_LIVRAISON')}
                className="btn btn-secondary w-full"
                disabled={updateStatusMutation.isPending}
              >
                🚫 Annulée (absent, mauvaise adresse...)
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

