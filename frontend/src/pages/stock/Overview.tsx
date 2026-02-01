import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, AlertTriangle, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  const { data: stockStats } = useQuery({
    queryKey: ['stock-stats'],
    queryFn: async () => {
      const { data } = await api.get('/stock/stats');
      return data;
    },
  });

  const { data: tourneesData } = useQuery({
    queryKey: ['stock-tournees-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get('/stock/tournees', { params: { date: today } });
      return data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: async () => {
      const { data } = await api.get('/products/alerts/low-stock');
      return data;
    },
  });

  const stats = stockStats?.stats;
  const tourneesAujourdhui = tourneesData?.tournees || [];
  const produitsAlerte = productsData?.products || [];

  const cards = [
    {
      title: 'Produits actifs',
      value: stats?.produitsActifs || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Stock total',
      value: stats?.stockTotal || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      suffix: 'unités'
    },
    {
      title: 'Alertes stock',
      value: stats?.produitsAlerteStock || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Tournées aujourd\'hui',
      value: tourneesAujourdhui.length,
      icon: Truck,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre inventaire et tournées</p>
      </div>

      {/* Pointage GPS */}
      <AttendanceButton />

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value} {card.suffix && <span className="text-sm text-gray-600">{card.suffix}</span>}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alertes stock faible */}
      {produitsAlerte.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Alerte stock faible ({produitsAlerte.length} produit(s))
            </h2>
          </div>
          <div className="space-y-2">
            {produitsAlerte.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.nom}</p>
                  <p className="text-sm text-gray-600">Code: {product.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{product.stockActuel}</p>
                  <p className="text-xs text-gray-600">Seuil: {product.stockAlerte}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/stock/products">
            <button className="btn btn-primary w-full mt-4">
              Gérer les produits
            </button>
          </a>
        </div>
      )}

      {/* Tournées du jour */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tournées d'aujourd'hui ({tourneesAujourdhui.length})</h2>
        <div className="space-y-3">
          {tourneesAujourdhui.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune tournée prévue aujourd'hui</p>
          ) : (
            tourneesAujourdhui
              .sort((a: any, b: any) => {
                // Trier par date de création décroissante (les plus récentes en haut)
                return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
              })
              .map((tournee: any) => (
              <div key={tournee.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{tournee.nom}</p>
                    <p className="text-sm text-gray-600">
                      Livreur: {tournee.deliverer.prenom} {tournee.deliverer.nom}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tournee.stats.remisConfirme ? (
                      <span className="badge bg-green-100 text-green-800">
                        ✓ Remise confirmée
                      </span>
                    ) : (
                      <span className="badge bg-orange-100 text-orange-800">
                        ⏳ À confirmer
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{tournee.stats.totalOrders} commandes</span>
                  <span>•</span>
                  <span className="text-green-600">{tournee.stats.livrees} livrées</span>
                  <span>•</span>
                  <span className="text-orange-600">{tournee.stats.enAttente} en attente</span>
                  {tournee.stats.retourConfirme && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">✓ Retour confirmé</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <a href="/stock/tournees">
          <button className="btn btn-primary w-full mt-4">
            Voir toutes les tournées
          </button>
        </a>
      </div>

      {/* Mouvements récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <a href="/stock/tournees" className="block">
              <button className="btn btn-primary w-full text-left">
                📦 Gérer les tournées
              </button>
            </a>
            <a href="/stock/products" className="block">
              <button className="btn btn-secondary w-full text-left">
                📊 Voir les produits
              </button>
            </a>
            <a href="/stock/movements" className="block">
              <button className="btn btn-secondary w-full text-left">
                📋 Historique des mouvements
              </button>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Statistiques du jour</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Livraisons</span>
              <span className="text-xl font-bold text-green-600">{stats?.totalLivraisons || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Retours</span>
              <span className="text-xl font-bold text-blue-600">{stats?.totalRetours || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

