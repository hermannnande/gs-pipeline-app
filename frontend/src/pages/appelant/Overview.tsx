import { useQuery } from '@tanstack/react-query';
import { Phone, CheckCircle, XCircle, PhoneOff } from 'lucide-react';
import { statsApi, ordersApi } from '@/lib/api';

export default function Overview() {
  const { data: stats } = useQuery({
    queryKey: ['appelant-my-stats'],
    queryFn: () => statsApi.getMyStats({ period: 'today' }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['appelant-pending-orders'],
    queryFn: () => ordersApi.getAll({ status: 'A_APPELER', limit: 10 }),
  });

  const cards = [
    {
      title: 'Appels aujourd\'hui',
      value: stats?.stats?.totalAppels || 0,
      icon: Phone,
      color: 'bg-blue-500',
    },
    {
      title: 'Validées',
      value: stats?.stats?.totalValides || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Annulées',
      value: stats?.stats?.totalAnnules || 0,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Injoignables',
      value: stats?.stats?.totalInjoignables || 0,
      icon: PhoneOff,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Appelant</h1>
        <p className="text-gray-600 mt-1">Votre activité du jour</p>
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

      {/* Taux de validation */}
      {stats?.stats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance aujourd'hui</h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600">
                {stats.stats.tauxValidation || 0}%
              </p>
              <p className="text-gray-600 mt-2">Taux de validation</p>
            </div>
          </div>
        </div>
      )}

      {/* Commandes à appeler */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Commandes à appeler</h3>
          <a href="/appelant/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Voir tout →
          </a>
        </div>
        <div className="space-y-3">
          {ordersData?.orders?.slice(0, 5).map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{order.clientNom}</p>
                <p className="text-sm text-gray-600">{order.clientVille} • {order.clientTelephone}</p>
              </div>
              <a href="/appelant/orders">
                <button className="btn btn-primary btn-sm">
                  Appeler
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}








