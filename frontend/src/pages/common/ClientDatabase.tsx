import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, Phone, MapPin, Package, User, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import { useAuthStore } from '@/store/authStore';

export default function ClientDatabase() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterVille, setFilterVille] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCaller, setFilterCaller] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [filterNiche, setFilterNiche] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  // Requête pour récupérer toutes les commandes TRAITÉES (pas NOUVELLE ni A_APPELER)
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['client-database', searchTerm, filterStatus, filterVille, startDate, endDate, filterCaller],
    queryFn: async () => {
      const { data } = await api.get('/orders', {
        params: {
          page: 1,
          limit: 50,
          search: searchTerm || undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          ville: filterVille || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          callerId: filterCaller || undefined
        }
      });
      return data;
    },
    refetchOnWindowFocus: true
  });

  // Liste produits (filtrer l'export par produit)
  const { data: productsData } = useQuery({
    queryKey: ['products-export-list'],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { actif: 'true' } });
      return data;
    },
  });

  // Requête pour récupérer les appelants
  const { data: appelants } = useQuery({
    queryKey: ['appelants-list'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'APPELANT' } });
      return data;
    },
  });

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterVille) params.ville = filterVille;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filterCaller) params.callerId = filterCaller;
      if (filterProductId) params.productId = filterProductId;
      if (filterNiche.trim()) params.niche = filterNiche.trim();

      const res = await api.get('/orders/contacts-export', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers['content-disposition'];
      const m = cd && /filename="([^"]+)"/.exec(cd);
      a.download = m ? m[1] : `contacts-clients-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Export impossible. Verifiez votre connexion ou reessayez.');
    } finally {
      setExporting(false);
    }
  };

  // Filtrer uniquement les commandes TRAITÉES (exclure NOUVELLE et A_APPELER)
  // IMPORTANT : Pour le Gestionnaire de Stock, exclure aussi VALIDEE (commandes non assignées)
  const commandesTraitees = ordersData?.orders?.filter((order: any) => {
    // Exclure toujours les commandes nouvelles et à appeler
    if (['NOUVELLE', 'A_APPELER'].includes(order.status)) {
      return false;
    }
    
    // Pour Gestionnaire de Stock : exclure aussi les commandes VALIDÉE non assignées
    if (user?.role === 'GESTIONNAIRE_STOCK' && order.status === 'VALIDEE') {
      return false;
    }
    
    return true;
  }) || [];

  // Statistiques en temps réel
  const stats = {
    total: commandesTraitees.length,
    validees: commandesTraitees.filter((o: any) => o.status === 'VALIDEE').length,
    annulees: commandesTraitees.filter((o: any) => o.status === 'ANNULEE').length,
    injoignables: commandesTraitees.filter((o: any) => o.status === 'INJOIGNABLE').length,
    assignees: commandesTraitees.filter((o: any) => o.status === 'ASSIGNEE').length,
    livrees: commandesTraitees.filter((o: any) => o.status === 'LIVREE').length,
    montantTotal: commandesTraitees.reduce((sum: number, o: any) => {
      if (['VALIDEE', 'ASSIGNEE', 'LIVREE'].includes(o.status)) {
        return sum + o.montant;
      }
      return sum;
    }, 0)
  };

  // Extraction des villes uniques
  const villes = [...new Set(commandesTraitees.map((o: any) => o.clientVille))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Base de Données Clients</h1>
        <p className="text-gray-600 mt-1">
          Historique des commandes traitées. Export CSV : une ligne par numéro (dernière commande retenue),
          filtrable par produit ou par niche (page / campagne).
        </p>
      </div>

      {/* Statistiques en temps réel - En haut */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        {/* Gestionnaire de Stock ne voit pas les Validées */}
        {user?.role !== 'GESTIONNAIRE_STOCK' && (
          <div className="card bg-green-50 border-green-200">
            <p className="text-xs text-green-600 font-medium">Validées</p>
            <p className="text-2xl font-bold text-green-700">{stats.validees}</p>
          </div>
        )}
        <div className="card bg-red-50 border-red-200">
          <p className="text-xs text-red-600 font-medium">Annulées</p>
          <p className="text-2xl font-bold text-red-700">{stats.annulees}</p>
        </div>
        <div className="card bg-orange-50 border-orange-200">
          <p className="text-xs text-orange-600 font-medium">Injoignables</p>
          <p className="text-2xl font-bold text-orange-700">{stats.injoignables}</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-600 font-medium">Assignées</p>
          <p className="text-2xl font-bold text-purple-700">{stats.assignees}</p>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium">Livrées</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.livrees}</p>
        </div>
        <div className="card bg-indigo-50 border-indigo-200">
          <p className="text-xs text-indigo-600 font-medium">Montant</p>
          <p className="text-lg font-bold text-indigo-700">{formatCurrency(stats.montantTotal)}</p>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche (nom, téléphone)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="ALL">Tous les statuts</option>
              {/* Gestionnaire de Stock ne voit pas les commandes VALIDÉE non assignées */}
              {user?.role !== 'GESTIONNAIRE_STOCK' && (
                <option value="VALIDEE">Validée</option>
              )}
              <option value="ANNULEE">Annulée</option>
              <option value="INJOIGNABLE">Injoignable</option>
              <option value="ASSIGNEE">Assignée</option>
              <option value="LIVREE">Livrée</option>
              <option value="REFUSEE">Refusée</option>
              <option value="ANNULEE_LIVRAISON">Annulée livraison</option>
            </select>
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
            <select
              value={filterVille}
              onChange={(e) => setFilterVille(e.target.value)}
              className="input"
            >
              <option value="">Toutes les villes</option>
              {villes.map((ville) => (
                <option key={ville} value={ville}>
                  {ville}
                </option>
              ))}
            </select>
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Appelant (si admin ou gestionnaire) */}
          {(user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appelant</label>
              <select
                value={filterCaller}
                onChange={(e) => setFilterCaller(e.target.value)}
                className="input"
              >
                <option value="">Tous les appelants</option>
                {appelants?.users?.map((appelant: any) => (
                  <option key={appelant.id} value={appelant.id}>
                    {appelant.prenom} {appelant.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Produit (export filtré) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Produit (export)</label>
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="input"
            >
              <option value="">Tous les produits</option>
              {productsData?.products?.map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nom} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Niche : page landing, UTM, slug */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niche / page / campagne (contient…)
            </label>
            <input
              type="text"
              placeholder="ex. creme-verrue-tk, fb, serum-cerne…"
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cherche dans la page produit, la page source ou la campagne enregistrée sur la commande.
            </p>
          </div>

          {/* Bouton réinitialiser */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterVille('');
                setStartDate('');
                setEndDate('');
                setFilterCaller('');
                setFilterProductId('');
                setFilterNiche('');
              }}
              className="btn btn-secondary w-full"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-900">
            {commandesTraitees.length} commande(s) traitée(s)
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? 'Export…' : 'Exporter contacts CSV (tél. uniques)'}
            </button>
            <div className="text-sm text-gray-500">
              Liste : 50 max · fichier : toutes les lignes correspondant aux filtres
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : commandesTraitees.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune commande traitée trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appelant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commandesTraitees.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {order.clientNom}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {order.clientTelephone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {order.clientVille}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {order.produitNom}
                      <div className="text-xs text-gray-500">Qté: {order.quantite}</div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.montant)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.caller ? (
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {order.caller.prenom} {order.caller.nom}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Détails de la commande</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{selectedOrder.clientNom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{selectedOrder.clientTelephone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ville</p>
                  <p className="font-medium">{selectedOrder.clientVille}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commune</p>
                  <p className="font-medium">{selectedOrder.clientCommune}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium">{selectedOrder.clientAdresse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produit</p>
                  <p className="font-medium">{selectedOrder.produitNom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantité</p>
                  <p className="font-medium">{selectedOrder.quantite}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedOrder.montant)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {selectedOrder.noteAppelant && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">Note Appelant</p>
                  <p className="text-sm text-gray-700">{selectedOrder.noteAppelant}</p>
                </div>
              )}

              {selectedOrder.noteLivreur && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 font-medium mb-1">Note Livreur</p>
                  <p className="text-sm text-gray-700">{selectedOrder.noteLivreur}</p>
                </div>
              )}

              {selectedOrder.caller && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Appelant</p>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.caller.prenom} {selectedOrder.caller.nom}
                  </p>
                  <p className="text-xs text-gray-600">
                    Appelé le {formatDateTime(selectedOrder.calledAt)}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
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

