/**
 * Ventes digitales (ebook « Guide Pousse Naturelle ») — page ADMIN dédiée.
 * ============================================================================
 *
 * Les achats de l'ebook sont payés via Chariow (Mobile Money / carte). Le
 * webhook /api/chariow/webhook crée une commande Order (sourcePage=CHARIOW,
 * modePaiement=CHARIOW_MOBILE_MONEY, montantPaye=total, referencePayment=sale.id).
 *
 * Le produit GUIDE_POUSSE_NATURELLE est ISOLÉ (utils/isolatedProducts.js) :
 * ces commandes n'apparaissent donc PAS dans les listes normales (À appeler,
 * validées, livraisons). Cette page est leur unique vue, réservée à l'ADMIN,
 * et lit l'API existante GET /orders?productCode=GUIDE_POUSSE_NATURELLE.
 */
import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, RefreshCw, Download, BookOpen } from 'lucide-react';
import { ordersApi } from '@/lib/api';

const PRODUCT_CODE = 'GUIDE_POUSSE_NATURELLE';
const PER_PAGE = 50;

interface DigitalOrder {
  id: number;
  orderReference: string;
  clientNom: string;
  clientTelephone: string;
  clientVille?: string | null;
  quantite: number;
  montant: number;
  montantPaye?: number | null;
  modePaiement?: string | null;
  referencePayment?: string | null;
  status: string;
  sourcePage?: string | null;
  createdAt: string;
}

const fmtMoney = (n: number) =>
  `${Number(n || 0).toLocaleString('fr-FR').replace(/ |,/g, ' ')} F`;

const fmtDate = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const STATUS_LABELS: Record<string, string> = {
  NOUVELLE: 'Payé',
  VALIDEE: 'Validé',
  LIVREE: 'Livré',
  ANNULEE: 'Annulé',
};
const STATUS_CLASSES: Record<string, string> = {
  NOUVELLE: 'bg-emerald-100 text-emerald-700',
  VALIDEE: 'bg-green-100 text-green-700',
  LIVREE: 'bg-teal-100 text-teal-700',
  ANNULEE: 'bg-red-100 text-red-700',
};

export default function DigitalSales() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['digital-sales', page, search],
    queryFn: () =>
      ordersApi.getAll({
        productCode: PRODUCT_CODE,
        page,
        limit: PER_PAGE,
        search: search.trim() || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const orders: DigitalOrder[] = data?.orders || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 1 };

  // Totaux (sur la page courante — pour un total global, augmenter la limite).
  const totals = useMemo(() => {
    const paid = orders.filter((o) => o.status !== 'ANNULEE');
    const ca = paid.reduce((sum, o) => sum + Number(o.montantPaye ?? o.montant ?? 0), 0);
    return { count: paid.length, ca };
  }, [orders]);

  const exportCsv = () => {
    const headers = ['Date', 'Client', 'Téléphone', 'Ville', 'Qté', 'Montant', 'Moyen', 'Statut', 'Réf. Chariow'];
    const rows = orders.map((o) => [
      fmtDate(o.createdAt),
      o.clientNom || '',
      o.clientTelephone || '',
      o.clientVille || '',
      String(o.quantite ?? 1),
      String(o.montantPaye ?? o.montant ?? 0),
      o.modePaiement || '',
      STATUS_LABELS[o.status] || o.status,
      o.referencePayment || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-ebook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-gray-900 sm:text-2xl">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              Ventes digitales — Guide Pousse Naturelle
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Achats de l'ebook payés via Chariow · hors pipeline « à appeler »/livraison
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={exportCsv}
              disabled={!orders.length}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </header>

        {/* Cartes totaux */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Ventes (total)</p>
            <p className="text-2xl font-black text-emerald-700">{pagination.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">CA (page affichée)</p>
            <p className="text-2xl font-black text-emerald-700">{fmtMoney(totals.ca)}</p>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Rechercher : nom, téléphone, réf. Chariow…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Contenu */}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erreur de chargement.{' '}
            <button onClick={() => refetch()} className="font-bold underline">Réessayer</button>
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Chargement…</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
            Aucune vente pour l'instant.
          </div>
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
                    <th className="px-3 py-3 text-right">Montant</th>
                    <th className="px-3 py-3">Paiement</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Réf. Chariow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900">{o.clientNom || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <a href={`tel:${o.clientTelephone}`} className="font-medium text-emerald-700 hover:underline">{o.clientTelephone}</a>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{o.clientVille || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-gray-900">{fmtMoney(o.montantPaye ?? o.montant)}</td>
                      <td className="px-3 py-3 text-xs text-gray-500">{o.modePaiement || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-gray-500">{o.referencePayment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="space-y-3 lg:hidden">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{o.clientNom || '—'}</p>
                      <a href={`tel:${o.clientTelephone}`} className="text-sm font-medium text-emerald-700">{o.clientTelephone}</a>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-gray-600">
                    <span>📍 {o.clientVille || '—'}</span>
                    <span className="text-right font-bold text-gray-900">{fmtMoney(o.montantPaye ?? o.montant)}</span>
                    <span className="text-gray-400">{fmtDate(o.createdAt)}</span>
                    <span className="text-right text-xs text-gray-500">{o.modePaiement || '—'}</span>
                  </div>
                  {o.referencePayment && (
                    <p className="mt-2 font-mono text-[10px] text-gray-400">Réf : {o.referencePayment}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm text-gray-500">Page {pagination.page} / {pagination.totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                  >
                    ‹ Préc.
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40"
                  >
                    Suiv. ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
