import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Headphones, ChevronLeft, ChevronRight, Search, Calendar, Users } from 'lucide-react';
import { callRecordingsApi, usersApi } from '@/lib/api';

const fmtDateTime = (at: string) => new Date(at).toLocaleString('fr-FR');
const fmtDuration = (s: number) => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`;

export default function CallRecordings() {
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  // Employés (appelants) pour le select de filtre
  const { data: usersData } = useQuery({
    queryKey: ['users', 'APPELANT'],
    queryFn: () => usersApi.getAll({ role: 'APPELANT' }),
  });
  const callers = usersData?.users || [];

  const { data, isLoading } = useQuery({
    queryKey: ['call-recordings', userId, orderId, date, page],
    queryFn: () => callRecordingsApi.list({
      userId: userId ? parseInt(userId, 10) : undefined,
      orderId: orderId ? parseInt(orderId, 10) : undefined,
      date: date || undefined,
      page,
    }),
  });

  const recordings = data?.recordings || [];
  const total = data?.total || 0;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Tout changement de filtre ramène à la page 1
  const changeFilter = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Headphones size={28} className="text-primary-600" />
            🎧 Enregistrements d'appels
          </h1>
          <p className="text-gray-600 mt-1">Écoute des appels entre appelants et clients</p>
        </div>
        <span className="text-sm text-gray-600">{total} enregistrement(s)</span>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Users size={16} /> Employé
            </label>
            <select
              value={userId}
              onChange={(e) => changeFilter(setUserId)(e.target.value)}
              className="input"
            >
              <option value="">Tous les appelants</option>
              {callers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Calendar size={16} /> Journée
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => changeFilter(setDate)(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Search size={16} /> N° commande
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ex. 1234"
              value={orderId}
              onChange={(e) => changeFilter(setOrderId)(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : recordings.length === 0 ? (
          <p className="text-center py-12 text-gray-500">Aucun enregistrement pour ces critères</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date / heure</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employé</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Commande</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Direction</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Durée</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Écouter</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((rec: any) => (
                    <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {fmtDateTime(rec.startedAt)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {rec.user ? `${rec.user.prenom} ${rec.user.nom}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {rec.order ? (
                          <>
                            <span className="font-medium">#{rec.order.id}</span>
                            <span className="text-gray-500"> · {rec.order.clientNom}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{rec.phone}</td>
                      <td className="py-3 px-4 text-sm whitespace-nowrap">
                        {rec.direction === 'INCOMING' ? '📥 Entrant' : '📤 Sortant'}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{fmtDuration(rec.durationSec)}</td>
                      <td className="py-3 px-4">
                        {rec.signedUrl ? (
                          <audio
                            controls
                            preload="none"
                            src={rec.signedUrl}
                            className="h-9 w-52 max-w-[220px]"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">Lien indisponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Page {page} / {totalPages} · {total} enregistrement(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
