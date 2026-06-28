/**
 * Page-liste AUTONOME (hors back-office obgestion) des commandes Bouilloire
 * Intelligente. Accessible par lien public SANS COMPTE.
 * URL servie par le VPS : https://obrille.com/bouilloire-commandes
 *
 * Fonctions : voir les commandes (paginées 100/page) + changer leur statut
 * (Valider / En livraison / Livré / Annuler). N'importe qui avec le lien peut agir.
 * API publique whitelistée : routes/public.routes.js (PUBLIC_ORDER_PRODUCT_CODES / STATUSES).
 * noindex pour éviter l'indexation Google.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const PRODUCT_CODE = 'BOUILLOIRE_INTELLIGENTE';
const TITLE = 'Commandes — Bouilloire Intelligente';
const PER_PAGE = 100;

interface OrderRow {
  id: number;
  orderReference: string;
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  clientCommune?: string | null;
  clientAdresse?: string | null;
  quantite: number;
  montant: number;
  status: string;
  createdAt: string;
  produitNom: string;
}

const STATUS_LABELS: Record<string, string> = {
  NOUVELLE: 'Nouvelle', A_APPELER: 'À appeler', VALIDEE: 'Validée', INJOIGNABLE: 'Injoignable',
  ANNULEE: 'Annulée', EN_ATTENTE_PAIEMENT: 'Attente paiement', ASSIGNEE: 'En livraison',
  LIVREE: 'Livré', LIVREE_PARTIELLE: 'Livrée partielle', REFUSEE: 'Refusée', RETOURNE: 'Retourné',
};
const STATUS_CLASSES: Record<string, string> = {
  NOUVELLE: 'bg-blue-100 text-blue-700', A_APPELER: 'bg-amber-100 text-amber-700',
  VALIDEE: 'bg-green-100 text-green-700', INJOIGNABLE: 'bg-gray-200 text-gray-700',
  ANNULEE: 'bg-red-100 text-red-700', ASSIGNEE: 'bg-indigo-100 text-indigo-700',
  LIVREE: 'bg-emerald-100 text-emerald-700',
};

// Boutons d'action (les 4 statuts modifiables depuis le lien public).
const ACTIONS: { status: string; label: string; on: string; off: string }[] = [
  { status: 'VALIDEE', label: '✓ Valider', on: 'bg-green-600 text-white', off: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { status: 'ASSIGNEE', label: '🚚 En livraison', on: 'bg-indigo-600 text-white', off: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  { status: 'LIVREE', label: '📦 Livré', on: 'bg-emerald-600 text-white', off: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { status: 'ANNULEE', label: '✕ Annuler', on: 'bg-red-600 text-white', off: 'bg-red-50 text-red-700 hover:bg-red-100' },
];

const fmtMoney = (n: number) => `${Number(n || 0).toLocaleString('fr-FR').replace(/ |,/g, ' ')} F`;
const fmtDate = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function BouilloireOrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/public/product-orders?code=${PRODUCT_CODE}&page=${page}&limit=${PER_PAGE}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setByStatus(data.byStatus || {});
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    document.title = TITLE;
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const changeStatus = async (id: number, status: string) => {
    const prev = orders.find((o) => o.id === id)?.status;
    if (prev === status) return;
    setUpdating(id);
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o))); // optimiste
    try {
      const res = await fetch(`${API_URL}/public/product-orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: PRODUCT_CODE, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Erreur ${res.status}`);
      // recharge les compteurs en arrière-plan
      load();
    } catch (e: any) {
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: prev || o.status } : o))); // revert
      alert('Échec du changement de statut : ' + (e?.message || ''));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.clientNom?.toLowerCase().includes(q) || o.clientTelephone?.includes(q) ||
      o.clientVille?.toLowerCase().includes(q) || o.orderReference?.toLowerCase().includes(q));
  }, [orders, search]);

  function ActionButtons({ o }: { o: OrderRow }) {
    return (
      <div className="flex flex-wrap gap-1">
        {ACTIONS.map((a) => (
          <button
            key={a.status}
            onClick={() => changeStatus(o.id, a.status)}
            disabled={updating === o.id}
            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition disabled:opacity-50 ${o.status === a.status ? a.on : a.off}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 sm:text-2xl">🫖 {TITLE}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} commande(s) · page {page}/{totalPages}
              {lastUpdate && <> · maj {lastUpdate.toLocaleTimeString('fr-FR')}</>}
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="self-start rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60 sm:self-auto">
            {loading ? 'Actualisation…' : '↻ Actualiser'}
          </button>
        </header>

        {/* Compteurs */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">{byStatus.VALIDEE || 0} validées</span>
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700">{byStatus.ASSIGNEE || 0} en livraison</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{byStatus.LIVREE || 0} livrées</span>
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">{byStatus.ANNULEE || 0} annulées</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">{byStatus.NOUVELLE || 0} nouvelles</span>
        </div>

        <div className="mb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans cette page : nom, téléphone, ville…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} <button onClick={load} className="font-bold underline">Réessayer</button>
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Aucune commande.</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Téléphone</th>
                    <th className="px-3 py-3">Ville</th>
                    <th className="px-3 py-3 text-center">Qté</th>
                    <th className="px-3 py-3 text-right">Montant</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Changer le statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900">{o.clientNom}</td>
                      <td className="whitespace-nowrap px-3 py-3"><a href={`tel:${o.clientTelephone}`} className="font-medium text-teal-700 hover:underline">{o.clientTelephone}</a></td>
                      <td className="px-3 py-3 text-gray-700">{o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}</td>
                      <td className="px-3 py-3 text-center font-semibold">{o.quantite}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-gray-900">{fmtMoney(o.montant)}</td>
                      <td className="px-3 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                      <td className="px-3 py-3"><ActionButtons o={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablette : cartes */}
            <div className="space-y-3 lg:hidden">
              {filtered.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{o.clientNom}</p>
                      <a href={`tel:${o.clientTelephone}`} className="text-sm font-medium text-teal-700">{o.clientTelephone}</a>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[o.status] || o.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-gray-600">
                    <span>📍 {o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}</span>
                    <span className="text-right">Qté : <b>{o.quantite}</b></span>
                    <span className="text-gray-400">{fmtDate(o.createdAt)}</span>
                    <span className="text-right font-bold text-gray-900">{fmtMoney(o.montant)}</span>
                  </div>
                  <div className="mt-3"><ActionButtons o={o} /></div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40">‹ Préc.</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40">Suiv. ›</button>
                </div>
              </div>
            )}
          </>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">Bouilloire Intelligente · accès par lien</p>
      </div>
    </div>
  );
}
