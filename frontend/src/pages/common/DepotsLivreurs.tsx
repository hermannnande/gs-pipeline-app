import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Calendar } from 'lucide-react';
import DepotsPanel from '@/components/accounting/DepotsPanel';
import { accountingApi } from '@/lib/api';

// Page dédiée à la vérification des dépôts de fin de journée des livreurs.
// Accessible au gestionnaire principal (et à l'admin, qui l'a aussi en onglet
// de la Comptabilité). Volontairement limitée aux dépôts : ni CA, ni marge,
// ni budgets pub — l'API /accounting/deposits ne renvoie rien d'autre.

export default function DepotsLivreurs() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateDebut, setDateDebut] = useState(firstOfMonth);
  const [dateFin, setDateFin] = useState(today);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deposits-stats', dateDebut, dateFin],
    queryFn: () => accountingApi.getDeposits({ dateDebut, dateFin }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="text-emerald-600" size={28} />
          Dépôts Livreurs
        </h1>
        <p className="text-gray-600">
          Vérification des dépôts de fin de journée · cliquez sur un dépôt pour voir les clients livrés
        </p>
      </div>

      {/* Période */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-emerald-600" size={20} />
          <h2 className="text-lg font-semibold">Période</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => { setDateDebut(today); setDateFin(today); }} className="btn btn-secondary flex-1">
              Aujourd'hui
            </button>
            <button onClick={() => { setDateDebut(firstOfMonth); setDateFin(today); }} className="btn btn-primary flex-1">
              Ce mois
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : isError ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Impossible de charger les dépôts sur cette période.</p>
        </div>
      ) : (
        <DepotsPanel deposits={data?.deposits} />
      )}
    </div>
  );
}
