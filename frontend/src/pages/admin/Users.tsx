import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

export default function Users() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur désactivé avec succès');
    },
  });

  const handleDelete = (id: number, nom: string) => {
    if (confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur ${nom} ?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">Gestion des comptes utilisateurs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['ADMIN', 'GESTIONNAIRE', 'APPELANT', 'LIVREUR'].map(role => {
          const count = usersData?.users?.filter((u: User) => u.role === role && u.actif).length || 0;
          return (
            <div key={role} className="card">
              <p className="text-sm text-gray-600">{role}</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Liste des utilisateurs */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users?.map((user: User) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">
                      {user.prenom} {user.nom}
                    </td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.telephone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-primary-100 text-primary-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${user.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.actif ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, `${user.prenom} ${user.nom}`)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Désactiver"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création (simplifié) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Créer un utilisateur</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createMutation.mutate({
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                nom: formData.get('nom') as string,
                prenom: formData.get('prenom') as string,
                telephone: formData.get('telephone') as string,
                role: formData.get('role') as any,
              });
            }}>
              <div className="space-y-4">
                <input name="prenom" placeholder="Prénom" className="input" required />
                <input name="nom" placeholder="Nom" className="input" required />
                <input name="email" type="email" placeholder="Email" className="input" required />
                <input name="telephone" placeholder="Téléphone" className="input" />
                <select name="role" className="input" required>
                  <option value="">Sélectionner un rôle</option>
                  <option value="ADMIN">Admin</option>
                  <option value="GESTIONNAIRE">Gestionnaire</option>
                  <option value="APPELANT">Appelant</option>
                  <option value="LIVREUR">Livreur</option>
                </select>
                <input name="password" type="password" placeholder="Mot de passe" className="input" required />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="btn btn-primary flex-1">Créer</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




