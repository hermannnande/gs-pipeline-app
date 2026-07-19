/**
 * Page de remerciement dediee a /promo-verrue (page PROMO SMS/WhatsApp).
 * AUCUN pixel Meta (trafic SMS uniquement) — on notifie juste le backend pour le suivi.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TEMPLATE_SLUG = 'promo-verrue';

export default function CremeAntiVerrueBleuPromoThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';

  useEffect(() => {
    document.title = 'Merci pour votre commande — Crème anti-verrues';
  }, []);

  useEffect(() => {
    if (!ref) return;
    axios.post(`${API_URL}/public/track-purchase`, {
      ref,
      slug: TEMPLATE_SLUG,
      company,
      pixelIds: [],
      sourceUrl: window.location.href,
    }).catch(() => {});
  }, [ref, company]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-white to-blue-50 px-4 py-10" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_20px_60px_-12px_rgba(37,99,235,.25)]">
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,.5)]">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h1 className="text-xl font-extrabold">Commande envoyee</h1>
            <p className="mt-1.5 text-[13px] text-sky-200">
              Votre commande de la creme anti-verrue est bien enregistree.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {ref && (
              <div className="rounded-xl bg-sky-50 p-3.5 text-center ring-1 ring-sky-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Reference</p>
                <p className="mt-0.5 break-all font-mono text-sm font-bold text-blue-900">{ref.slice(0, 12).toUpperCase()}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <div>
                  <p className="text-[13px] font-bold text-emerald-800">Nous vous appelons tres vite</p>
                  <p className="text-[11px] text-emerald-600">Pour confirmer et organiser la livraison.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <div>
                  <p className="text-[13px] font-bold text-amber-800">Paiement a la livraison</p>
                  <p className="text-[11px] text-amber-600">Payez uniquement a la reception du colis.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={`/promo-verrue?company=${encodeURIComponent(company)}`}
                className="flex flex-1 items-center justify-center rounded-xl border-2 border-sky-200 px-4 py-3 text-[13px] font-bold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50"
              >
                Retour au produit
              </Link>
              <a
                href={`/commander?company=${encodeURIComponent(company)}`}
                className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-blue-900 to-sky-700 px-4 py-3 text-[13px] font-bold text-white shadow-md transition hover:from-blue-950 hover:to-sky-800"
              >
                Voir tous les produits
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-sky-400">
          Merci pour votre confiance. Support client disponible 7j/7.
        </p>
      </div>
    </div>
  );
}
