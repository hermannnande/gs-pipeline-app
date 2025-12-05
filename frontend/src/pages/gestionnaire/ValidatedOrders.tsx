import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function ValidatedOrders() {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchVille, setSearchVille] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['validated-orders', searchVille],
    queryFn: () => deliveryApi.getValidatedOrders({ ville: searchVille || undefined }),
  });

  const { data: livreurs } = useQuery({
    queryKey: ['livreurs'],
    queryFn: () => usersApi.getAll({ role: 'LIVREUR', actif: true }),
  });

  const assignMutation = useMutation({
    mutationFn: deliveryApi.assignOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validated-orders'] });
      setSelectedOrders([]);
      setShowAssignModal(false);
      toast.success('Commandes assignées avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'assignation');
    },
  });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    assignMutation.mutate({
      orderIds: selectedOrders,
      delivererId: parseInt(formData.get('delivererId') as string),
      deliveryDate: formData.get('deliveryDate') as string,
      listName: formData.get('listName') as string,
      zone: formData.get('zone') as string,
    });
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes validées</h1>
          <p className="text-gray-600 mt-1">En attente d'assignation aux livreurs</p>
        </div>
        {selectedOrders.length > 0 && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Check size={20} />
            Assigner {selectedOrders.length} commande(s)
          </button>
        )}
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Filtrer par ville..."
            value={searchVille}
            onChange={(e) => setSearchVille(e.target.value)}
            className="input pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-12 py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === ordersData?.orders?.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(ordersData?.orders?.map((o: Order) => o.id) || []);
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Adresse</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validée le</th>
                </tr>
              </thead>
              <tbody>
                {ordersData?.orders?.map((order: Order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedOrders.includes(order.id) ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => toggleOrderSelection(order.id)}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{order.clientNom}</td>
                    <td className="py-3 px-4 text-sm">{order.clientTelephone}</td>
                    <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {order.clientAdresse || order.clientCommune || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {order.validatedAt ? formatDateTime(order.validatedAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Assigner des commandes</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Livreur
                </label>
                <select name="delivererId" className="input" required>
                  <option value="">Sélectionner un livreur</option>
                  {livreurs?.users?.map((livreur: any) => (
                    <option key={livreur.id} value={livreur.id}>
                      {livreur.prenom} {livreur.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de livraison
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  className="input"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la liste (optionnel)
                </label>
                <input
                  type="text"
                  name="listName"
                  className="input"
                  placeholder="Ex: Livraison Casablanca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone (optionnel)
                </label>
                <input
                  type="text"
                  name="zone"
                  className="input"
                  placeholder="Ex: Centre-ville"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  Assigner
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


