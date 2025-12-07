import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, Search, Filter } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

export default function Deliveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const { data: listsData, isLoading } = useQuery({
    queryKey: ['delivery-lists'],
    queryFn: () => deliveryApi.getLists(),
  });

  // Extraire les villes uniques pour le filtre
  const villes = useMemo(() => {
    if (!listsData?.lists) return [];
    const villesSet = new Set<string>();
    listsData.lists.forEach((list: any) => {
      list.orders.forEach((order: any) => {
        if (order.clientVille) villesSet.add(order.clientVille);
      });
    });
    return Array.from(villesSet).sort();
  }, [listsData]);

  // Filtrer les listes de livraison
  const filteredLists = useMemo(() => {
    if (!listsData?.lists) return [];
    
    return listsData.lists
      .map((list: any) => {
        // Filtrer les commandes dans chaque liste
        const filteredOrders = list.orders.filter((order: any) => {
          const matchesSearch = !searchTerm || 
            order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderReference?.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesType = !typeFilter || 
            (typeFilter === 'EXPEDITION' && order.deliveryType === 'EXPEDITION') ||
            (typeFilter === 'LOCAL' && (!order.deliveryType || order.deliveryType === 'LOCAL'));
          
          const matchesVille = !villeFilter || order.clientVille === villeFilter;
          
          const matchesStatut = !statutFilter || order.status === statutFilter;
          
          return matchesSearch && matchesType && matchesVille && matchesStatut;
        });

        return {
          ...list,
          orders: filteredOrders
        };
      })
      .filter((list: any) => list.orders.length > 0); // Ne montrer que les listes avec des commandes
  }, [listsData, searchTerm, typeFilter, villeFilter, statutFilter]);

  // Compter le total de commandes filtrées
  const totalCommandesFiltrees = filteredLists.reduce((sum: number, list: any) => sum + list.orders.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Listes de livraison</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Suivi des livraisons par livreur</p>
        </div>
        <div className="bg-primary-100 px-4 py-2 rounded-lg">
          <span className="text-2xl font-bold text-primary-600">{totalCommandesFiltrees}</span>
          <span className="text-sm text-primary-600 ml-2">commande(s)</span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom client, référence..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de livraison
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Tous les types</option>
              <option value="LOCAL">Livraison locale</option>
              <option value="EXPEDITION">Expédition</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <select
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Toutes les villes</option>
              {villes.map((ville) => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">Tous les statuts</option>
              <option value="ASSIGNEE">Assignée</option>
              <option value="LIVREE">Livrée</option>
              <option value="REFUSEE">Refusée</option>
              <option value="ANNULEE_LIVRAISON">Annulée</option>
              <option value="RETOURNE">Retournée</option>
            </select>
          </div>
        </div>

        {/* Bouton reset filtres */}
        {(searchTerm || typeFilter || villeFilter || statutFilter) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setVilleFilter('');
                setStatutFilter('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune liste de livraison</h3>
          <p className="text-gray-500">
            {searchTerm || typeFilter || villeFilter || statutFilter
              ? 'Aucune liste ne correspond à vos critères de recherche'
              : 'Aucune liste de livraison disponible'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLists.map((list: any) => (
            <div key={list.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-3 rounded-lg text-primary-600">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{list.nom}</h3>
                    <p className="text-sm text-gray-600">
                      {list.deliverer.prenom} {list.deliverer.nom} • {formatDate(list.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-primary-600">
                    {list.orders.length} commande(s)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Ville</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Montant</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Statut</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Code Expédition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm">{order.clientNom}</td>
                        <td className="py-2 px-3 text-sm">{order.clientVille}</td>
                        <td className="py-2 px-3 text-sm font-medium">{formatCurrency(order.montant)}</td>
                        <td className="py-2 px-3">
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {order.deliveryType === 'EXPEDITION' && order.codeExpedition ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                              📦 {order.codeExpedition}
                            </span>
                          ) : order.deliveryType === 'EXPEDITION' && order.status === 'ASSIGNEE' ? (
                            <span className="text-xs text-gray-400 italic">En attente...</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Livrées: <strong className="text-green-600">
                      {list.orders.filter((o: any) => o.status === 'LIVREE').length}
                    </strong>
                  </span>
                  <span className="text-gray-600">
                    En cours: <strong className="text-blue-600">
                      {list.orders.filter((o: any) => o.status === 'ASSIGNEE').length}
                    </strong>
                  </span>
                  <span className="text-gray-600">
                    Refusées: <strong className="text-red-600">
                      {list.orders.filter((o: any) => o.status === 'REFUSEE').length}
                    </strong>
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Total encaissé: {formatCurrency(
                    list.orders
                      .filter((o: any) => o.status === 'LIVREE')
                      .reduce((sum: number, o: any) => sum + o.montant, 0)
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}








