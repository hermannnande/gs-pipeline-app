import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LandingRouter from './pages/public/LandingRouter';
import ThankYouRouter from './pages/public/ThankYouRouter';
import { LANDING_SLUGS } from './hooks/useLandingSlug';

// Lazy : code splitting agressif. Les dashboards back-office sont charges
// uniquement quand un utilisateur s'authentifie -> les visiteurs des landings
// publiques ne telechargent QUE ce qui leur est utile (~150 KB au lieu de 2 MB).
const Login = lazy(() => import('./pages/Login'));
const Layout = lazy(() => import('./components/Layout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const GestionnaireDashboard = lazy(() => import('./pages/gestionnaire/Dashboard'));
const StockDashboard = lazy(() => import('./pages/stock/Dashboard'));
const AppelantDashboard = lazy(() => import('./pages/appelant/Dashboard'));
const LivreurDashboard = lazy(() => import('./pages/livreur/Dashboard'));
const OrderForm = lazy(() => import('./pages/public/OrderForm'));
const BouilloireOrdersList = lazy(() => import('./pages/public/BouilloireOrdersList'));
const VerrueTkLanding = lazy(() => import('./pages/public/VerrueTkLanding'));
const VerrueTkThankYou = lazy(() => import('./pages/public/VerrueTkThankYou'));

// Spinner partage par tous les Suspense boundaries.
const PageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-neutral-200 border-t-teal-600" />
  </div>
);

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              user?.role === 'ADMIN' ? <Navigate to="/admin" /> :
              user?.role === 'GESTIONNAIRE' ? <Navigate to="/gestionnaire" /> :
              user?.role === 'GESTIONNAIRE_STOCK' ? <Navigate to="/stock" /> :
              user?.role === 'APPELANT' ? <Navigate to="/appelant" /> :
              user?.role === 'LIVREUR' ? <Navigate to="/livreur" /> :
              <Navigate to="/login" />
            }
          />
          {user?.role === 'ADMIN' && (
            <Route path="/admin/*" element={<AdminDashboard />} />
          )}
          {user?.role === 'GESTIONNAIRE' && (
            <Route path="/gestionnaire/*" element={<GestionnaireDashboard />} />
          )}
          {user?.role === 'GESTIONNAIRE_STOCK' && (
            <Route path="/stock/*" element={<StockDashboard />} />
          )}
          {user?.role === 'APPELANT' && (
            <Route path="/appelant/*" element={<AppelantDashboard />} />
          )}
          {user?.role === 'LIVREUR' && (
            <Route path="/livreur/*" element={<LivreurDashboard />} />
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Pages publiques - accessibles a TOUS sans authentification */}
          <Route path="/commander" element={<OrderForm />} />
          {/* Liste autonome (lecture seule) des commandes Bouilloire, servie sur
              obrille.com via .htaccess. Hors back-office obgestion. */}
          <Route path="/bouilloire-commandes" element={<BouilloireOrdersList />} />
          <Route path="/anti-verrue" element={<VerrueTkLanding />} />
          <Route path="/anti-verrue/merci" element={<VerrueTkThankYou />} />
          <Route path="/landing/:slug" element={<LandingRouter />} />
          <Route path="/landing/:slug/merci" element={<ThankYouRouter />} />

          {/* Routes courtes (URLs propres servies par le VPS via .htaccess).
              Generees dynamiquement depuis la whitelist LANDING_SLUGS pour
              garantir qu'aucun slug ajoute ailleurs ne tombe dans le fallback
              <AuthenticatedApp /> qui redirige vers /login (back-office). */}
          {LANDING_SLUGS.flatMap((s) => [
            <Route key={s} path={`/${s}`} element={<LandingRouter />} />,
            <Route key={`${s}-merci`} path={`/${s}/merci`} element={<ThankYouRouter />} />,
          ])}

          <Route path="/login" element={<Login />} />

          {/* Pages protegees - necessitent une authentification */}
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
