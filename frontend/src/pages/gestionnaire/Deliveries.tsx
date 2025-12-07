import { useQuery } from '@tanstack/react-query';
import { Truck, Package } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

export default function Deliveries() {
  const { data: listsData, isLoading } = useQuery({
    queryKey: ['delivery-lists'],
    queryFn: () => deliveryApi.getLists(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Listes de livraison</h1>
        <p className="text-gray-600 mt-1">Suivi des livraisons par livreur</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {listsData?.lists?.map((list: any) => (
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








