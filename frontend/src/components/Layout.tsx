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
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import NotificationCenter from './NotificationCenter';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/chatApi';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Badge messages non lus (simple) - on récupère les conversations et on somme unreadCount
  const { data: chatConvData } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: chatApi.getConversations,
    enabled: !!user,
    refetchInterval: 30000
  });

  const totalUnread =
    chatConvData?.conversations?.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0) || 0;

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
          { icon: MessageSquare, label: 'Chat', path: '/admin/chat' },
          { icon: MessageSquare, label: 'Supervision Chat', path: '/admin/chat-supervision' },
        ];
      case 'GESTIONNAIRE':
        return [
          { icon: MessageSquare, label: 'Chat', path: '/gestionnaire/chat', badge: totalUnread > 0 ? totalUnread : undefined },
          { icon: LayoutDashboard, label: 'Dashboard', path: '/gestionnaire' },
          { icon: Phone, label: 'À appeler', path: '/gestionnaire/to-call' },
          { icon: Calendar, label: 'RDV Programmés', path: '/gestionnaire/rdv' },
          { icon: ShoppingCart, label: 'Toutes les commandes', path: '/gestionnaire/all-orders' },
          { icon: CheckCircle, label: 'Commandes validées', path: '/gestionnaire/validated' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/gestionnaire/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/gestionnaire/express-agence' },
          { icon: Warehouse, label: '🚚 Livraisons en cours', path: '/gestionnaire/livraisons-en-cours' },
          { icon: Truck, label: 'Livraisons', path: '/gestionnaire/deliveries' },
          { icon: Users, label: 'Utilisateurs', path: '/gestionnaire/users' },
          { icon: Database, label: 'Base Clients', path: '/gestionnaire/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/gestionnaire/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/gestionnaire/stats' },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          { icon: MessageSquare, label: 'Chat', path: '/stock/chat', badge: totalUnread > 0 ? totalUnread : undefined },
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
          { icon: MessageSquare, label: 'Chat', path: '/appelant/chat', badge: totalUnread > 0 ? totalUnread : undefined },
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
          { icon: MessageSquare, label: 'Chat', path: '/livreur/chat', badge: totalUnread > 0 ? totalUnread : undefined },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile Header with Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-effect border-b border-white/20 backdrop-blur-xl flex items-center justify-between px-4 z-30 shadow-soft">
        <h1 className="text-xl font-bold gradient-text font-display">GS Pipeline</h1>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block fixed top-0 right-0 left-64 h-16 glass-effect border-b border-white/20 backdrop-blur-xl z-20 shadow-soft">
        <div className="h-full px-8 flex items-center justify-between">
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 font-display">
              Bienvenue, {user?.prenom} ! 👋
            </h2>
            <p className="text-sm text-gray-500 font-medium">
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
        fixed left-0 top-0 h-full w-64 glass-effect backdrop-blur-xl border-r border-white/20 flex flex-col z-50 transition-all duration-300 shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text font-display">GS Pipeline</h1>
              <p className="text-xs font-semibold text-gray-500 mt-1.5 uppercase tracking-wide">
                {user?.role === 'ADMIN' && '✨ Administration'}
                {user?.role === 'GESTIONNAIRE' && '🎯 Gestion'}
                {user?.role === 'GESTIONNAIRE_STOCK' && '📦 Gestion de Stock'}
                {user?.role === 'APPELANT' && '📞 Appels'}
                {user?.role === 'LIVREUR' && '🚚 Livraisons'}
              </p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isChatLink = item.path?.endsWith('/chat');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 font-medium'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:translate-x-1'
                }`}
              >
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="flex-1 text-sm">{item.label}</span>
                {isChatLink && totalUnread > 0 && (
                  <span className="bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-danger-500/50 animate-pulse">
                    {totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-transparent">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 text-sm">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-danger-600 hover:text-white hover:bg-gradient-to-r hover:from-danger-500 hover:to-danger-600 rounded-xl transition-all duration-200 font-medium hover:shadow-lg hover:shadow-danger-500/30 active:scale-95"
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

