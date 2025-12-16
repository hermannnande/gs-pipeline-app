import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Search, RefreshCw, Truck, Zap, Clock, Calendar, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi, rdvApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';
import ExpeditionModal from '@/components/modals/ExpeditionModal';
import ExpressModal from '@/components/modals/ExpressModal';
import { useAuthStore } from '@/store/authStore';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvDate, setRdvDate] = useState('');
  const [rdvNote, setRdvNote] = useState('');
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  const [newQuantite, setNewQuantite] = useState(1);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Vérifier si l'utilisateur peut modifier la quantité (Admin ou Gestionnaire)
  const canEditQuantite = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';

  const { data: ordersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['appelant-orders'],
    queryFn: () => ordersApi.getAll({ limit: 1000 }), // Limite augmentée pour voir TOUTES les commandes à traiter
    refetchInterval: 30000, // Actualisation automatique toutes les 30 secondes
    refetchIntervalInBackground: true, // Continue même si l'onglet n'est pas actif
  });

  // Compteur pour afficher le temps écoulé depuis la dernière actualisation
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);

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

  const attentePaiementMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      ordersApi.marquerAttentePaiement(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      setSelectedOrder(null);
      setNote('');
      toast.success('✅ Commande marquée en attente de paiement');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise en attente');
    },
  });

  const programmerRdvMutation = useMutation({
    mutationFn: ({ id, rdvDate, rdvNote }: { id: number; rdvDate: string; rdvNote?: string }) =>
      rdvApi.programmer(id, rdvDate, rdvNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      setShowRdvModal(false);
      setRdvDate('');
      setRdvNote('');
      toast.success('✅ RDV programmé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la programmation du RDV');
    },
  });

  const updateQuantiteMutation = useMutation({
    mutationFn: ({ orderId, quantite }: { orderId: number; quantite: number }) => 
      ordersApi.updateQuantite(orderId, quantite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      setShowQuantiteModal(false);
      setSelectedOrder(null);
      toast.success('✅ Quantité modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
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

  const handleAttentePaiement = () => {
    if (!selectedOrder) return;
    attentePaiementMutation.mutate({
      id: selectedOrder.id,
      note: note || undefined,
    });
  };

  const notifierClientMutation = useMutation({
    mutationFn: (id: number) => ordersApi.marquerAppel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      toast.success('🔔 Client notifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la notification');
    },
  });

  const handleNotifierClient = (orderId: number) => {
    notifierClientMutation.mutate(orderId);
  };

  const handleProgrammerRdv = (order: Order) => {
    setSelectedOrder(order);
    // Définir la date/heure par défaut à demain à 9h
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setRdvDate(tomorrow.toISOString().slice(0, 16));
    setRdvNote('');
    setShowRdvModal(true);
  };

  const confirmRdv = () => {
    if (!selectedOrder || !rdvDate) {
      toast.error('Veuillez sélectionner une date et heure pour le RDV');
      return;
    }
    programmerRdvMutation.mutate({
      id: selectedOrder.id,
      rdvDate,
      rdvNote: rdvNote || undefined,
    });
  };

  const handleEditQuantite = (order: Order) => {
    setSelectedOrder(order);
    setNewQuantite(order.quantite);
    setShowQuantiteModal(true);
  };

  const handleUpdateQuantite = () => {
    if (!selectedOrder) return;
    if (newQuantite < 1) {
      toast.error('La quantité doit être au minimum 1');
      return;
    }
    updateQuantiteMutation.mutate({
      orderId: selectedOrder.id,
      quantite: newQuantite,
    });
  };

  const filteredOrders = ordersData?.orders
    ?.filter((order: Order) => {
      // IMPORTANT : Afficher UNIQUEMENT les commandes NOUVELLE et A_APPELER
      // SAUF celles avec RDV programmé (qui apparaissent dans la page RDV)
      // Une fois validée, annulée ou marquée injoignable, la commande disparaît de cette liste
      const isToCall = [
        'NOUVELLE',      // Nouvelle commande reçue
        'A_APPELER'      // Marquée pour appel
      ].includes(order.status);
      
      // Exclure les commandes avec RDV programmé
      const hasRdv = (order as any).rdvProgramme;
      
      if (!isToCall || hasRdv) return false; // Masquer toutes les autres commandes et les RDV
      
      const matchesSearch = order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientTelephone.includes(searchTerm);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Trier par date de création : Les plus RÉCENTES en PREMIER
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Détecter les nouvelles commandes
  useEffect(() => {
    if (filteredOrders && previousCount > 0 && filteredOrders.length > previousCount) {
      toast.success(`🔔 ${filteredOrders.length - previousCount} nouvelle(s) commande(s) !`, {
        duration: 5000,
      });
    }
    if (filteredOrders) {
      setPreviousCount(filteredOrders.length);
    }
  }, [filteredOrders?.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes à appeler</h1>
          <p className="text-gray-600 mt-1">Liste des commandes en attente de traitement</p>
        </div>
        <div className="flex items-center gap-4">
          {filteredOrders && (
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600">commande(s)</p>
            </div>
          )}
          <div className="flex flex-col items-end gap-2">
            {isFetching ? (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Actualisation...
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                Mis à jour il y a {secondsSinceUpdate}s
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn btn-secondary flex items-center gap-2 text-sm py-2"
              title="Actualiser les commandes"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>
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
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                  <p className="text-sm text-gray-600">{order.clientVille}</p>
                </div>
                <div className="flex gap-2 items-start">
                  {canEditQuantite && (
                    <button
                      onClick={() => handleEditQuantite(order)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Modifier la quantité"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.enAttentePaiement && (
                      <span className="badge bg-purple-100 text-purple-700 border border-purple-300 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        Attente paiement
                      </span>
                    )}
                    {/* Badge nombre de notifications et appelant */}
                    {order.nombreAppels && order.nombreAppels > 0 && (
                      <span className="badge bg-orange-100 text-orange-700 border border-orange-300 text-xs flex items-center gap-1">
                        🔔 {order.nombreAppels} notification{order.nombreAppels > 1 ? 's' : ''}
                        {order.caller && ` · ${order.caller.prenom}`}
                      </span>
                    )}
                  </div>
                </div>
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

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleNotifierClient(order.id)}
                  className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={notifierClientMutation.isPending}
                  title="Notifier le client"
                >
                  🔔 Notifier
                </button>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="btn btn-primary flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Traiter
                </button>
                <button
                  onClick={() => handleProgrammerRdv(order)}
                  className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  RDV
                </button>
              </div>

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
                ✓ Commande validée (Livraison locale)
              </button>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-xs text-gray-600 mb-2 font-medium">Pour les villes éloignées :</p>
                
              <button
                onClick={() => {
                  setShowExpeditionModal(true);
                  setSelectedOrder(selectedOrder);
                }}
                className="btn bg-blue-600 text-white hover:bg-blue-700 w-full flex items-center justify-center gap-2"
                disabled={updateStatusMutation.isPending}
              >
                <Truck size={18} />
                📦 EXPÉDITION (Paiement 100%)
              </button>
              
              <button
                onClick={handleAttentePaiement}
                className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 w-full flex items-center justify-center gap-2 mt-2 border border-purple-300"
                disabled={attentePaiementMutation.isPending}
              >
                <Clock size={18} />
                ⏳ En attente de paiement (EXPÉDITION)
              </button>
              
              <button
                onClick={() => {
                  setShowExpressModal(true);
                  setSelectedOrder(selectedOrder);
                }}
                className="btn bg-amber-600 text-white hover:bg-amber-700 w-full flex items-center justify-center gap-2 mt-2"
                disabled={updateStatusMutation.isPending}
              >
                <Zap size={18} />
                ⚡ EXPRESS (Paiement 10%)
              </button>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => handleUpdateStatus('INJOIGNABLE')}
                  className="btn btn-secondary w-full"
                  disabled={updateStatusMutation.isPending}
                >
                  📵 Client injoignable
                </button>
                <button
                  onClick={() => handleUpdateStatus('ANNULEE')}
                  className="btn btn-danger w-full mt-2"
                  disabled={updateStatusMutation.isPending}
                >
                  ✕ Commande annulée
                </button>
              </div>
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

      {/* Modals EXPÉDITION & EXPRESS */}
      {showExpeditionModal && selectedOrder && (
        <ExpeditionModal
          order={selectedOrder}
          onClose={() => {
            setShowExpeditionModal(false);
            setSelectedOrder(null);
            setNote('');
          }}
        />
      )}

      {showExpressModal && selectedOrder && (
        <ExpressModal
          order={selectedOrder}
          onClose={() => {
            setShowExpressModal(false);
            setSelectedOrder(null);
            setNote('');
          }}
        />
      )}

      {/* Modal RDV */}
      {showRdvModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              Programmer un RDV
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Client: <span className="font-medium">{selectedOrder.clientNom}</span>
              </p>
              <p className="text-gray-600 text-sm mb-4">
                📞 {selectedOrder.clientTelephone} • 📍 {selectedOrder.clientVille}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure du RDV *
                </label>
                <input
                  type="datetime-local"
                  value={rdvDate}
                  onChange={(e) => setRdvDate(e.target.value)}
                  className="input w-full"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note / Raison du RDV
                </label>
                <textarea
                  value={rdvNote}
                  onChange={(e) => setRdvNote(e.target.value)}
                  placeholder="Ex: Client occupé, en voyage, demande rappel à une heure précise..."
                  className="input w-full"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cette commande sera retirée de "À appeler" et visible dans "RDV Programmés"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmRdv}
                disabled={!rdvDate || programmerRdvMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {programmerRdvMutation.isPending ? 'Programmation...' : '✓ Programmer RDV'}
              </button>
              <button
                onClick={() => {
                  setShowRdvModal(false);
                  setRdvDate('');
                  setRdvNote('');
                }}
                className="btn btn-secondary flex-1"
                disabled={programmerRdvMutation.isPending}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de quantité */}
      {showQuantiteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📦 Modifier la quantité</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Commande</p>
              <p className="font-semibold">{selectedOrder.orderReference}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Client</p>
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Produit</p>
              <p className="font-semibold">{selectedOrder.produitNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Quantité actuelle</p>
              <p className="font-semibold text-primary-600">{selectedOrder.quantite}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Montant actuel</p>
              <p className="font-semibold">{formatCurrency(selectedOrder.montant)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvelle quantité <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={newQuantite}
                onChange={(e) => setNewQuantite(parseInt(e.target.value) || 1)}
                className="input"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix unitaire: {formatCurrency(selectedOrder.montant / selectedOrder.quantite)}
              </p>
              {newQuantite !== selectedOrder.quantite && (
                <p className="text-sm text-primary-600 mt-2 font-semibold">
                  → Nouveau montant: {formatCurrency((selectedOrder.montant / selectedOrder.quantite) * newQuantite)}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateQuantite}
                disabled={newQuantite === selectedOrder.quantite || updateQuantiteMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateQuantiteMutation.isPending ? 'Modification...' : '✓ Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuantiteModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

