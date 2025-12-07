import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle, XCircle, TrendingUp, Truck } from 'lucide-react';
import { statsApi, deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function Overview() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedExpedition, setSelectedExpedition] = useState<any>(null);
  const [codeExpedition, setCodeExpedition] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['livreur-my-stats'],
    queryFn: () => statsApi.getMyStats({ period: 'today' }),
  });

  const { data: todayOrders } = useQuery({
    queryKey: ['livreur-today-orders'],
    queryFn: () => deliveryApi.getMyOrders({ 
      date: new Date().toISOString().split('T')[0]
    }),
  });

  // Récupérer les expéditions assignées au livreur
  const { data: expeditionsData } = useQuery({
    queryKey: ['livreur-expeditions'],
    queryFn: () => ordersApi.getAll({ 
      delivererId: user?.id,
      deliveryType: 'EXPEDITION',
      status: 'ASSIGNEE',
      limit: 100
    }),
    refetchInterval: 30000,
  });

  // Mutation pour marquer une expédition comme livrée
  const deliverExpeditionMutation = useMutation({
    mutationFn: ({ orderId, codeExpedition }: { orderId: number; codeExpedition: string }) => 
      ordersApi.deliverExpedition(orderId, codeExpedition),
    onSuccess: () => {
      toast.success('✅ Expédition confirmée comme livrée');
      queryClient.invalidateQueries({ queryKey: ['livreur-expeditions'] });
      queryClient.invalidateQueries({ queryKey: ['livreur-my-stats'] });
      setSelectedExpedition(null);
      setCodeExpedition('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handleDeliverExpedition = (order: any) => {
    setSelectedExpedition(order);
  };

  const confirmDeliverExpedition = () => {
    if (!codeExpedition.trim()) {
      toast.error('Veuillez saisir le code d\'expédition');
      return;
    }
    deliverExpeditionMutation.mutate({
      orderId: selectedExpedition.id,
      codeExpedition: codeExpedition.trim()
    });
  };

  const cards = [
    {
      title: 'Livraisons aujourd\'hui',
      value: stats?.stats?.totalLivraisons || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Refusées',
      value: stats?.stats?.totalRefusees || 0,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Annulées',
      value: stats?.stats?.totalAnnulees || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Montant encaissé',
      value: formatCurrency(stats?.stats?.montantLivre || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  // Filtrer les commandes locales uniquement (exclure les EXPEDITION qui ont leur propre section)
  const pendingOrders = todayOrders?.orders?.filter((o: any) => 
    o.status === 'ASSIGNEE' && o.deliveryType !== 'EXPEDITION'
  ) || [];
  const completedToday = todayOrders?.orders?.filter((o: any) => 
    o.status === 'LIVREE' && o.deliveryType !== 'EXPEDITION'
  ) || [];
  const expeditions = expeditionsData?.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Livreur</h1>
        <p className="text-gray-600 mt-1">Vos livraisons du jour</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance */}
      {stats?.stats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance aujourd'hui</h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600">
                {stats.stats.tauxReussite || 0}%
              </p>
              <p className="text-gray-600 mt-2">Taux de réussite</p>
            </div>
          </div>
        </div>
      )}

      {/* Expéditions assignées */}
      {expeditions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="text-blue-600" size={20} />
              Mes EXPÉDITIONS à livrer
            </h3>
            <span className="badge bg-blue-100 text-blue-800">
              {expeditions.length} expédition(s)
            </span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>⚠️ Important :</strong> Client a déjà payé 100%. Pas de collecte d'argent.
            </p>
          </div>
          <div className="space-y-3">
            {expeditions.map((order: any) => (
              <div key={order.id} className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">{order.clientNom}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      📍 {order.clientAdresse}, {order.clientVille}
                    </p>
                    <p className="text-sm text-gray-600">
                      📞 {order.clientTelephone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Réf: {order.orderReference}</p>
                    <p className="font-bold text-green-600">{formatCurrency(order.montant)}</p>
                    <p className="text-xs text-green-700">✓ Déjà payé</p>
                  </div>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <p className="text-sm text-gray-700">
                    <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Paiement :</strong> {order.modePaiement} - {order.referencePayment}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeliverExpedition(order)}
                  className="btn btn-primary w-full mt-3"
                  disabled={deliverExpeditionMutation.isPending}
                >
                  {deliverExpeditionMutation.isPending ? 'Confirmation...' : '✓ Marquer comme expédié/livré'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Livraisons en attente */}
      {pendingOrders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Livraisons locales en attente</h3>
            <span className="badge bg-orange-100 text-orange-800">
              {pendingOrders.length} en attente
            </span>
          </div>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.clientNom}</p>
                    <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatCurrency(order.montant)}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/livreur/deliveries">
            <button className="btn btn-primary w-full mt-4">
              Voir toutes mes livraisons
            </button>
          </a>
        </div>
      )}

      {/* Livraisons complétées aujourd'hui */}
      {completedToday.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Livrées aujourd'hui</h3>
          <div className="space-y-2">
            {completedToday.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.clientNom}</p>
                  <p className="text-sm text-gray-600">{order.clientVille}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{formatCurrency(order.montant)}</p>
                  <p className="text-xs text-gray-500">Livrée ✓</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmation avec code d'expédition */}
      {selectedExpedition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📦 Confirmer l'expédition
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium text-gray-900">{selectedExpedition.clientNom}</p>
                <p className="text-sm text-gray-600">{selectedExpedition.clientTelephone}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-medium text-gray-900">{selectedExpedition.clientVille}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Produit</p>
                <p className="font-medium text-gray-900">{selectedExpedition.produitNom}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'expédition <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={codeExpedition}
                onChange={(e) => setCodeExpedition(e.target.value)}
                placeholder="Ex: EXP123456, TRK789..."
                className="input w-full"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Code de suivi fourni par le transporteur
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedExpedition(null);
                  setCodeExpedition('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeliverExpedition}
                disabled={!codeExpedition.trim() || deliverExpeditionMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {deliverExpeditionMutation.isPending ? 'Confirmation...' : '✓ Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




