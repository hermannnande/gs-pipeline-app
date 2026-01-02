import { ReactNode, useState } from 'react';
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
  Eye,
  Zap,
  Menu,
  X,
  DollarSign,
  Bell,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    const baseUrl = `/${user?.role?.toLowerCase()}`;
    
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Phone, label: 'À appeler', path: '/admin/to-call' },
          { icon: Calendar, label: 'RDV Programmés', path: '/admin/rdv' },
          { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
          { icon: CheckCircle, label: 'Commandes validées', path: '/admin/validated' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/admin/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/admin/express-agence' },
          { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
          { icon: Truck, label: 'Gestion des Tournées', path: '/admin/tournees' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/admin/deliveries' },
          { icon: Package, label: 'Gestion des Produits', path: '/admin/products' },
          { icon: Warehouse, label: '🚚 Livraisons en cours', path: '/admin/livraisons-en-cours' },
          { icon: History, label: 'Historique Mouvements', path: '/admin/movements' },
          { icon: Database, label: 'Base Clients', path: '/admin/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/admin/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/admin/stats' },
          { icon: DollarSign, label: 'Comptabilité', path: '/admin/accounting' },
        ];
      case 'GESTIONNAIRE':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/gestionnaire' },
          { icon: Phone, label: 'À appeler', path: '/gestionnaire/to-call' },
          { icon: Calendar, label: 'RDV Programmés', path: '/gestionnaire/rdv' },
          { icon: ShoppingCart, label: 'Toutes les commandes', path: '/gestionnaire/all-orders' },
          { icon: CheckCircle, label: 'Commandes validées', path: '/gestionnaire/validated' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/gestionnaire/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/gestionnaire/express-agence' },
          { icon: Truck, label: 'Livraisons', path: '/gestionnaire/deliveries' },
          { icon: Users, label: 'Utilisateurs', path: '/gestionnaire/users' },
          { icon: Database, label: 'Base Clients', path: '/gestionnaire/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/gestionnaire/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/gestionnaire/stats' },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/stock' },
          { icon: Truck, label: 'Tournées', path: '/stock/tournees' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/stock/expeditions' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/stock/deliveries' },
          { icon: Package, label: 'Produits', path: '/stock/products' },
          { icon: History, label: 'Mouvements', path: '/stock/movements' },
          { icon: Database, label: 'Base Clients', path: '/stock/database' },
        ];
      case 'APPELANT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/appelant' },
          { icon: Phone, label: 'À appeler', path: '/appelant/orders' },
          { icon: Calendar, label: 'RDV Programmés', path: '/appelant/rdv' },
          { icon: ShoppingCart, label: 'Toutes les commandes', path: '/appelant/all-orders' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/appelant/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/appelant/express-agence' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/appelant/deliveries' },
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
      {/* Mobile Header with Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <h1 className="text-xl font-bold text-primary-600">GS Pipeline</h1>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block fixed top-0 right-0 left-64 h-16 bg-white border-b border-gray-200 z-20">
        <div className="h-full px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Bienvenue, {user?.prenom} !
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <NotificationCenter />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">GS Pipeline</h1>
              <p className="text-sm text-gray-500 mt-1">
                {user?.role === 'ADMIN' && 'Administration'}
                {user?.role === 'GESTIONNAIRE' && 'Gestion'}
                {user?.role === 'GESTIONNAIRE_STOCK' && 'Gestion de Stock'}
                {user?.role === 'APPELANT' && 'Appels'}
                {user?.role === 'LIVREUR' && 'Livraisons'}
              </p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
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
      <main className="pt-16 lg:pt-16 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

