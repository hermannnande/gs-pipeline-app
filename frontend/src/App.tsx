import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import GestionnaireDashboard from './pages/gestionnaire/Dashboard';
import StockDashboard from './pages/stock/Dashboard';
import AppelantDashboard from './pages/appelant/Dashboard';
import LivreurDashboard from './pages/livreur/Dashboard';
import Layout from './components/Layout';

function App() {
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

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route
          path="/*"
          element={
            isAuthenticated ? (
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
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

