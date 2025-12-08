import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Search, Edit2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, usersApi, ordersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import type { Order } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function ValidatedOrders() {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  const [showAdresseModal, setShowAdresseModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newQuantite, setNewQuantite] = useState(1);
  const [newVille, setNewVille] = useState('');
  const [newCommune, setNewCommune] = useState('');
  const [newAdresse, setNewAdresse] = useState('');
  const [searchVille, setSearchVille] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Vérifier si l'utilisateur peut modifier la quantité (Admin ou Gestionnaire)
  const canEditQuantite = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';

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

  const updateQuantiteMutation = useMutation({
    mutationFn: ({ orderId, quantite }: { orderId: number; quantite: number }) => 
      ordersApi.updateQuantite(orderId, quantite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validated-orders'] });
      setShowQuantiteModal(false);
      setSelectedOrder(null);
      toast.success('✅ Quantité modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const updateAdresseMutation = useMutation({
    mutationFn: ({ orderId, clientVille, clientCommune, clientAdresse }: { 
      orderId: number; 
      clientVille: string; 
      clientCommune?: string; 
      clientAdresse?: string;
    }) => ordersApi.updateAdresse(orderId, clientVille, clientCommune, clientAdresse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validated-orders'] });
      setShowAdresseModal(false);
      setSelectedOrder(null);
      toast.success('✅ Adresse modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
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

  const handleEditQuantite = (order: Order) => {
    setSelectedOrder(order);
    setNewQuantite(order.quantite);
    setShowQuantiteModal(true);
  };

  const handleUpdateQuantite = () => {
    if (!selectedOrder) return;
    if (newQuantite < 1) {
      toast.error('La quantité doit être au minimum 1');
      return;
    }
    updateQuantiteMutation.mutate({
      orderId: selectedOrder.id,
      quantite: newQuantite,
    });
  };

  const handleEditAdresse = (order: Order) => {
    setSelectedOrder(order);
    setNewVille(order.clientVille);
    setNewCommune(order.clientCommune || '');
    setNewAdresse(order.clientAdresse || '');
    setShowAdresseModal(true);
  };

  const handleUpdateAdresse = () => {
    if (!selectedOrder) return;
    if (!newVille.trim()) {
      toast.error('La ville est requise');
      return;
    }
    updateAdresseMutation.mutate({
      orderId: selectedOrder.id,
      clientVille: newVille.trim(),
      clientCommune: newCommune.trim() || undefined,
      clientAdresse: newAdresse.trim() || undefined,
    });
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Qté</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validée le</th>
                  {canEditQuantite && (
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  )}
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
                    <td className="py-3 px-4 text-sm font-semibold text-primary-600">
                      {order.quantite}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {order.validatedAt ? formatDateTime(order.validatedAt) : '-'}
                    </td>
                    {canEditQuantite && (
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditQuantite(order)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                            title="Modifier la quantité"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEditAdresse(order)}
                            className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded"
                            title="Modifier l'adresse de livraison"
                          >
                            <MapPin size={18} />
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Modal de modification de quantité */}
      {showQuantiteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📦 Modifier la quantité</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Commande</p>
              <p className="font-semibold">{selectedOrder.orderReference}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Client</p>
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Produit</p>
              <p className="font-semibold">{selectedOrder.produitNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Quantité actuelle</p>
              <p className="font-semibold text-primary-600">{selectedOrder.quantite}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Montant actuel</p>
              <p className="font-semibold">{formatCurrency(selectedOrder.montant)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvelle quantité <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={newQuantite}
                onChange={(e) => setNewQuantite(parseInt(e.target.value) || 1)}
                className="input"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix unitaire: {formatCurrency(selectedOrder.montant / selectedOrder.quantite)}
              </p>
              {newQuantite !== selectedOrder.quantite && (
                <p className="text-sm text-primary-600 mt-2 font-semibold">
                  → Nouveau montant: {formatCurrency((selectedOrder.montant / selectedOrder.quantite) * newQuantite)}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateQuantite}
                disabled={newQuantite === selectedOrder.quantite || updateQuantiteMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateQuantiteMutation.isPending ? 'Modification...' : '✓ Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuantiteModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification d'adresse */}
      {showAdresseModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="text-green-600" size={24} />
              Modifier l'adresse de livraison
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Commande</p>
              <p className="font-semibold">{selectedOrder.orderReference}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Client</p>
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Adresse actuelle</p>
              <p className="font-semibold text-primary-600">
                {selectedOrder.clientVille}
                {selectedOrder.clientCommune && ` • ${selectedOrder.clientCommune}`}
                {selectedOrder.clientAdresse && ` • ${selectedOrder.clientAdresse}`}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVille}
                  onChange={(e) => setNewVille(e.target.value)}
                  placeholder="Ex: Abidjan, Yopougon, Daloa..."
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commune (optionnel)
                </label>
                <input
                  type="text"
                  value={newCommune}
                  onChange={(e) => setNewCommune(e.target.value)}
                  placeholder="Ex: Yopougon, Cocody, Marcory..."
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète (optionnel)
                </label>
                <textarea
                  value={newAdresse}
                  onChange={(e) => setNewAdresse(e.target.value)}
                  placeholder="Ex: Près de la pharmacie, en face du marché..."
                  className="input w-full"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpdateAdresse}
                disabled={!newVille.trim() || updateAdresseMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateAdresseMutation.isPending ? 'Modification...' : '✓ Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdresseModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
                disabled={updateAdresseMutation.isPending}
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








