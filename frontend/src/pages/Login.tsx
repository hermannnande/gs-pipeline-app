import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GS Pipeline</h1>
          <p className="text-gray-600">Back-office de gestion des commandes</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="votre@email.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-2">Comptes de test :</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>• <strong>Admin:</strong> admin@gs-pipeline.com / admin123</p>
              <p>• <strong>Gestionnaire:</strong> gestionnaire@gs-pipeline.com / gestionnaire123</p>
              <p>• <strong>Appelant:</strong> appelant@gs-pipeline.com / appelant123</p>
              <p>• <strong>Livreur:</strong> livreur@gs-pipeline.com / livreur123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

