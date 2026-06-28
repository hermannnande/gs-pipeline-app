/**
 * Page-liste AUTONOME (hors back-office obgestion) des commandes Bouilloire
 * Intelligente. Accessible par lien public, en LECTURE SEULE.
 * URL servie par le VPS : https://obrille.com/bouilloire-commandes
 *
 * Sécurité : lien simple (pas de clé). On ajoute `noindex` pour éviter
 * l'indexation par les moteurs de recherche. L'API publique ne sert que les
 * produits whitelistés (cf. routes/public.routes.js -> PUBLIC_ORDER_PRODUCT_CODES).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const PRODUCT_CODE = 'BOUILLOIRE_INTELLIGENTE';
const TITLE = 'Commandes — Bouilloire Intelligente';

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
  NOUVELLE: 'Nouvelle',
  A_APPELER: 'À appeler',
  VALIDEE: 'Validée',
  INJOIGNABLE: 'Injoignable',
  ANNULEE: 'Annulée',
  EN_ATTENTE_PAIEMENT: 'Attente paiement',
  ASSIGNEE: 'Assignée',
  LIVREE: 'Livrée',
  RETOURNEE: 'Retournée',
};

const STATUS_CLASSES: Record<string, string> = {
  NOUVELLE: 'bg-blue-100 text-blue-700',
  A_APPELER: 'bg-amber-100 text-amber-700',
  VALIDEE: 'bg-green-100 text-green-700',
  INJOIGNABLE: 'bg-gray-200 text-gray-700',
  ANNULEE: 'bg-red-100 text-red-700',
  EN_ATTENTE_PAIEMENT: 'bg-purple-100 text-purple-700',
  ASSIGNEE: 'bg-indigo-100 text-indigo-700',
  LIVREE: 'bg-emerald-100 text-emerald-700',
  RETOURNEE: 'bg-orange-100 text-orange-700',
};

const fmtMoney = (n: number) =>
  `${Number(n || 0).toLocaleString('fr-FR').replace(/ |,/g, ' ')} F`;

const fmtDate = (s: string) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function BouilloireOrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/product-orders?code=${PRODUCT_CODE}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = TITLE;
    // noindex : page privée par lien, on évite l'indexation Google.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // rafraîchit toutes les 60s
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.clientNom?.toLowerCase().includes(q) ||
        o.clientTelephone?.includes(q) ||
        o.clientVille?.toLowerCase().includes(q) ||
        o.orderReference?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const totalMontant = useMemo(
    () => filtered.reduce((s, o) => s + (Number(o.montant) || 0), 0),
    [filtered],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 sm:text-2xl">🫖 {TITLE}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {loading ? 'Chargement…' : `${filtered.length} commande(s)`} ·{' '}
              Total {fmtMoney(totalMontant)}
              {lastUpdate && (
                <> · Mis à jour {lastUpdate.toLocaleTimeString('fr-FR')}</>
              )}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="self-start rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60 sm:self-auto"
          >
            {loading ? 'Actualisation…' : '↻ Actualiser'}
          </button>
        </header>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher : nom, téléphone, ville, référence…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error} <button onClick={load} className="font-bold underline">Réessayer</button>
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
            Chargement des commandes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
            Aucune commande pour le moment.
          </div>
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Ville</th>
                    <th className="px-4 py-3 text-center">Qté</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.orderReference}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{o.clientNom}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a href={`tel:${o.clientTelephone}`} className="font-medium text-teal-700 hover:underline">
                          {o.clientTelephone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{o.quantite}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-gray-900">{fmtMoney(o.montant)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className="space-y-3 md:hidden">
              {filtered.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{o.clientNom}</p>
                      <a href={`tel:${o.clientTelephone}`} className="text-sm font-medium text-teal-700">
                        {o.clientTelephone}
                      </a>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-gray-600">
                    <span>📍 {o.clientVille}{o.clientCommune ? ` · ${o.clientCommune}` : ''}</span>
                    <span className="text-right">Qté : <b>{o.quantite}</b></span>
                    <span className="text-gray-400">{fmtDate(o.createdAt)}</span>
                    <span className="text-right font-bold text-gray-900">{fmtMoney(o.montant)}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-gray-400">{o.orderReference}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Page en lecture seule · Bouilloire Intelligente
        </p>
      </div>
    </div>
  );
}
