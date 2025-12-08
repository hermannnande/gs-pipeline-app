import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, PhoneOff, Search, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import { useAuthStore } from '@/store/authStore';

export default function MyProcessedOrders() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-processed-orders', user?.id, searchTerm, filterStatus, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/orders', {
        params: {
          page: 1,
          limit: 500,
          callerId: user?.id,
          search: searchTerm || undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      return data;
    },
    refetchInterval: 5000 // Actualisation toutes les 5 secondes
  });

  // Filtrer uniquement les commandes TRAITÉES par moi
  const mesCommandesTraitees = ordersData?.orders?.filter((order: any) => 
    ['VALIDEE', 'ANNULEE', 'INJOIGNABLE', 'ASSIGNEE', 'LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status)
  ) || [];

  // Statistiques
  const stats = {
    total: mesCommandesTraitees.length,
    validees: mesCommandesTraitees.filter((o: any) => o.status === 'VALIDEE').length,
    annulees: mesCommandesTraitees.filter((o: any) => o.status === 'ANNULEE').length,
    injoignables: mesCommandesTraitees.filter((o: any) => o.status === 'INJOIGNABLE').length,
    enCours: mesCommandesTraitees.filter((o: any) => ['ASSIGNEE', 'LIVREE'].includes(o.status)).length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Commandes Traitées</h1>
        <p className="text-gray-600 mt-1">Historique de toutes les commandes que vous avez traitées</p>
      </div>

      {/* Statistiques personnelles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">Total traité</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-xs text-green-600 font-medium">Validées</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.validees}</p>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={20} className="text-red-600" />
            <p className="text-xs text-red-600 font-medium">Annulées</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{stats.annulees}</p>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <PhoneOff size={20} className="text-orange-600" />
            <p className="text-xs text-orange-600 font-medium">Injoignables</p>
          </div>
          <p className="text-3xl font-bold text-orange-700">{stats.injoignables}</p>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-600 font-medium mb-2">En cours</p>
          <p className="text-3xl font-bold text-purple-700">{stats.enCours}</p>
          <p className="text-xs text-gray-600 mt-1">Assignées/Livrées</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <h3 className="font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Nom ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="ALL">Tous</option>
              <option value="VALIDEE">Validée</option>
              <option value="ANNULEE">Annulée</option>
              <option value="INJOIGNABLE">Injoignable</option>
              <option value="ASSIGNEE">Assignée</option>
              <option value="LIVREE">Livrée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {(searchTerm || filterStatus !== 'ALL' || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-secondary mt-4"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des commandes traitées */}
      <div className="card">
        <h3 className="font-semibold mb-4">
          {mesCommandesTraitees.length} commande(s) traitée(s)
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : mesCommandesTraitees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune commande traitée trouvée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mesCommandesTraitees.map((order: any) => (
              <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">{order.clientNom}</h4>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">📞 {order.clientTelephone}</p>
                    <p className="text-sm text-gray-600">📍 {order.clientVille} - {order.clientCommune}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(order.montant)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.calledAt || order.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Produit</p>
                    <p className="text-sm font-medium text-gray-900">{order.produitNom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantité</p>
                    <p className="text-sm font-medium text-gray-900">{order.quantite}</p>
                  </div>
                </div>

                {order.noteAppelant && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium mb-1">Ma note</p>
                    <p className="text-sm text-gray-700">{order.noteAppelant}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}










