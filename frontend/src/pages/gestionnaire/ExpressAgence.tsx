import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Bell, 
  Clock, 
  MapPin,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { expressApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';

export default function ExpressAgence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [nonRetiresOnly, setNonRetiresOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [noteNotification, setNoteNotification] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['express-en-agence', searchTerm, agenceFilter, statutFilter, nonRetiresOnly],
    queryFn: () => expressApi.getEnAgence({
      search: searchTerm,
      agence: agenceFilter,
      statut: statutFilter,
      nonRetires: nonRetiresOnly ? 'true' : 'false'
    }),
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });

  const notifierMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => 
      expressApi.notifierClient(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      setSelectedOrder(null);
      setNoteNotification('');
      toast.success('✅ Client notifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la notification');
    },
  });

  const confirmerRetraitMutation = useMutation({
    mutationFn: (id: number) => expressApi.confirmerRetrait(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      toast.success('✅ Retrait confirmé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handleNotifier = (order: any) => {
    setSelectedOrder(order);
    setNoteNotification('');
  };

  const confirmNotification = () => {
    if (!selectedOrder) return;
    notifierMutation.mutate({
      id: selectedOrder.id,
      note: noteNotification.trim() || undefined
    });
  };

  const handleConfirmerRetrait = (orderId: number) => {
    if (window.confirm('Confirmer que le client a retiré son colis ?')) {
      confirmerRetraitMutation.mutate(orderId);
    }
  };

  const orders = data?.orders || [];
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📦 EXPRESS - En agence</h1>
        <p className="text-gray-600">Gestion des colis en attente de retrait</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total en agence</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non retirés</p>
              <p className="text-2xl font-bold text-orange-600">{stats.nonRetires || 0}</p>
            </div>
            <AlertCircle className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Retirés</p>
              <p className="text-2xl font-bold text-green-600">{stats.retires || 0}</p>
            </div>
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Notifications totales</p>
              <p className="text-2xl font-bold text-purple-600">{stats.nombreNotificationsTotal || 0}</p>
            </div>
            <Bell className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher (nom, tél, réf)..."
              className="input pl-10"
            />
          </div>

          {/* Agence */}
          <select
            value={agenceFilter}
            onChange={(e) => setAgenceFilter(e.target.value)}
            className="input"
          >
            <option value="all">Toutes les agences</option>
            {stats.agences?.map((agence: string) => (
              <option key={agence} value={agence}>{agence}</option>
            ))}
          </select>

          {/* Statut */}
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tous les statuts</option>
            <option value="EXPRESS_ARRIVE">En attente de retrait</option>
            <option value="EXPRESS_LIVRE">Retiré</option>
          </select>

          {/* Non retirés */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={nonRetiresOnly}
              onChange={(e) => setNonRetiresOnly(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Non retirés uniquement</span>
          </label>
        </div>
      </div>

      {/* Liste des commandes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">Aucun colis en agence</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className={`card hover:shadow-lg transition-shadow ${
              order.nombreNotifications > 5 ? 'border-l-4 border-red-500' :
              order.nombreNotifications > 2 ? 'border-l-4 border-orange-500' :
              order.nombreNotifications > 0 ? 'border-l-4 border-yellow-500' :
              'border-l-4 border-gray-300'
            }`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Informations client - 4 colonnes */}
                <div className="lg:col-span-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                      <p className="text-sm text-gray-600">{order.clientTelephone}</p>
                      <p className="text-xs text-gray-500 mt-1">Réf: {order.orderReference}</p>
                    </div>
                    {order.status === 'EXPRESS_ARRIVE' ? (
                      <span className="badge bg-orange-100 text-orange-700">En attente</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">Retiré</span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-gray-700">{order.product?.nom || order.produitNom}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{order.agenceRetrait}</span>
                    </div>
                  </div>
                </div>

                {/* Stats de suivi - 3 colonnes */}
                <div className="lg:col-span-3 border-l pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suivi</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-sm">
                        <strong>{order.joursEnAgence}</strong> jour(s) en agence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell size={16} className={
                        order.nombreNotifications > 5 ? 'text-red-500' :
                        order.nombreNotifications > 2 ? 'text-orange-500' :
                        order.nombreNotifications > 0 ? 'text-yellow-500' :
                        'text-gray-400'
                      } />
                      <span className="text-sm">
                        <strong>{order.nombreNotifications}</strong> notification(s)
                      </span>
                    </div>
                    {order.derniereNotification && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-purple-500" />
                        <span className="text-xs text-gray-600">
                          Par {order.derniereNotification.user.prenom} {order.derniereNotification.user.nom}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dernière note - 3 colonnes */}
                <div className="lg:col-span-3 border-l pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Dernière note</p>
                  {order.derniereNotification?.note ? (
                    <div className="bg-gray-50 p-2 rounded text-sm italic">
                      "{order.derniereNotification.note}"
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(order.derniereNotification.notifiedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune note</p>
                  )}
                </div>

                {/* Actions - 2 colonnes */}
                <div className="lg:col-span-2 flex flex-col gap-2 justify-center">
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-500">À payer</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.montant * 0.90)}
                    </p>
                  </div>
                  
                  {order.status === 'EXPRESS_ARRIVE' ? (
                    <>
                      <button
                        onClick={() => handleNotifier(order)}
                        className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                      >
                        <Bell size={16} />
                        Notifier
                      </button>
                      <button
                        onClick={() => handleConfirmerRetrait(order.id)}
                        disabled={confirmerRetraitMutation.isPending}
                        className="btn btn-success btn-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Client a retiré
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-medium">Retiré</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique complet des notifications (collapsible) */}
              {order.expressNotifications.length > 1 && (
                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                    Voir l'historique complet ({order.expressNotifications.length} notifications)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {order.expressNotifications.map((notif: any, index: number) => (
                      <div key={notif.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <Calendar size={16} className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{formatDateTime(notif.notifiedAt)}</p>
                          <p className="text-sm font-medium">
                            {notif.user.prenom} {notif.user.nom}
                          </p>
                          {notif.note && (
                            <p className="text-sm text-gray-700 italic mt-1">"{notif.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de notification */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="text-primary-600" />
              Notifier le client
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              <p className="text-sm text-gray-600">{selectedOrder.clientTelephone}</p>
              <p className="text-sm text-gray-600 mt-2">
                Agence: <strong>{selectedOrder.agenceRetrait}</strong>
              </p>
              <p className="text-sm text-gray-600">
                À payer: <strong className="text-green-600">{formatCurrency(selectedOrder.montant * 0.90)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-1" />
                Note (optionnelle)
              </label>
              <textarea
                value={noteNotification}
                onChange={(e) => setNoteNotification(e.target.value)}
                placeholder="Ex: Client occupé, rappeler demain..."
                className="input"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette note sera enregistrée dans l'historique
              </p>
            </div>

            {selectedOrder.nombreNotifications > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Ce client a déjà été notifié <strong>{selectedOrder.nombreNotifications} fois</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmNotification}
                disabled={notifierMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {notifierMutation.isPending ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

