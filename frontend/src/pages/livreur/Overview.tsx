import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { statsApi, deliveryApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

export default function Overview() {
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

  const pendingOrders = todayOrders?.orders?.filter((o: any) => o.status === 'ASSIGNEE') || [];
  const completedToday = todayOrders?.orders?.filter((o: any) => o.status === 'LIVREE') || [];

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

      {/* Livraisons en attente */}
      {pendingOrders.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Livraisons en attente</h3>
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
    </div>
  );
}

