import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, ExternalLink } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { PageHeader } from '@/components/UIComponents';

/**
 * Rapport anti-fraude GPS — refus & absences au rendez-vous.
 * Compare la position GPS du livreur (obligatoire au marquage) avec l'adresse
 * du client (géocodage approximatif au centre de la commune/ville).
 * Seuils volontairement larges : <= 3 km OK · 3-8 km à vérifier · > 8 km suspect.
 */

type Flag = 'OK' | 'A_VERIFIER' | 'SUSPECT' | 'SANS_PREUVE' | 'NON_GEOCODE';

interface FraudRow {
  id: number;
  orderReference: string;
  clientNom: string;
  clientVille: string;
  clientCommune: string | null;
  clientAdresse: string | null;
  status: string;
  noteLivreur: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracy: number | null;
  gpsAt: string | null;
  dateMarquage: string;
  livreur: string;
  livreurId: number | null;
  flag: Flag;
  distanceKm: number | null;
  zone: string | null;
}

const FLAG_META: Record<Flag, { label: string; cls: string; icon: any }> = {
  OK: { label: 'Sur place', cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  A_VERIFIER: { label: 'À vérifier', cls: 'bg-amber-100 text-amber-800', icon: HelpCircle },
  SUSPECT: { label: 'Suspect', cls: 'bg-red-100 text-red-800', icon: AlertTriangle },
  SANS_PREUVE: { label: 'Sans preuve GPS', cls: 'bg-red-100 text-red-800', icon: ShieldAlert },
  NON_GEOCODE: { label: 'Adresse hors référentiel', cls: 'bg-gray-100 text-gray-700', icon: HelpCircle },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function GpsFraudReport() {
  const [days, setDays] = useState(30);
  const [filter, setFilter] = useState<'TOUS' | Flag>('TOUS');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['gps-fraud-report', days],
    queryFn: () => ordersApi.gpsFraudReport(days),
  });

  const rows: FraudRow[] = data?.rows || [];
  const summary = data?.summary;
  const parLivreur: any[] = data?.parLivreur || [];
  const filtered = filter === 'TOUS' ? rows : rows.filter((r) => r.flag === filter);

  const filters: { key: 'TOUS' | Flag; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
    { key: 'SUSPECT', label: '🔴 Suspects' },
    { key: 'A_VERIFIER', label: '🟠 À vérifier' },
    { key: 'SANS_PREUVE', label: '⛔ Sans preuve' },
    { key: 'NON_GEOCODE', label: '❔ Hors référentiel' },
    { key: 'OK', label: '🟢 Sur place' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="🚨 Anti-fraude GPS — Refus & absences"
        subtitle="Vérifiez que les livreurs étaient réellement sur les lieux du client lors des marquages « refusé » / « absent au rendez-vous ». Distance estimée au centre de la commune (tolérance large)."
      />

      {/* Filtres période + statut */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="input w-auto">
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
                filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.key !== 'TOUS' && summary ? ` (${summary[f.key as Flag] || 0})` : ''}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary ml-auto" disabled={isFetching}>
          {isFetching ? 'Actualisation…' : '↻ Actualiser'}
        </button>
      </div>

      {/* Cartes résumé */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card"><p className="text-xs text-gray-500">Marquages analysés</p><p className="text-2xl font-bold">{summary.total}</p></div>
          <div className="card border-2 border-emerald-200"><p className="text-xs text-gray-500">🟢 Sur place (≤ 3 km)</p><p className="text-2xl font-bold text-emerald-700">{summary.OK || 0}</p></div>
          <div className="card border-2 border-amber-200"><p className="text-xs text-gray-500">🟠 À vérifier (3-8 km)</p><p className="text-2xl font-bold text-amber-700">{summary.A_VERIFIER || 0}</p></div>
          <div className="card border-2 border-red-200"><p className="text-xs text-gray-500">🔴 Suspects (&gt; 8 km)</p><p className="text-2xl font-bold text-red-700">{summary.SUSPECT || 0}</p></div>
          <div className="card border-2 border-red-300"><p className="text-xs text-gray-500">⛔ Sans preuve GPS</p><p className="text-2xl font-bold text-red-800">{summary.SANS_PREUVE || 0}</p></div>
        </div>
      )}

      {/* Synthèse par livreur */}
      {parLivreur.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Par livreur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Livreur</th>
                  <th className="py-2 pr-4">Marquages</th>
                  <th className="py-2 pr-4">🟢 Sur place</th>
                  <th className="py-2 pr-4">🟠 À vérifier</th>
                  <th className="py-2 pr-4">🔴 Suspects</th>
                  <th className="py-2">⛔ Sans preuve</th>
                </tr>
              </thead>
              <tbody>
                {parLivreur.map((l) => (
                  <tr key={l.livreur} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{l.livreur}</td>
                    <td className="py-2 pr-4">{l.total}</td>
                    <td className="py-2 pr-4 text-emerald-700 font-bold">{l.OK || 0}</td>
                    <td className="py-2 pr-4 text-amber-700 font-bold">{l.A_VERIFIER || 0}</td>
                    <td className="py-2 pr-4 text-red-700 font-bold">{l.SUSPECT || 0}</td>
                    <td className="py-2 text-red-800 font-bold">{l.SANS_PREUVE || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Détail des marquages */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Détail des marquages ({filtered.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">Aucun marquage pour ce filtre sur la période.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const meta = FLAG_META[r.flag];
              const Icon = meta.icon;
              return (
                <div key={r.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{r.orderReference?.slice(0, 8).toUpperCase()}</span>
                      <span className="font-semibold text-gray-900">{r.clientNom}</span>
                      <span className={`badge ${r.status === 'REFUSEE' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                        {r.status === 'REFUSEE' ? 'Refusé' : 'Absent RDV'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {r.clientAdresse || r.clientCommune || ''}{r.clientVille ? ` · ${r.clientVille}` : ''}
                      {r.zone ? ` — zone « ${r.zone} »` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Livreur : <strong>{r.livreur}</strong> · {fmtDate(r.dateMarquage)}
                      {r.noteLivreur ? ` · « ${r.noteLivreur} »` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.distanceKm != null && (
                      <span className="text-sm font-black text-gray-900 tabular-nums">{r.distanceKm} km</span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}>
                      <Icon size={13} /> {meta.label}
                    </span>
                    {r.gpsLat != null && r.gpsLng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${r.gpsLat},${r.gpsLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-200"
                        title={r.gpsAccuracy ? `Précision ±${Math.round(r.gpsAccuracy)} m` : 'Position du livreur'}
                      >
                        <MapPin size={13} /> Voir <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400">
        ℹ️ La distance est estimée au centre de la commune/ville du client (géocodage approximatif). Un écart &gt; 8 km est un signal fort
        à vérifier manuellement (appel client, photo, etc.) avant toute sanction. Les grandes communes peuvent créer des faux positifs 🟠.
      </p>
    </div>
  );
}
