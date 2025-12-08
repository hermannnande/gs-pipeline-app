import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Package,
  Users as UsersIcon,
  Calendar,
  Download,
  FileText,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';
import { statsApi, ordersApi, usersApi, adminApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

export default function Overview() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const navigate = useNavigate();

  const fixExpressStockMutation = useMutation({
    mutationFn: () => adminApi.fixExpressStock(),
    onSuccess: (data) => {
      toast.success(`✅ Correction terminée ! ${data.total} produit(s) corrigé(s)`);
      if (data.corrections && data.corrections.length > 0) {
        console.log('Détails des corrections:', data.corrections);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la correction');
    },
  });

  const handleFixExpressStock = () => {
    if (window.confirm('Voulez-vous corriger automatiquement les stocks EXPRESS des commandes déjà retirées ?')) {
      fixExpressStockMutation.mutate();
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'all':
        return {};
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { data: statsData } = useQuery({
    queryKey: ['overview-stats', period],
    queryFn: () => statsApi.getOverview(getDateRange()),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getAll({ page: 1, limit: 5 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersApi.getAll(),
  });

  const stats = statsData?.overview;

  const statCards = [
    {
      title: 'Commandes totales',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Commandes livrées',
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Nouvelles commandes',
      value: stats?.newOrders || 0,
      icon: Package,
      color: 'bg-yellow-500',
    },
    {
      title: 'Chiffre d\'affaires',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        
        {/* Filtre de période */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
          <button
            onClick={() => setPeriod('today')}
            className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              period === 'today'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              period === 'week'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              period === 'month'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              period === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton de correction Stock EXPRESS */}
      <div className="card bg-amber-50 border-2 border-amber-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-lg">
            <Wrench size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              Correction Stock EXPRESS
            </h3>
            <p className="text-sm text-amber-700 mb-4">
              Si un produit affiche un Stock EXPRESS (réservé) alors que la commande a déjà été retirée par le client, 
              cliquez sur ce bouton pour corriger automatiquement.
            </p>
            <button
              onClick={handleFixExpressStock}
              disabled={fixExpressStockMutation.isPending}
              className="btn bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Wrench size={18} />
              {fixExpressStockMutation.isPending ? 'Correction en cours...' : 'Corriger Stock EXPRESS'}
            </button>
          </div>
        </div>
      </div>

      {/* Taux de conversion */}
      {stats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Performance globale</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.conversionRate}%</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Commandes validées</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.validatedOrders}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Commandes annulées</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelledOrders}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commandes récentes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Commandes récentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.orders?.slice(0, 5).map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{order.orderReference}</td>
                  <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                  <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                  <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                  <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`badge ${order.status === 'LIVREE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilisateurs actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Utilisateurs par rôle</h3>
          <div className="space-y-3">
            {['APPELANT', 'LIVREUR', 'GESTIONNAIRE'].map(role => {
              const count = usersData?.users?.filter((u: any) => u.role === role && u.actif).length || 0;
              return (
                <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{role}</span>
                  <span className="text-lg font-bold text-primary-600">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/users')}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              <UsersIcon size={20} />
              Créer un nouveau compte
            </button>
            <button 
              onClick={handleFixExpressStock}
              disabled={fixExpressStockMutation.isPending}
              className="w-full btn bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              <Wrench size={20} />
              {fixExpressStockMutation.isPending ? 'Correction en cours...' : '🔧 Corriger Stock EXPRESS'}
            </button>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Exporter les données
            </button>
            <button 
              onClick={() => navigate('/admin/stats')}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Voir les rapports détaillés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

