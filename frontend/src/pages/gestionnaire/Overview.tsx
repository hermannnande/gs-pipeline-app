import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { statsApi, deliveryApi } from '@/lib/api';

export default function Overview() {
  const { data: statsData } = useQuery({
    queryKey: ['gestionnaire-overview'],
    queryFn: () => statsApi.getOverview(),
  });

  const { data: validatedOrders } = useQuery({
    queryKey: ['validated-orders-count'],
    queryFn: () => deliveryApi.getValidatedOrders(),
  });

  const stats = statsData?.overview;

  const cards = [
    {
      title: 'Commandes validées',
      value: validatedOrders?.orders?.length || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'En attente d\'assignation'
    },
    {
      title: 'Commandes assignées',
      value: stats?.validatedOrders || 0,
      icon: Truck,
      color: 'bg-blue-500',
      description: 'Assignées aux livreurs'
    },
    {
      title: 'Commandes livrées',
      value: stats?.deliveredOrders || 0,
      icon: Package,
      color: 'bg-purple-500',
      description: 'Aujourd\'hui'
    },
    {
      title: 'En attente',
      value: stats?.newOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'À traiter'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Gestionnaire</h1>
        <p className="text-gray-600 mt-1">Gestion des livraisons et assignations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <a href="/gestionnaire/validated" className="block">
              <button className="w-full btn btn-primary text-left">
                <div className="flex items-center justify-between">
                  <span>Voir les commandes validées</span>
                  <span className="badge bg-white text-primary-600">
                    {validatedOrders?.orders?.length || 0}
                  </span>
                </div>
              </button>
            </a>
            <a href="/gestionnaire/deliveries" className="block">
              <button className="w-full btn btn-secondary text-left">
                Gérer les listes de livraison
              </button>
            </a>
            <a href="/gestionnaire/stats" className="block">
              <button className="w-full btn btn-secondary text-left">
                Voir les statistiques détaillées
              </button>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Commandes par ville</h2>
          <div className="space-y-3">
            {statsData?.topCities?.slice(0, 5).map((city: any) => (
              <div key={city.clientVille} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{city.clientVille}</span>
                <span className="badge bg-primary-100 text-primary-800">{city._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}







