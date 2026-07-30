import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { dailyExpensesApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

const CATEGORIES = ['TRANSPORT', 'CARBURANT', 'EMBALLAGE', 'COMMUNICATION', 'DIVERS'];

const CATEGORIE_COLORS: Record<string, string> = {
  TRANSPORT: 'bg-blue-100 text-blue-800',
  CARBURANT: 'bg-orange-100 text-orange-800',
  EMBALLAGE: 'bg-purple-100 text-purple-800',
  COMMUNICATION: 'bg-cyan-100 text-cyan-800',
  DIVERS: 'bg-gray-100 text-gray-700',
};

export default function Depenses() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('DIVERS');
  const [date, setDate] = useState(today);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['daily-expenses', selectedDate],
    queryFn: () => dailyExpensesApi.list({ from: selectedDate, to: selectedDate }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { date: string; libelle: string; montant: number; categorie: string }) =>
      dailyExpensesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-expenses'] });
      setLibelle('');
      setMontant('');
      toast.success('Dépense enregistrée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erreur lors de l'enregistrement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dailyExpensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-expenses'] });
      toast.success('Dépense supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!libelle.trim()) {
      toast.error('Le libellé est requis.');
      return;
    }
    if (isNaN(m) || m <= 0) {
      toast.error('Montant invalide (> 0 attendu).');
      return;
    }
    createMutation.mutate({ date, libelle: libelle.trim(), montant: m, categorie });
  };

  const expenses = data?.expenses || [];
  const totalJour = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧾 Dépenses</h1>
          <p className="text-gray-600 mt-1">Dépenses journalières de l'entreprise</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Ajouter une dépense</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="Libellé (ex. Carburant tournée, emballages…)"
            required
            className="input md:col-span-2"
          />
          <input
            type="number"
            min="1"
            step="100"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Montant (F)"
            required
            className="input"
          />
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input flex-1" />
            <button type="submit" disabled={createMutation.isPending} className="btn btn-primary flex items-center gap-1 shrink-0">
              <Plus size={16} />
              {createMutation.isPending ? '…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>

      {/* Liste du jour */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Dépenses du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <span className="text-sm font-bold text-red-600">Total : {formatCurrency(totalJour)}</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aucune dépense enregistrée ce jour</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{e.libelle}</p>
                  <p className="text-xs text-gray-500">
                    <span className={`badge ${CATEGORIE_COLORS[e.categorie] || CATEGORIE_COLORS.DIVERS}`}>{e.categorie}</span>
                    {e.createdBy && <span className="ml-2">par {e.createdBy.prenom} {e.createdBy.nom}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className="font-bold text-gray-900">{formatCurrency(e.montant)}</span>
                  <button
                    onClick={() => deleteMutation.mutate(e.id)}
                    disabled={deleteMutation.isPending}
                    title="Supprimer"
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
