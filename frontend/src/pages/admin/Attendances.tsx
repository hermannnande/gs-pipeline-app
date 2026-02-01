import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, MapPin, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, usersApi } from '@/lib/api';
import { PageHeader, LoadingState, EmptyState } from '@/components/UIComponents';

type AttendanceRow = {
  id: number;
  date: string;
  heureArrivee: string;
  heureDepart?: string | null;
  distanceArrivee?: number | null;
  distanceDepart?: number | null;
  validation?: string | null;
  validee?: boolean;
  user: { id: number; nom: string; prenom: string; role: string };
};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleDateString('fr-FR');
}

function formatStatus(a: AttendanceRow) {
  if (a.validation === 'RETARD') return 'RETARD';
  if (a.heureDepart) return 'PARTI';
  return 'PRÉSENT';
}

function statusBadgeClass(status: string) {
  if (status === 'RETARD') return 'badge badge-warning';
  if (status === 'PARTI') return 'badge badge-primary';
  return 'badge badge-success';
}

export default function Attendances() {
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [userId, setUserId] = useState<string>(''); // tous
  const [page, setPage] = useState<number>(1);
  const limit = 30;

  const { data: usersData } = useQuery({
    queryKey: ['admin-attendance-users'],
    queryFn: () => usersApi.getAll({ actif: true }),
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-attendance-history', date, userId, page],
    queryFn: async () => {
      const params: any = { page, limit };
      if (date) params.date = date;
      if (userId) params.userId = userId;
      const res = await api.get('/attendance/history', { params });
      return res.data as {
        attendances: AttendanceRow[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });

  const users = useMemo(() => {
    const list = usersData?.users || [];
    return list
      .slice()
      .sort((a: any, b: any) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));
  }, [usersData?.users]);

  const attendances = data?.attendances || [];
  const pagination = data?.pagination;

  const handleExportCsv = () => {
    try {
      const header = [
        'Date',
        'Employé',
        'Rôle',
        'Arrivée',
        'Départ',
        'Statut',
        'Distance arrivée (m)',
        'Distance départ (m)',
      ];
      const rows = attendances.map((a) => [
        formatDate(a.date),
        `${a.user?.prenom || ''} ${a.user?.nom || ''}`.trim(),
        a.user?.role || '',
        formatTime(a.heureArrivee),
        formatTime(a.heureDepart),
        formatStatus(a),
        typeof a.distanceArrivee === 'number' ? Math.round(a.distanceArrivee).toString() : '',
        typeof a.distanceDepart === 'number' ? Math.round(a.distanceDepart).toString() : '',
      ]);
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presences-${date || 'toutes'}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Erreur export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Présences (Pointage GPS)"
        subtitle="Consultation des pointages des employés (Admin uniquement)"
        icon={MapPin}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary" disabled={isFetching}>
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button onClick={handleExportCsv} className="btn btn-primary" disabled={!attendances.length}>
              <Download size={18} />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="input"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setDate(toDateInputValue(new Date()));
                  setPage(1);
                }}
              >
                Aujourd’hui
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setDate(toDateInputValue(d));
                  setPage(1);
                }}
              >
                Hier
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setDate('');
                  setPage(1);
                }}
              >
                Tout
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users size={16} />
              Employé
            </label>
            <select
              className="input"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les employés</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom} — {u.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {pagination && (
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">{pagination.total}</span> pointage(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="Chargement des présences..." />
      ) : attendances.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucun pointage"
          description="Aucun employé n’a pointé pour les filtres sélectionnés."
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Employé</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Arrivée</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Départ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Distance</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => {
                  const status = formatStatus(a);
                  return (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDate(a.date)}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {a.user?.prenom} {a.user?.nom}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="badge badge-gray">{a.user?.role}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{formatTime(a.heureArrivee)}</td>
                      <td className="py-3 px-4 text-sm">{formatTime(a.heureDepart)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={statusBadgeClass(status)}>{status}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {typeof a.distanceArrivee === 'number' ? `${Math.round(a.distanceArrivee)}m` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Page {pagination.page} / {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

