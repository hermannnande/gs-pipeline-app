import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { statsApi, ordersApi, usersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import { StatCard, PageHeader, LoadingState, EmptyState } from '@/components/UIComponents';
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const navigate = useNavigate();

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

  if (!stats) {
    return <LoadingState text="Chargement des statistiques..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Administrateur"
        subtitle="Vue d'ensemble de votre activité en temps réel"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-card p-1.5 border border-gray-100">
            {['today', 'week', 'month', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  period === p
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p === 'today' && "Aujourd'hui"}
                {p === 'week' && '7 jours'}
                {p === 'month' && '30 jours'}
                {p === 'all' && 'Tout'}
              </button>
            ))}
          </div>
        }
      />

      {/* Pointage GPS */}
      <AttendanceButton />

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Commandes totales"
          value={stats.totalOrders || 0}
          icon={ShoppingCart}
          variant="primary"
        />
        <StatCard
          title="Commandes livrées"
          value={stats.deliveredOrders || 0}
          icon={CheckCircle}
          variant="success"
          trend={{
            value: `${stats.conversionRate || 0}% de conversion`,
            isPositive: true
          }}
        />
        <StatCard
          title="Nouvelles commandes"
          value={stats.newOrders || 0}
          icon={Package}
          variant="warning"
        />
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.totalRevenue || 0)}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* Performance globale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-success">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Taux de conversion</p>
            <ArrowUpRight className="text-success-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-gray-900 font-display">{stats.conversionRate}%</p>
          <p className="text-sm text-success-600 mt-2 font-medium">Performance excellente</p>
        </div>
        
        <div className="stat-card-primary">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Commandes validées</p>
            <CheckCircle className="text-primary-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-gray-900 font-display">{stats.validatedOrders}</p>
          <p className="text-sm text-primary-600 mt-2 font-medium">Prêtes à expédier</p>
        </div>
        
        <div className="stat-card-danger">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Commandes annulées</p>
            <XCircle className="text-danger-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-gray-900 font-display">{stats.cancelledOrders}</p>
          <p className="text-sm text-danger-600 mt-2 font-medium">À analyser</p>
        </div>
      </div>

      {/* Commandes récentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 font-display">Commandes récentes</h3>
          <button 
            onClick={() => navigate('/admin/orders')}
            className="btn btn-secondary btn-sm"
          >
            Voir tout
          </button>
        </div>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Ville</th>
                <th>Produit</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.orders?.slice(0, 5).map((order: any) => (
                <tr key={order.id}>
                  <td className="font-mono font-semibold">{order.orderReference}</td>
                  <td className="font-medium">{order.clientNom}</td>
                  <td>{order.clientVille}</td>
                  <td className="text-gray-600">{order.produitNom}</td>
                  <td className="font-bold text-gray-900">{formatCurrency(order.montant)}</td>
                  <td>
                    <span className={`badge ${
                      order.status === 'LIVREE' ? 'badge-success' :
                      order.status === 'VALIDEE' ? 'badge-primary' :
                      order.status === 'ANNULEE' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilisateurs et Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">Utilisateurs par rôle</h3>
          <div className="space-y-3">
            {['APPELANT', 'LIVREUR', 'GESTIONNAIRE'].map(role => {
              const count = usersData?.users?.filter((u: any) => u.role === role && u.actif).length || 0;
              const icons: Record<string, string> = {
                APPELANT: '📞',
                LIVREUR: '🚚',
                GESTIONNAIRE: '🎯'
              };
              return (
                <div 
                  key={role} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icons[role]}</span>
                    <span className="text-sm font-semibold text-gray-700">{role}</span>
                  </div>
                  <span className="text-2xl font-bold text-primary-600 font-display">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6 font-display">Actions rapides</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/users')}
              className="w-full btn btn-primary"
            >
              <UsersIcon size={20} />
              <span>Créer un nouveau compte</span>
            </button>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="w-full btn btn-secondary"
            >
              <Download size={20} />
              <span>Exporter les données</span>
            </button>
            <button 
              onClick={() => navigate('/admin/stats')}
              className="w-full btn btn-secondary"
            >
              <FileText size={20} />
              <span>Voir les rapports détaillés</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

