import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Truck, 
  BarChart3,
  Phone,
  Package,
  Warehouse,
  TrendingUp,
  History,
  Database,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseUrl = `/${user?.role?.toLowerCase()}`;
    
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Phone, label: 'À appeler', path: '/admin/to-call' },
          { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
          { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
          { icon: Truck, label: 'Gestion des Tournées', path: '/admin/tournees' },
          { icon: Package, label: 'Gestion des Produits', path: '/admin/products' },
          { icon: History, label: 'Historique Mouvements', path: '/admin/movements' },
          { icon: Database, label: 'Base Clients', path: '/admin/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/admin/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/admin/stats' },
        ];
      case 'GESTIONNAIRE':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/gestionnaire' },
          { icon: Phone, label: 'À appeler', path: '/gestionnaire/to-call' },
          { icon: ShoppingCart, label: 'Commandes validées', path: '/gestionnaire/validated' },
          { icon: Truck, label: 'Livraisons', path: '/gestionnaire/deliveries' },
          { icon: Database, label: 'Base Clients', path: '/gestionnaire/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/gestionnaire/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/gestionnaire/stats' },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/stock' },
          { icon: Truck, label: 'Tournées', path: '/stock/tournees' },
          { icon: Package, label: 'Produits', path: '/stock/products' },
          { icon: History, label: 'Mouvements', path: '/stock/movements' },
          { icon: Database, label: 'Base Clients', path: '/stock/database' },
        ];
      case 'APPELANT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/appelant' },
          { icon: Phone, label: 'À appeler', path: '/appelant/orders' },
          { icon: CheckCircle, label: 'Mes commandes traitées', path: '/appelant/processed' },
          { icon: Database, label: 'Base Clients', path: '/appelant/database' },
          { icon: BarChart3, label: 'Mes statistiques', path: '/appelant/stats' },
        ];
      case 'LIVREUR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/livreur' },
          { icon: Package, label: 'Mes livraisons', path: '/livreur/deliveries' },
          { icon: BarChart3, label: 'Mes statistiques', path: '/livreur/stats' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-600">GS Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'ADMIN' && 'Administration'}
            {user?.role === 'GESTIONNAIRE' && 'Gestion'}
            {user?.role === 'GESTIONNAIRE_STOCK' && 'Gestion de Stock'}
            {user?.role === 'APPELANT' && 'Appels'}
            {user?.role === 'LIVREUR' && 'Livraisons'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

