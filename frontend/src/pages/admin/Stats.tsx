import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, Calendar, TrendingUp, Users, DollarSign, ArrowUpDown, Truck, Eye, X } from 'lucide-react';
import { statsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Stats() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchCaller, setSearchCaller] = useState('');
  const [searchDeliverer, setSearchDeliverer] = useState('');
  const [sortCallerBy, setSortCallerBy] = useState<'nom' | 'appels' | 'taux'>('taux');
  const [sortDelivererBy, setSortDelivererBy] = useState<'nom' | 'livraisons' | 'montant' | 'taux'>('taux');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Détail Expéditions payées
  const [searchPrepaidExpeditions, setSearchPrepaidExpeditions] = useState('');
  const [onlyExpedied, setOnlyExpedied] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { data: callersData, isLoading: loadingCallers } = useQuery({
    queryKey: ['callers-stats', startDate, endDate],
    queryFn: () => statsApi.getCallers({ startDate, endDate }),
  });

  const { data: deliverersData, isLoading: loadingDeliverers } = useQuery({
    queryKey: ['deliverers-stats', startDate, endDate],
    queryFn: () => statsApi.getDeliverers({ startDate, endDate }),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['overview-stats', startDate, endDate],
    queryFn: () => statsApi.getOverview({ startDate, endDate }),
  });

  const { data: prepaidExpeditionsData, isLoading: loadingPrepaidExpeditions } = useQuery({
    queryKey: ['prepaid-expeditions', startDate, endDate, searchPrepaidExpeditions, onlyExpedied],
    queryFn: () => statsApi.getPrepaidExpeditions({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: searchPrepaidExpeditions || undefined,
      onlyExpedied
    }),
  });

  // Filtrer et trier les appelants
  const filteredCallers = useMemo(() => {
    let filtered = callersData?.stats || [];
    
    if (searchCaller) {
      filtered = filtered.filter((stat: any) =>
        `${stat.user.prenom} ${stat.user.nom}`.toLowerCase().includes(searchCaller.toLowerCase())
      );
    }

    return filtered.sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortCallerBy) {
        case 'nom':
          comparison = `${a.user.prenom} ${a.user.nom}`.localeCompare(`${b.user.prenom} ${b.user.nom}`);
          break;
        case 'appels':
          comparison = a.totalAppels - b.totalAppels;
          break;
        case 'taux':
          comparison = parseFloat(a.tauxValidation) - parseFloat(b.tauxValidation);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [callersData, searchCaller, sortCallerBy, sortDirection]);

  // Filtrer et trier les livreurs
  const filteredDeliverers = useMemo(() => {
    let filtered = deliverersData?.stats || [];
    
    if (searchDeliverer) {
      filtered = filtered.filter((stat: any) =>
        `${stat.user.prenom} ${stat.user.nom}`.toLowerCase().includes(searchDeliverer.toLowerCase())
      );
    }

    return filtered.sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortDelivererBy) {
        case 'nom':
          comparison = `${a.user.prenom} ${a.user.nom}`.localeCompare(`${b.user.prenom} ${b.user.nom}`);
          break;
        case 'livraisons':
          comparison = a.totalLivraisons - b.totalLivraisons;
          break;
        case 'montant':
          comparison = a.montantLivre - b.montantLivre;
          break;
        case 'taux':
          comparison = parseFloat(a.tauxReussite) - parseFloat(b.tauxReussite);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [deliverersData, searchDeliverer, sortDelivererBy, sortDirection]);

  // Calculer les totaux
  const totalCallers = filteredCallers.length;
  const totalAppels = filteredCallers.reduce((sum: number, s: any) => sum + s.totalAppels, 0);
  const totalValides = filteredCallers.reduce((sum: number, s: any) => sum + s.totalValides, 0);
  const totalExpeditions = filteredCallers.reduce((sum: number, s: any) => sum + (s.totalExpeditions || 0), 0);
  const totalExpress = filteredCallers.reduce((sum: number, s: any) => sum + (s.totalExpress || 0), 0);
  const avgTauxValidation = totalAppels > 0 ? ((totalValides / totalAppels) * 100).toFixed(2) : '0';

  const totalDeliverers = filteredDeliverers.length;
  const totalLivraisons = filteredDeliverers.reduce((sum: number, s: any) => sum + s.totalLivraisons, 0);
  const totalMontantLivre = filteredDeliverers.reduce((sum: number, s: any) => sum + s.montantLivre, 0);
  const avgTauxReussite = filteredDeliverers.reduce((sum: number, s: any) => sum + parseFloat(s.tauxReussite), 0) / (totalDeliverers || 1);

  const handleExport = () => {
    // Fonction d'export CSV
    const csvCallers = [
      ['Appelant', 'Total appels', 'Validées', 'Annulées', 'Injoignables', 'Expéditions', 'Express', 'Taux validation'],
      ...filteredCallers.map((s: any) => [
        `${s.user.prenom} ${s.user.nom}`,
        s.totalAppels,
        s.totalValides,
        s.totalAnnules,
        s.totalInjoignables,
        s.totalExpeditions || 0,
        s.totalExpress || 0,
        s.tauxValidation + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvCallers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques détaillées</h1>
          <p className="text-gray-600 mt-1">Performance des équipes</p>
        </div>
        <button onClick={handleExport} className="btn btn-primary flex items-center gap-2">
          <Download size={20} />
          Exporter
        </button>
      </div>

      {/* Filtres de période */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Filtrer par période
        </h3>
        
        {/* Raccourcis rapides */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="btn btn-secondary text-sm"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay() + 1);
              setStartDate(weekStart.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Cette semaine
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Ce mois
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
              setStartDate(lastMonth.toISOString().split('T')[0]);
              setEndDate(lastMonthEnd.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Mois dernier
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setStartDate(new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Cette année
          </button>
          <button
            onClick={() => {
              const last30 = new Date();
              last30.setDate(last30.getDate() - 30);
              setStartDate(last30.toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            30 derniers jours
          </button>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-secondary text-sm"
          >
            Tout afficher
          </button>
        </div>

        {/* Sélection personnalisée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Période active */}
        {(startDate || endDate) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <span className="font-medium text-blue-900">Période active: </span>
            <span className="text-blue-700">
              {startDate ? new Date(startDate).toLocaleDateString('fr-FR') : 'Début'} 
              {' → '}
              {endDate ? new Date(endDate).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
            </span>
          </div>
        )}
      </div>

      {/* Vue d'ensemble */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commandes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overviewData.overview.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de conversion</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{overviewData.overview.conversionRate}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commandes livrées</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{overviewData.overview.deliveredOrders}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Users size={24} className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(overviewData.overview.totalRevenue)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques Appelants */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Performance des Appelants</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{totalCallers} appelant(s)</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-green-600">
              Taux moyen: {avgTauxValidation}%
            </span>
          </div>
        </div>

        {/* Recherche et tri */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un appelant..."
              value={searchCaller}
              onChange={(e) => setSearchCaller(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortCallerBy}
            onChange={(e) => setSortCallerBy(e.target.value as any)}
            className="input md:w-48"
          >
            <option value="taux">Trier par taux</option>
            <option value="appels">Trier par appels</option>
            <option value="nom">Trier par nom</option>
          </select>
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowUpDown size={18} />
            {sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
          </button>
        </div>

        {loadingCallers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Indicateurs clés */}
            {filteredCallers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-1">🏆 Meilleur taux</p>
                  <p className="text-xl font-bold text-green-900">
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.user.nom}
                  </p>
                  <p className="text-sm text-green-600">
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.tauxValidation}% de validation
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">📞 Plus d'appels</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-blue-600">
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.totalAppels} appels
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium mb-1">✅ Plus validées</p>
                  <p className="text-xl font-bold text-purple-900">
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-purple-600">
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.totalValides} validées
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appelant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total appels</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Annulées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Injoignables</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 bg-blue-50">📦 Expéditions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 bg-amber-50">⚡ Express</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taux de validation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Aucun appelant trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredCallers.map((stat: any) => (
                      <tr key={stat.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">
                          {stat.user.prenom} {stat.user.nom}
                        </td>
                        <td className="py-3 px-4 text-sm">{stat.totalAppels}</td>
                        <td className="py-3 px-4 text-sm text-green-600 font-medium">{stat.totalValides}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{stat.totalAnnules}</td>
                        <td className="py-3 px-4 text-sm text-orange-600">{stat.totalInjoignables}</td>
                        <td className="py-3 px-4 text-sm font-medium text-blue-600 bg-blue-50">
                          {stat.totalExpeditions || 0}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-amber-600 bg-amber-50">
                          {stat.totalExpress || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  parseFloat(stat.tauxValidation) >= 70 ? 'bg-green-500' :
                                  parseFloat(stat.tauxValidation) >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${stat.tauxValidation}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              parseFloat(stat.tauxValidation) >= 70 ? 'text-green-600' :
                              parseFloat(stat.tauxValidation) >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stat.tauxValidation}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap justify-between gap-4 text-sm">
              <div className="font-medium text-gray-700">
                Totaux: {totalAppels} appels
              </div>
                <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="text-green-600 font-medium">{totalValides} validées</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-blue-600 font-medium">📦 {totalExpeditions} expéditions</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-amber-600 font-medium">⚡ {totalExpress} express</span>
                  <span className="text-gray-300">•</span>
                <span className="font-medium">Taux moyen: {avgTauxValidation}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Détail : commandes EXPÉDITION payées en avance */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Truck size={20} className="text-blue-600" />
            📦 Expéditions payées en avance (détails)
          </h2>
          <div className="text-sm text-gray-600">
            {prepaidExpeditionsData?.total ?? 0} commande(s)
          </div>
        </div>

        <div className="mb-4 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher (client, téléphone, ville, référence, paiement, code)..."
              value={searchPrepaidExpeditions}
              onChange={(e) => setSearchPrepaidExpeditions(e.target.value)}
              className="input pl-10"
            />
            {searchPrepaidExpeditions && (
              <button
                onClick={() => setSearchPrepaidExpeditions('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Effacer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={onlyExpedied}
              onChange={(e) => setOnlyExpedied(e.target.checked)}
            />
            Expédiées uniquement
          </label>
        </div>

        {loadingPrepaidExpeditions ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date validation</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appelant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Payé</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Paiement</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Expédié le</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {(prepaidExpeditionsData?.orders || []).length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-gray-500">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  (prepaidExpeditionsData?.orders || []).map((order: Order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.validatedAt ? formatDateTime(order.validatedAt) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {order.caller ? `${order.caller.prenom} ${order.caller.nom}` : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="font-medium">{order.clientNom}</div>
                        <div className="text-xs text-gray-500">{order.clientTelephone}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                      <td className="py-3 px-4 text-sm">
                        {order.produitNom} (x{order.quantite})
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                      <td className="py-3 px-4 text-sm font-bold text-green-600">
                        {formatCurrency(order.montantPaye || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>{order.modePaiement || '-'}</div>
                        {order.referencePayment && (
                          <div className="text-xs text-gray-500">{order.referencePayment}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.expedieAt ? formatDateTime(order.expedieAt) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-secondary btn-sm flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  Commande {selectedOrder.orderReference}
                </h3>
                <div className="mt-2">
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
                title="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">👤 Client</h4>
                <p className="text-sm"><strong>Nom :</strong> {selectedOrder.clientNom}</p>
                <p className="text-sm"><strong>Téléphone :</strong> {selectedOrder.clientTelephone}</p>
                <p className="text-sm"><strong>Ville :</strong> {selectedOrder.clientVille}</p>
                <p className="text-sm"><strong>Commune :</strong> {selectedOrder.clientCommune || '-'}</p>
                <p className="text-sm"><strong>Adresse :</strong> {selectedOrder.clientAdresse || '-'}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📦 Produit</h4>
                <p className="text-sm"><strong>Produit :</strong> {selectedOrder.produitNom}</p>
                <p className="text-sm"><strong>Quantité :</strong> {selectedOrder.quantite}</p>
                <p className="text-sm"><strong>Montant :</strong> {formatCurrency(selectedOrder.montant)}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">💳 Paiement (avance)</h4>
                <p className="text-sm"><strong>Montant payé :</strong> {formatCurrency(selectedOrder.montantPaye || 0)}</p>
                <p className="text-sm"><strong>Mode :</strong> {selectedOrder.modePaiement || '-'}</p>
                <p className="text-sm"><strong>Référence :</strong> {selectedOrder.referencePayment || '-'}</p>
                <p className="text-sm"><strong>En attente paiement :</strong> {selectedOrder.enAttentePaiement ? 'Oui' : 'Non'}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🧑‍💼 Traitement</h4>
                <p className="text-sm">
                  <strong>Appelant :</strong>{' '}
                  {selectedOrder.caller ? `${selectedOrder.caller.prenom} ${selectedOrder.caller.nom}` : '-'}
                </p>
                <p className="text-sm"><strong>Note appelant :</strong> {selectedOrder.noteAppelant || '-'}</p>
                <p className="text-sm"><strong>Note gestionnaire :</strong> {selectedOrder.noteGestionnaire || '-'}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                <h4 className="font-semibold mb-2">🗓️ Dates & Expédition</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p className="text-sm"><strong>Créée le :</strong> {formatDateTime(selectedOrder.createdAt)}</p>
                  <p className="text-sm"><strong>Appelée le :</strong> {selectedOrder.calledAt ? formatDateTime(selectedOrder.calledAt) : '-'}</p>
                  <p className="text-sm"><strong>Validée le :</strong> {selectedOrder.validatedAt ? formatDateTime(selectedOrder.validatedAt) : '-'}</p>
                  <p className="text-sm"><strong>Expédiée le :</strong> {selectedOrder.expedieAt ? formatDateTime(selectedOrder.expedieAt) : '-'}</p>
                  <p className="text-sm"><strong>Code expédition :</strong> {selectedOrder.codeExpedition || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques Livreurs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Performance des Livreurs</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{totalDeliverers} livreur(s)</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-purple-600">
              Total livré: {formatCurrency(totalMontantLivre)}
            </span>
          </div>
        </div>

        {/* Recherche et tri */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un livreur..."
              value={searchDeliverer}
              onChange={(e) => setSearchDeliverer(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortDelivererBy}
            onChange={(e) => setSortDelivererBy(e.target.value as any)}
            className="input md:w-48"
          >
            <option value="taux">Trier par taux</option>
            <option value="livraisons">Trier par livraisons</option>
            <option value="montant">Trier par montant</option>
            <option value="nom">Trier par nom</option>
          </select>
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowUpDown size={18} />
            {sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
          </button>
        </div>

        {loadingDeliverers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Indicateurs clés */}
            {filteredDeliverers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-1">🏆 Meilleur taux</p>
                  <p className="text-xl font-bold text-green-900">
                    {filteredDeliverers.sort((a: any, b: any) => parseFloat(b.tauxReussite) - parseFloat(a.tauxReussite))[0]?.user.prenom}{' '}
                    {filteredDeliverers.sort((a: any, b: any) => parseFloat(b.tauxReussite) - parseFloat(a.tauxReussite))[0]?.user.nom}
                  </p>
                  <p className="text-sm text-green-600">
                    {filteredDeliverers.sort((a: any, b: any) => parseFloat(b.tauxReussite) - parseFloat(a.tauxReussite))[0]?.tauxReussite}% de réussite
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">📦 Plus de livraisons</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredDeliverers.sort((a: any, b: any) => b.totalLivraisons - a.totalLivraisons)[0]?.user.prenom}{' '}
                    {filteredDeliverers.sort((a: any, b: any) => b.totalLivraisons - a.totalLivraisons)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-blue-600">
                    {filteredDeliverers.sort((a: any, b: any) => b.totalLivraisons - a.totalLivraisons)[0]?.totalLivraisons} livraisons
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium mb-1">💰 Plus gros montant</p>
                  <p className="text-xl font-bold text-purple-900">
                    {filteredDeliverers.sort((a: any, b: any) => b.montantLivre - a.montantLivre)[0]?.user.prenom}{' '}
                    {filteredDeliverers.sort((a: any, b: any) => b.montantLivre - a.montantLivre)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-purple-600">
                    {formatCurrency(filteredDeliverers.sort((a: any, b: any) => b.montantLivre - a.montantLivre)[0]?.montantLivre || 0)}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Livreur</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Livrées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Refusées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Annulées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant livré</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taux de réussite</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliverers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun livreur trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredDeliverers.map((stat: any) => (
                      <tr key={stat.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">
                          {stat.user.prenom} {stat.user.nom}
                        </td>
                        <td className="py-3 px-4 text-sm text-green-600 font-medium">{stat.totalLivraisons}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{stat.totalRefusees}</td>
                        <td className="py-3 px-4 text-sm text-orange-600">{stat.totalAnnulees}</td>
                        <td className="py-3 px-4 text-sm font-medium text-purple-600">
                          {formatCurrency(stat.montantLivre)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  parseFloat(stat.tauxReussite) >= 80 ? 'bg-green-500' :
                                  parseFloat(stat.tauxReussite) >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${stat.tauxReussite}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              parseFloat(stat.tauxReussite) >= 80 ? 'text-green-600' :
                              parseFloat(stat.tauxReussite) >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stat.tauxReussite}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
              <div className="font-medium text-gray-700">
                Totaux: {totalLivraisons} livraisons
              </div>
              <div className="text-gray-600">
                <span className="text-purple-600 font-medium">{formatCurrency(totalMontantLivre)}</span>
                {' • '}
                <span className="font-medium">Taux moyen: {avgTauxReussite.toFixed(2)}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

