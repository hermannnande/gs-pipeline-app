import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => ordersApi.getAll({ page, limit: 20, status: statusFilter || undefined }),
  });

  const filteredOrders = data?.orders?.filter((order: Order) =>
    order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clientTelephone.includes(searchTerm) ||
    order.orderReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Toutes les commandes</h1>
        <p className="text-gray-600 mt-1">Gestion complète des commandes</p>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou référence..."
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
            <option value="">Tous les statuts</option>
            <option value="NOUVELLE">Nouvelle</option>
            <option value="A_APPELER">À appeler</option>
            <option value="VALIDEE">Validée</option>
            <option value="ASSIGNEE">Assignée</option>
            <option value="LIVREE">Livrée</option>
            <option value="ANNULEE">Annulée</option>
            <option value="REFUSEE">Refusée</option>
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders?.map((order: Order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                      <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                      <td className="py-3 px-4 text-sm">{order.clientTelephone}</td>
                      <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                      <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {data.pagination.page} sur {data.pagination.totalPages}
                  {' '}({data.pagination.total} commandes)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

