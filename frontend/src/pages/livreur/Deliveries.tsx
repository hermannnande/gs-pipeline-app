import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Navigation, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Deliveries() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  // Pour la livraison partielle : nombre d'unites prises par le client
  const [partialQty, setPartialQty] = useState<number>(1);
  // Mode "saisie quantite partielle" affiche dans la modal
  const [showPartialInput, setShowPartialInput] = useState(false);
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['livreur-deliveries', selectedDate],
    queryFn: () => deliveryApi.getMyOrders({ date: selectedDate }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note, quantiteLivree }: { id: number; status: string; note?: string; quantiteLivree?: number }) =>
      ordersApi.updateStatus(id, status, note, quantiteLivree),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      setSelectedOrder(null);
      setNote('');
      setShowPartialInput(false);
      setPartialQty(1);
      toast.success('Livraison mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const handleUpdateStatus = (status: string, quantiteLivree?: number) => {
    if (!selectedOrder) return;

    // Vérifier si le délai de 24h n'est pas dépassé
    if (selectedOrder.status !== 'ASSIGNEE' && !canModifyOrder(selectedOrder)) {
      toast.error('Le délai de 24h pour modifier cette livraison est dépassé');
      setSelectedOrder(null);
      return;
    }

    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status,
      note: note || undefined,
      quantiteLivree,
    });
  };

  const pendingOrders = ordersData?.orders?.filter((o: Order) => o.status === 'ASSIGNEE') || [];
  const completedOrders = ordersData?.orders?.filter((o: Order) =>
    ['LIVREE', 'LIVREE_PARTIELLE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(o.status)
  ) || [];

  // Fonction pour vérifier si une commande peut être modifiée (moins de 24h)
  const canModifyOrder = (order: Order) => {
    if (!order.updatedAt) return false;
    const updatedAt = new Date(order.updatedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  // Fonction pour calculer le temps restant pour modifier
  const getTimeRemaining = (order: Order) => {
    if (!order.updatedAt) return '';
    const updatedAt = new Date(order.updatedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = 24 - diffInHours;
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining} min`;
    }
    return `${Math.floor(hoursRemaining)}h`;
  };

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
              <h2 className="text-xl font-semibold mb-4">
                Complétées ({completedOrders.length})
                <span className="ml-2 text-sm font-normal text-gray-600">
                  • Modification possible pendant 24h ⏰
                </span>
              </h2>
              <div className="card">
                <div className="space-y-2">
                  {completedOrders.map((order: Order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.clientNom}</p>
                        <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
                        <p className="text-xs text-gray-500 mt-1">{order.produitNom} (x{order.quantite})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(order.montant)}</p>
                          <span className={`badge ${getStatusColor(order.status)} mt-1`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        {canModifyOrder(order) ? (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setNote(order.noteLivreur || '');
                              }}
                              className="btn btn-secondary px-3 py-2 flex items-center gap-1"
                              title="Modifier la livraison"
                            >
                              <Edit2 size={16} />
                              Modifier
                            </button>
                            <span className="text-xs text-orange-600">
                              ⏰ {getTimeRemaining(order)} restant
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              🔒 Délai dépassé
                            </span>
                          </div>
                        )}
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
                          .filter((o: Order) => o.status === 'LIVREE')
                          .reduce((sum: number, o: Order) => sum + o.montant, 0)
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
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">
                {selectedOrder.status === 'ASSIGNEE' ? 'Traiter la livraison' : 'Modifier la livraison'}
              </h2>
              {selectedOrder.status !== 'ASSIGNEE' && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                  Correction
                </span>
              )}
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
                  <p className="text-gray-600">{selectedOrder.clientVille}</p>
                  {selectedOrder.clientAdresse && (
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.clientAdresse}</p>
                  )}
                </div>
                {selectedOrder.status !== 'ASSIGNEE' && (
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                )}
              </div>
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium block mt-2">
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
              {selectedOrder.status !== 'ASSIGNEE' && selectedOrder.noteLivreur && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Note actuelle :</p>
                  <p className="text-sm text-gray-700 italic">{selectedOrder.noteLivreur}</p>
                </div>
              )}
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
                ✓ Livraison effectuée ({selectedOrder.quantite} unité{selectedOrder.quantite > 1 ? 's' : ''})
              </button>

              {/* Livraison partielle : visible UNIQUEMENT si quantite > 1 */}
              {selectedOrder.quantite > 1 && (
                <>
                  {!showPartialInput ? (
                    <button
                      onClick={() => {
                        setShowPartialInput(true);
                        setPartialQty(Math.min(selectedOrder.quantite - 1, 1));
                      }}
                      className="btn w-full bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={updateStatusMutation.isPending}
                    >
                      ⚠ Livraison partielle (client prend moins)
                    </button>
                  ) : (
                    <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-3">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        Combien d'unités le client a-t-il pris ?
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPartialQty((q) => Math.max(1, q - 1))}
                          className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-100"
                        >
                          −
                        </button>
                        <div className="flex-1 text-center">
                          <div className="text-3xl font-black text-orange-900 tabular-nums">{partialQty}</div>
                          <div className="text-xs text-orange-700">
                            sur {selectedOrder.quantite} commandés · {selectedOrder.quantite - partialQty} retour magasin
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPartialQty((q) => Math.min(selectedOrder.quantite - 1, q + 1))}
                          className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-bold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-100"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus('LIVREE_PARTIELLE', partialQty)}
                          className="btn flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          ✓ Confirmer {partialQty} livré{partialQty > 1 ? 's' : ''}
                        </button>
                        <button
                          onClick={() => { setShowPartialInput(false); setPartialQty(1); }}
                          className="btn btn-secondary"
                          disabled={updateStatusMutation.isPending}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

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
                setShowPartialInput(false);
                setPartialQty(1);
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







