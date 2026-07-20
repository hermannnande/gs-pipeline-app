import { ReactNode, useState, useEffect } from 'react';
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
  MessageSquare,
  PieChart,
  MapPin,
  MessageCircle,
  FileText,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api, getActiveCompanyId, setActiveCompanyId } from '@/lib/api';
import NotificationCenter from './NotificationCenter';

interface Company { id: number; nom: string; slug: string; }

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

const ROLE_SUBTITLES: Record<string, string> = {
  ADMIN: 'Administration',
  GESTIONNAIRE: 'Gestion',
  GESTIONNAIRE_STOCK: 'Gestion de Stock',
  APPELANT: 'Appels',
  LIVREUR: 'Livraisons',
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<number>(getActiveCompanyId() || user?.companyId || 1);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/auth/companies').then(res => setCompanies(res.data.companies || [])).catch(() => {});
    }
  }, [user?.role]);

  // Ferme le drawer mobile a chaque changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleCompanySwitch = (companyId: number) => {
    setActiveCompany(companyId);
    setActiveCompanyId(companyId);
    window.location.reload();
  };

  const currentCompany = companies.find(c => c.id === activeCompany);
  const companyLabel = currentCompany ? currentCompany.nom : (activeCompany === 2 ? 'GS Pipeline BF' : 'GS Pipeline');

  // Chat et notifications désactivés pour le moment
  const totalUnread = 0;

  const getNavigationSections = (): NavSection[] => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Pilotage',
            items: [
              { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
              { icon: BarChart3, label: 'Statistiques', path: '/admin/stats' },
              { icon: PieChart, label: '📊 Analyse Produits', path: '/admin/product-analytics' },
              { icon: DollarSign, label: 'Comptabilité', path: '/admin/accounting' },
            ],
          },
          {
            title: 'Commandes',
            items: [
              { icon: Phone, label: 'À appeler', path: '/admin/to-call' },
              { icon: Calendar, label: 'RDV Programmés', path: '/admin/rdv' },
              { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
              { icon: CheckCircle, label: 'Commandes validées', path: '/admin/validated' },
              { icon: Zap, label: 'Expéditions & EXPRESS', path: '/admin/expeditions' },
              { icon: Bell, label: 'EXPRESS - En agence', path: '/admin/express-agence' },
              { icon: DollarSign, label: '📘 Ventes digitales (ebook)', path: '/admin/ventes-digitales' },
            ],
          },
          {
            title: 'Terrain',
            items: [
              { icon: MapPin, label: 'Présences (GPS)', path: '/admin/presences' },
              { icon: Truck, label: 'Gestion des Tournées', path: '/admin/tournees' },
              { icon: TrendingUp, label: 'Listes de livraison', path: '/admin/deliveries' },
              { icon: Package, label: 'Gestion des Produits', path: '/admin/products' },
              { icon: History, label: 'Historique Mouvements', path: '/admin/movements' },
              { icon: Warehouse, label: '🚚 Livraisons en cours', path: '/admin/livraisons-en-cours' },
              { icon: Database, label: 'Base Clients', path: '/admin/database' },
            ],
          },
          {
            title: 'Communication',
            items: [
              { icon: MessageSquare, label: 'Chat', path: '/admin/chat' },
              { icon: MessageSquare, label: 'Supervision Chat', path: '/admin/chat-supervision' },
              { icon: Eye, label: 'Supervision Appelants', path: '/admin/supervision' },
              { icon: MessageCircle, label: 'WhatsApp Agent', path: '/admin/whatsapp' },
              { icon: MessageCircle, label: 'Confirmation WhatsApp', path: '/admin/whatsapp-confirmation' },
            ],
          },
          {
            title: 'Système',
            items: [
              { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
              { icon: Eye, label: 'Audit & Sécurité', path: '/admin/audit' },
              { icon: FileText, label: 'Pages de vente', path: '/admin/templates' },
              { icon: TrendingUp, label: 'Analytics Landing', path: '/admin/landing-analytics' },
            ],
          },
        ];
      case 'GESTIONNAIRE':
        return [
          {
            title: null,
            items: [
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
              { icon: Eye, label: 'Supervision Appelants', path: '/gestionnaire/supervision' },
              { icon: BarChart3, label: 'Statistiques', path: '/gestionnaire/stats' },
            ],
          },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          {
            title: null,
            items: [
              { icon: MessageSquare, label: 'Chat', path: '/stock/chat', badge: totalUnread > 0 ? totalUnread : undefined },
              { icon: LayoutDashboard, label: 'Dashboard', path: '/stock' },
              { icon: Truck, label: 'Tournées', path: '/stock/tournees' },
              { icon: Zap, label: 'Expéditions & EXPRESS', path: '/stock/expeditions' },
              { icon: TrendingUp, label: 'Listes de livraison', path: '/stock/deliveries' },
              { icon: Package, label: 'Produits', path: '/stock/products' },
              { icon: History, label: 'Mouvements', path: '/stock/movements' },
            ],
          },
        ];
      case 'APPELANT':
        return [
          {
            title: null,
            items: [
              { icon: MessageSquare, label: 'Chat', path: '/appelant/chat', badge: totalUnread > 0 ? totalUnread : undefined },
              { icon: LayoutDashboard, label: 'Dashboard', path: '/appelant' },
              { icon: Phone, label: 'À appeler', path: '/appelant/orders' },
              { icon: Calendar, label: 'RDV Programmés', path: '/appelant/rdv' },
              { icon: ShoppingCart, label: 'Toutes les commandes', path: '/appelant/all-orders' },
              { icon: Zap, label: 'Expéditions & EXPRESS', path: '/appelant/expeditions' },
              { icon: Bell, label: 'EXPRESS - En agence', path: '/appelant/express-agence' },
              { icon: TrendingUp, label: 'Listes de livraison', path: '/appelant/deliveries' },
              { icon: CheckCircle, label: 'Mes commandes traitées', path: '/appelant/processed' },
              { icon: BarChart3, label: 'Mes statistiques', path: '/appelant/stats' },
            ],
          },
        ];
      case 'LIVREUR':
        return [
          {
            title: null,
            items: [
              { icon: MessageSquare, label: 'Chat', path: '/livreur/chat', badge: totalUnread > 0 ? totalUnread : undefined },
              { icon: LayoutDashboard, label: 'Dashboard', path: '/livreur' },
              { icon: Package, label: 'Mes livraisons', path: '/livreur/deliveries' },
              { icon: BarChart3, label: 'Mes statistiques', path: '/livreur/stats' },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const navigationSections = getNavigationSections();
  const flatNavItems = navigationSections.flatMap(s => s.items);

  // Onglets de la bottom tab bar mobile (5 max, le dernier ouvre le drawer)
  const getBottomTabs = (): NavItem[] => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Phone, label: 'À appeler', path: '/admin/to-call' },
          { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
          { icon: Truck, label: 'Tournées', path: '/admin/tournees' },
        ];
      case 'GESTIONNAIRE':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/gestionnaire' },
          { icon: Phone, label: 'À appeler', path: '/gestionnaire/to-call' },
          { icon: ShoppingCart, label: 'Commandes', path: '/gestionnaire/all-orders' },
          { icon: MessageSquare, label: 'Chat', path: '/gestionnaire/chat' },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/stock' },
          { icon: Truck, label: 'Tournées', path: '/stock/tournees' },
          { icon: TrendingUp, label: 'Livraisons', path: '/stock/deliveries' },
          { icon: MessageSquare, label: 'Chat', path: '/stock/chat' },
        ];
      case 'APPELANT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/appelant' },
          { icon: Phone, label: 'À appeler', path: '/appelant/orders' },
          { icon: Calendar, label: 'RDV', path: '/appelant/rdv' },
          { icon: CheckCircle, label: 'Traitées', path: '/appelant/processed' },
        ];
      case 'LIVREUR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/livreur' },
          { icon: Package, label: 'Livraisons', path: '/livreur/deliveries' },
          { icon: BarChart3, label: 'Stats', path: '/livreur/stats' },
          { icon: MessageSquare, label: 'Chat', path: '/livreur/chat' },
        ];
      default:
        return [];
    }
  };

  const bottomTabs = getBottomTabs();
  const currentPageLabel =
    flatNavItems.find(item => item.path === location.pathname)?.label?.replace(/^[^\p{L}]+/u, '') ||
    companyLabel;

  const renderCompanySelect = (variant: 'light' | 'navy') => {
    if (user?.role !== 'ADMIN' || companies.length <= 1) return null;
    return (
      <select
        value={activeCompany}
        onChange={e => handleCompanySwitch(Number(e.target.value))}
        className={
          variant === 'navy'
            ? 'w-full text-xs font-semibold bg-white/5 text-white/80 border border-white/10 rounded-lg px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 [&>option]:text-gray-900'
            : 'text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300'
        }
      >
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.nom}</option>
        ))}
      </select>
    );
  };

  const renderNavItems = () => (
    <nav className="flex-1 px-3 pb-4 overflow-y-auto scrollbar-navy">
      {navigationSections.map((section, idx) => (
        <div key={section.title || `section-${idx}`}>
          {section.title && (
            <p className={`nav-section-label ${idx === 0 ? '!pt-3' : ''}`}>{section.title}</p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isChatLink = item.path?.endsWith('/chat');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white shadow-nav-active font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                  }`}
                >
                  <Icon
                    size={19}
                    className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}
                  />
                  <span className="flex-1 text-sm truncate">{item.label}</span>
                  {isChatLink && totalUnread > 0 && (
                    <span className="bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-danger-500/50 animate-pulse">
                      {totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const renderSidebarHeader = (showClose: boolean) => (
    <div className="p-5 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center shadow-glow-primary">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white font-display truncate">{companyLabel}</h1>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
              {ROLE_SUBTITLES[user?.role || ''] || 'Back-office'}
            </p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="mt-4 lg:hidden">{renderCompanySelect('navy')}</div>
    </div>
  );

  const renderSidebarFooter = () => (
    <div className="p-4 border-t border-white/5">
      <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/5">
        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white/50 hover:text-white hover:bg-danger-500/90 rounded-xl transition-all duration-200 font-medium active:scale-95 text-sm"
      >
        <LogOut size={18} />
        <span>Déconnexion</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F5FB]">
      {/* ============ Sidebar desktop (navy) ============ */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: 'linear-gradient(180deg, #0C0A1D 0%, #14112E 100%)' }}
      >
        {renderSidebarHeader(false)}
        {renderNavItems()}
        {renderSidebarFooter()}
      </aside>

      {/* ============ Top app bar mobile ============ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-effect border-b border-gray-200/60 backdrop-blur-xl flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center shadow-glow-primary">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest truncate">{companyLabel}</p>
            <h1 className="text-sm font-bold text-gray-900 font-display truncate leading-tight">{currentPageLabel}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationCenter />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ============ Drawer mobile + overlay ============ */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-72 flex flex-col z-50 ${
          isMobileMenuOpen ? 'animate-slide-in-right' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #0C0A1D 0%, #14112E 100%)' }}
      >
        {isMobileMenuOpen && (
          <>
            {renderSidebarHeader(true)}
            {renderNavItems()}
            {renderSidebarFooter()}
          </>
        )}
      </aside>

      {/* ============ Topbar desktop ============ */}
      <div className="hidden lg:block fixed top-0 right-0 left-64 h-16 glass-effect border-b border-gray-200/60 backdrop-blur-xl z-20">
        <div className="h-full px-8 flex items-center justify-between gap-6">
          {/* Barre de recherche decorative (style command palette) */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2.5 bg-gray-100/80 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-full px-4 py-2.5 transition-all duration-200 cursor-text">
              <Search size={16} className="text-gray-400" />
              <span className="flex-1 text-sm text-gray-400 select-none">
                Rechercher (ex : client, commande, produit...)
              </span>
              <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderCompanySelect('light')}
            <NotificationCenter />
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary-500/20">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Contenu principal ============ */}
      <main className="pt-20 lg:pt-24 lg:ml-64 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div key={location.pathname} className="animate-fade-up max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* ============ Bottom tab bar mobile ============ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95"
              >
                <span
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white shadow-nav-active'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95"
            aria-label="Plus d'options"
          >
            <span
              className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${
                isMobileMenuOpen ? 'bg-gradient-to-br from-primary-500 to-purple-500 text-white shadow-nav-active' : 'text-gray-400'
              }`}
            >
              <Menu size={18} strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
            </span>
            <span className={`text-[10px] font-medium leading-none ${isMobileMenuOpen ? 'text-primary-600' : 'text-gray-400'}`}>
              Plus
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
