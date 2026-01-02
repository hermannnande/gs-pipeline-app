import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Phone, CheckCircle, XCircle, PhoneOff, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

export default function CallerSupervision() {
  const [selectedCaller, setSelectedCaller] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState('today');

  // Récupérer tous les appelants
  const { data: appelants } = useQuery({
    queryKey: ['appelants-list'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'APPELANT', actif: true } });
      return data;
    },
  });

  // Récupérer toutes les commandes
  const { data: ordersData } = useQuery({
    queryKey: ['orders-supervision', dateFilter],
    queryFn: async () => {
      let startDate: Date | undefined;
      const now = new Date();
      
      switch(dateFilter) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = undefined;
      }

      const { data } = await api.get('/orders', {
        params: {
          page: 1,
          limit: 1000,
          startDate: startDate?.toISOString()
        }
      });
      return data;
    },
    refetchInterval: 5000 // Actualisation toutes les 5 secondes
  });

  // Calculer les stats par appelant
  const appelantStats = appelants?.users?.map((appelant: any) => {
    const commandesAppelant = ordersData?.orders?.filter((o: any) => o.callerId === appelant.id) || [];
    
    const nbValidees = commandesAppelant.filter((o: any) => !!o.validatedAt).length;
    const nbAnnulees = commandesAppelant.filter((o: any) => o.status === 'ANNULEE').length;
    const nbInjoignables = commandesAppelant.filter((o: any) => o.status === 'INJOIGNABLE').length;

    return {
      ...appelant,
      stats: {
        total: commandesAppelant.length,
        // ✅ Compter les validées même si la commande a avancé (ASSIGNEE/LIVREE/etc.)
        validees: nbValidees,
        annulees: nbAnnulees,
        injoignables: nbInjoignables,
        // "En cours" = en livraison (éviter d'inclure LIVREE)
        enCours: commandesAppelant.filter((o: any) => ['ASSIGNEE'].includes(o.status)).length,
        montantTotal: commandesAppelant
          .filter((o: any) => !!o.validatedAt)
          .reduce((sum: number, o: any) => sum + o.montant, 0),
        tauxValidation: commandesAppelant.length > 0 
          ? Math.round((nbValidees / commandesAppelant.length) * 100) 
          : 0
      },
      commandes: commandesAppelant
    };
  }) || [];

  // Stats globales
  const statsGlobales = {
    totalAppelants: appelantStats.length,
    totalCommandes: ordersData?.orders?.filter((o: any) => o.callerId)?.length || 0,
    totalValidees: ordersData?.orders?.filter((o: any) => !!o.validatedAt && o.callerId)?.length || 0,
    totalAnnulees: ordersData?.orders?.filter((o: any) => o.status === 'ANNULEE' && o.callerId)?.length || 0,
    totalInjoignables: ordersData?.orders?.filter((o: any) => o.status === 'INJOIGNABLE' && o.callerId)?.length || 0,
    montantTotal: ordersData?.orders
      ?.filter((o: any) => !!o.validatedAt && o.callerId)
      .reduce((sum: number, o: any) => sum + o.montant, 0) || 0
  };

  // Commandes en attente (non traitées)
  const commandesEnAttente = ordersData?.orders?.filter((o: any) => 
    ['NOUVELLE', 'A_APPELER'].includes(o.status)
  )?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supervision des Appelants</h1>
          <p className="text-gray-600 mt-1">Suivi en temps réel du travail des appelants</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="all">Tout</option>
          </select>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-indigo-600" />
            <p className="text-xs text-indigo-600 font-medium">Appelants actifs</p>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{statsGlobales.totalAppelants}</p>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Phone size={20} className="text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">Total traité</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{statsGlobales.totalCommandes}</p>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-xs text-green-600 font-medium">Validées</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{statsGlobales.totalValidees}</p>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={20} className="text-red-600" />
            <p className="text-xs text-red-600 font-medium">Annulées</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{statsGlobales.totalAnnulees}</p>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <PhoneOff size={20} className="text-orange-600" />
            <p className="text-xs text-orange-600 font-medium">Injoignables</p>
          </div>
          <p className="text-3xl font-bold text-orange-700">{statsGlobales.totalInjoignables}</p>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-600 font-medium mb-2">Montant total</p>
          <p className="text-xl font-bold text-purple-700">{formatCurrency(statsGlobales.montantTotal)}</p>
        </div>
      </div>

      {/* Alerte commandes en attente */}
      {commandesEnAttente > 0 && (
        <div className="card bg-yellow-50 border-yellow-300">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 text-white p-3 rounded-lg">
              <Phone size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Commandes en attente</h3>
              <p className="text-sm text-yellow-700">
                Il y a actuellement <strong>{commandesEnAttente} commande(s)</strong> en attente d'appel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des appelants */}
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Performance des Appelants</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appelant</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Total traité</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">✅ Validées</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">❌ Annulées</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">📵 Injoignables</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Taux validation</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appelantStats
                .sort((a, b) => b.stats.total - a.stats.total)
                .map((appelant: any) => (
                <tr key={appelant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {appelant.prenom[0]}{appelant.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appelant.prenom} {appelant.nom}</p>
                        <p className="text-xs text-gray-500">{appelant.telephone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-bold text-blue-600">{appelant.stats.total}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-bold text-green-600">{appelant.stats.validees}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-bold text-red-600">{appelant.stats.annulees}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-lg font-bold text-orange-600">{appelant.stats.injoignables}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-lg font-bold ${
                        appelant.stats.tauxValidation >= 70 ? 'text-green-600' :
                        appelant.stats.tauxValidation >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {appelant.stats.tauxValidation}%
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            appelant.stats.tauxValidation >= 70 ? 'bg-green-500' :
                            appelant.stats.tauxValidation >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${appelant.stats.tauxValidation}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(appelant.stats.montantTotal)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedCaller(appelant)}
                      className="btn btn-sm btn-secondary flex items-center gap-1 mx-auto"
                    >
                      <Eye size={16} />
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails appelant */}
      {selectedCaller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCaller.prenom} {selectedCaller.nom}
                </h2>
                <p className="text-gray-600">{selectedCaller.telephone}</p>
              </div>
              <button
                onClick={() => setSelectedCaller(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Stats détaillées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card bg-blue-50">
                <p className="text-xs text-blue-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-700">{selectedCaller.stats.total}</p>
              </div>
              <div className="card bg-green-50">
                <p className="text-xs text-green-600 mb-1">Validées</p>
                <p className="text-2xl font-bold text-green-700">{selectedCaller.stats.validees}</p>
              </div>
              <div className="card bg-red-50">
                <p className="text-xs text-red-600 mb-1">Annulées</p>
                <p className="text-2xl font-bold text-red-700">{selectedCaller.stats.annulees}</p>
              </div>
              <div className="card bg-orange-50">
                <p className="text-xs text-orange-600 mb-1">Injoignables</p>
                <p className="text-2xl font-bold text-orange-700">{selectedCaller.stats.injoignables}</p>
              </div>
            </div>

            {/* Liste des commandes */}
            <div>
              <h3 className="font-semibold mb-4">Commandes traitées ({selectedCaller.commandes.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedCaller.commandes
                  .sort((a: any, b: any) => new Date(b.calledAt || b.createdAt).getTime() - new Date(a.calledAt || a.createdAt).getTime())
                  .map((order: any) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{order.clientNom}</h4>
                          <span className={`badge text-xs ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">📞 {order.clientTelephone}</p>
                        <p className="text-sm text-gray-600">📍 {order.clientVille}</p>
                        <p className="text-sm text-gray-600">📦 {order.produitNom}</p>
                        {order.noteAppelant && (
                          <p className="text-xs text-gray-500 mt-2 italic">Note: {order.noteAppelant}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-600">{formatCurrency(order.montant)}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(order.calledAt || order.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedCaller(null)}
              className="btn btn-secondary w-full mt-6"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}










