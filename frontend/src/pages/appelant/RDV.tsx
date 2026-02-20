import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Edit2,
  X,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rdvApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

export default function RDV() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRappele, setFilterRappele] = useState<string>('non'); // 'tous', 'non', 'oui'
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showRappelerModal, setShowRappelerModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [noteRappel, setNoteRappel] = useState('');
  const [modifRdvDate, setModifRdvDate] = useState('');
  const [modifRdvNote, setModifRdvNote] = useState('');

  const { data: rdvData, isLoading } = useQuery({
    queryKey: ['rdv', filterRappele, searchTerm],
    queryFn: () => rdvApi.getAll({
      rappele: filterRappele === 'tous' ? undefined : filterRappele === 'oui',
      search: searchTerm || undefined
    }),
    refetchInterval: 60000,
  });

  const rappelerMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note?: string }) => 
      rdvApi.rappeler(orderId, note),
    onSuccess: () => {
      toast.success('✅ RDV marqué comme traité');
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowRappelerModal(false);
      setSelectedOrder(null);
      setNoteRappel('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du traitement');
    },
  });

  const modifierMutation = useMutation({
    mutationFn: ({ orderId, rdvDate, rdvNote }: { orderId: number; rdvDate?: string; rdvNote?: string }) => 
      rdvApi.modifier(orderId, rdvDate, rdvNote),
    onSuccess: () => {
      toast.success('✅ RDV modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      setShowModifierModal(false);
      setSelectedOrder(null);
      setModifRdvDate('');
      setModifRdvNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const annulerMutation = useMutation({
    mutationFn: (orderId: number) => rdvApi.annuler(orderId),
    onSuccess: () => {
      toast.success('✅ RDV annulé');
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });

  const handleRappeler = (order: any) => {
    setSelectedOrder(order);
    setNoteRappel('');
    setShowRappelerModal(true);
  };

  const confirmRappeler = () => {
    if (selectedOrder) {
      rappelerMutation.mutate({
        orderId: selectedOrder.id,
        note: noteRappel.trim() || undefined
      });
    }
  };

  const handleModifier = (order: any) => {
    setSelectedOrder(order);
    setModifRdvDate(order.rdvDate ? new Date(order.rdvDate).toISOString().slice(0, 16) : '');
    setModifRdvNote(order.rdvNote || '');
    setShowModifierModal(true);
  };

  const confirmModifier = () => {
    if (selectedOrder) {
      modifierMutation.mutate({
        orderId: selectedOrder.id,
        rdvDate: modifRdvDate || undefined,
        rdvNote: modifRdvNote || undefined
      });
    }
  };

  const handleAnnuler = (order: any) => {
    if (window.confirm(`Voulez-vous vraiment annuler le RDV pour ${order.clientNom} ?`)) {
      annulerMutation.mutate(order.id);
    }
  };

  const getUrgenceClass = (rdvDate: string, rappele: boolean) => {
    if (rappele) return 'border-green-300 bg-green-50';
    
    const now = new Date();
    const rdv = new Date(rdvDate);
    const diffHours = (rdv.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return 'border-red-300 bg-red-50'; // En retard
    if (diffHours < 24) return 'border-orange-300 bg-orange-50'; // Aujourd'hui
    return 'border-blue-300 bg-blue-50'; // Futur
  };

  const getUrgenceBadge = (rdvDate: string, rappele: boolean) => {
    if (rappele) return <span className="badge bg-green-100 text-green-800">✓ Rappelé</span>;
    
    const now = new Date();
    const rdv = new Date(rdvDate);
    const diffHours = (rdv.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return <span className="badge bg-red-100 text-red-800 flex items-center gap-1"><AlertCircle size={14} /> En retard</span>;
    if (diffHours < 24) return <span className="badge bg-orange-100 text-orange-800 flex items-center gap-1"><Clock size={14} /> Aujourd'hui</span>;
    return <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1"><Calendar size={14} /> À venir</span>;
  };

  const stats = rdvData?.stats || {};
  const orders = rdvData?.orders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Rendez-vous (RDV)</h1>
          <p className="text-gray-600 mt-1">Gestion des rappels clients programmés</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total RDV</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total || 0}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="card bg-orange-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Aujourd'hui</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{stats.aujourdhui || 0}</p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </div>

        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">En retard</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.enRetard || 0}</p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="card bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">À rappeler</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.aRappeler || 0}</p>
            </div>
            <Phone className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Rappelés</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.rappeles || 0}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterRappele}
              onChange={(e) => setFilterRappele(e.target.value)}
              className="input"
            >
              <option value="tous">Tous les RDV</option>
              <option value="non">À rappeler</option>
              <option value="oui">Déjà rappelés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des RDV */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucun RDV programmé</p>
          <p className="text-gray-500 text-sm mt-2">Les RDV programmés apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order: any) => (
            <div key={order.id} className={`card border-2 ${getUrgenceClass(order.rdvDate, order.rdvRappele)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getUrgenceBadge(order.rdvDate, order.rdvRappele)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{order.clientNom}</h3>
                  <p className="text-sm text-gray-600">📞 {order.clientTelephone}</p>
                  <p className="text-sm text-gray-600">📍 {order.clientVille}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Réf: {order.orderReference}</p>
                  <p className="font-bold text-gray-900">{formatCurrency(order.montant)}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(order.rdvDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(order.rdvDate).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {order.rdvNote && (
                <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Note:</span> {order.rdvNote}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Produit:</span> {order.product?.nom || order.produitNom} (x{order.quantite})
                </p>
              </div>

              {!order.rdvRappele && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRappeler(order)}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={rappelerMutation.isPending}
                  >
                    <Phone size={18} />
                    Rappeler
                  </button>
                  <button
                    onClick={() => handleModifier(order)}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                    disabled={modifierMutation.isPending}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleAnnuler(order)}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    disabled={annulerMutation.isPending}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {order.rdvRappele && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Client rappelé - Commande retournée dans "À appeler"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Rappeler */}
      {showRappelerModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">📞 Marquer comme rappelé</h3>
            <p className="text-gray-700 mb-4">
              Client: <span className="font-medium">{selectedOrder.clientNom}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              La commande sera retournée dans "À appeler" pour traitement normal.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note de rappel (optionnel)
              </label>
              <textarea
                value={noteRappel}
                onChange={(e) => setNoteRappel(e.target.value)}
                placeholder="Ex: Client disponible maintenant, souhaite commander..."
                className="input w-full"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmRappeler}
                disabled={rappelerMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {rappelerMutation.isPending ? 'Traitement...' : 'Confirmer'}
              </button>
              <button
                onClick={() => {
                  setShowRappelerModal(false);
                  setSelectedOrder(null);
                  setNoteRappel('');
                }}
                className="btn btn-secondary flex-1"
                disabled={rappelerMutation.isPending}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier */}
      {showModifierModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">✏️ Modifier le RDV</h3>
            <p className="text-gray-700 mb-4">
              Client: <span className="font-medium">{selectedOrder.clientNom}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure du RDV *
                </label>
                <input
                  type="datetime-local"
                  value={modifRdvDate}
                  onChange={(e) => setModifRdvDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={modifRdvNote}
                  onChange={(e) => setModifRdvNote(e.target.value)}
                  placeholder="Ex: Client occupé, en voyage, demande rappel..."
                  className="input w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmModifier}
                disabled={!modifRdvDate || modifierMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {modifierMutation.isPending ? 'Modification...' : 'Modifier'}
              </button>
              <button
                onClick={() => {
                  setShowModifierModal(false);
                  setSelectedOrder(null);
                  setModifRdvDate('');
                  setModifRdvNote('');
                }}
                className="btn btn-secondary flex-1"
                disabled={modifierMutation.isPending}
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

