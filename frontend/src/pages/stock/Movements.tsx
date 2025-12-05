import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/utils/statusHelpers';

export default function Movements() {
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { actif: true } });
      return data;
    },
  });

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['stock-movements', productFilter, typeFilter, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/stock/movements', {
        params: {
          productId: productFilter || undefined,
          type: typeFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit: 200
        }
      });
      return data;
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APPROVISIONNEMENT: 'Approvisionnement',
      LIVRAISON: 'Livraison',
      RETOUR: 'Retour',
      CORRECTION: 'Correction',
      PERTE: 'Perte/Casse'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      APPROVISIONNEMENT: 'bg-green-100 text-green-800',
      LIVRAISON: 'bg-red-100 text-red-800',
      RETOUR: 'bg-blue-100 text-blue-800',
      CORRECTION: 'bg-yellow-100 text-yellow-800',
      PERTE: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const totalEntrees = movementsData?.movements?.filter((m: any) => m.quantite > 0)
    .reduce((sum: number, m: any) => sum + m.quantite, 0) || 0;

  const totalSorties = Math.abs(movementsData?.movements?.filter((m: any) => m.quantite < 0)
    .reduce((sum: number, m: any) => sum + m.quantite, 0) || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historique des Mouvements</h1>
        <p className="text-gray-600 mt-1">Suivi de tous les mouvements de stock</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total entrées</p>
              <p className="text-2xl font-bold text-green-600 mt-2">+{totalEntrees}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total sorties</p>
              <p className="text-2xl font-bold text-red-600 mt-2">-{totalSorties}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mouvements</p>
              <p className="text-2xl font-bold text-primary-600 mt-2">
                {movementsData?.movements?.length || 0}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Filter size={24} className="text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Filter size={20} />
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les produits</option>
              {productsData?.products?.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les types</option>
              <option value="APPROVISIONNEMENT">Approvisionnement</option>
              <option value="LIVRAISON">Livraison</option>
              <option value="RETOUR">Retour</option>
              <option value="CORRECTION">Correction</option>
              <option value="PERTE">Perte/Casse</option>
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

        {(productFilter || typeFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setProductFilter('');
              setTypeFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-secondary mt-4"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Liste des mouvements */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : movementsData?.movements?.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun mouvement trouvé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Quantité</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stock avant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stock après</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Motif</th>
                </tr>
              </thead>
              <tbody>
                {movementsData?.movements?.map((movement: any) => (
                  <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {movement.product.nom}
                      <div className="text-xs text-gray-500">{movement.product.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getTypeColor(movement.type)}`}>
                        {getTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`font-bold ${
                        movement.quantite > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantite > 0 ? '+' : ''}{movement.quantite}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{movement.stockAvant}</td>
                    <td className="py-3 px-4 text-sm font-medium">{movement.stockApres}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {movement.motif}
                      {movement.tournee && (
                        <div className="text-xs text-blue-600 mt-1">
                          Tournée: {movement.tournee.deliveryList.nom}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

