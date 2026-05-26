/**
 * Page de remerciement dediee a /creme-anti-cerne
 * Pixel Meta campagne : 950944984510412
 *   - PageView au mount
 *   - Purchase avec eventID = `purchase_<ref>` (deduplication CAPI server-side)
 *   - sessionStorage `cac_purchase_<ref>` pour eviter le re-fire au refresh
 *   - track-purchase backend pour le matching avec _fbc/_fbp si dispo
 *
 * Palette : blanc + rouge premium (coherente avec la landing).
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '950944984510412';
const TEMPLATE_SLUG = 'creme-anti-cerne';
const PRODUCT_CODE = 'CREME_ANTI_CERNE';
const PRODUCT_NAME = 'Creme Contour des Yeux Anti-Cernes';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };

declare global { interface Window { fbq: any; _fbq: any } }

function ensureMetaPixelBase(): void {
  if (window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  };
  if (!window._fbq) window._fbq = f;
  f.push = f;
  f.loaded = true;
  f.version = '2.0';
  f.queue = [];
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
}

function initPixelForPage(pixelId: string): void {
  if (!pixelId) return;
  ensureMetaPixelBase();
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function CremeAntiCerneThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qtyRaw = parseInt(q.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const purchaseFired = useRef(false);

  useEffect(() => {
    document.title = "Merci pour votre commande — Crème anti-cernes";
  }, []);

  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;

    const sessionKey = ref ? `cac_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const value = PRICES[qty] || PRICES[1];

    const firePurchase = () => {
      try {
        initPixelForPage(META_PIXEL_ID);
        window.fbq?.('track', 'Purchase', {
          content_name: PRODUCT_NAME,
          content_ids: [PRODUCT_CODE],
          content_type: 'product',
          value,
          currency: 'XOF',
          num_items: qty,
        }, { eventID: eventId });
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (e) {
        console.warn('[CremeAntiCerneThankYou] Purchase non bloquant:', e);
      }
    };

    if (window.fbq) firePurchase();
    else setTimeout(firePurchase, 750);

    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref,
        slug: TEMPLATE_SLUG,
        company,
        sourceUrl: window.location.href,
        fbc,
        fbp,
      }).catch(() => {});
    }
  }, [ref, company, qty]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-rose-50 via-white to-stone-50 antialiased" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      {/* Top strip */}
      <div className="bg-gradient-to-r from-neutral-950 via-rose-950 to-neutral-950 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-rose-300">Commande confirmée</span>
        <span className="mx-2 opacity-50">·</span>
        <span>GS · Côte d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-rose-200/45 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full bg-stone-200/40 blur-[120px]" />

        <div className="relative mx-auto w-full max-w-[640px]">
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(244,63,94,.30)] ring-1 ring-rose-100 sm:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-700" />

            {/* Pastille check */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 shadow-[0_15px_40px_-10px_rgba(244,63,94,.6)]">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Titre */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.32em] text-rose-700 ring-1 ring-rose-200">
                Commande confirmée
              </span>
              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-[38px]">
                Merci pour votre <span className="bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 bg-clip-text text-transparent">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-700 sm:text-[15px]">
                Votre <strong className="font-bold text-neutral-950">{PRODUCT_NAME}</strong> est en cours de préparation. Un conseiller vous appelle <strong className="font-bold text-neutral-950">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            {/* Recap commande */}
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-neutral-950 via-rose-950 to-neutral-900 p-4 text-white ring-1 ring-rose-300/30">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-300">Quantité</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{qty} crème{qty > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-300">Total</p>
                  <p className="mt-1 text-[18px] font-black tabular-nums text-rose-300">
                    {(PRICES[qty] || PRICES[1]).toLocaleString('fr-FR').replace(/,/g, ' ')} F
                  </p>
                </div>
              </div>
              {ref && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]">
                  <span className="font-black uppercase tracking-[0.25em] text-rose-300/80">N° commande</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">{ref.slice(0, 12).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Étapes suivantes */}
            <div className="mt-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-700">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  { n: '1', t: 'Confirmation par téléphone', d: 'Un conseiller vous rappelle dans les 30 minutes pour valider votre adresse.' },
                  { n: '2', t: 'Livraison rapide', d: 'Votre colis arrive sous 24-48 h partout en Côte d\'Ivoire.' },
                  { n: '3', t: 'Paiement à la livraison', d: 'Vous payez uniquement à la réception du colis. Aucun risque.' },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3 rounded-xl bg-rose-50/60 p-3 ring-1 ring-rose-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-[13px] font-black text-white shadow-[0_5px_15px_-3px_rgba(244,63,94,.5)]">
                      {s.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-[13px] font-black text-neutral-950">{s.t}</p>
                      <p className="mt-0.5 text-[12px] text-neutral-700">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px]">
              {[
                { ico: '🔒', t: 'Sécurisée' },
                { ico: '🚚', t: 'Livraison rapide' },
                { ico: '💵', t: 'Paiement livraison' },
              ].map((b) => (
                <div key={b.t} className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-50/70 px-2 py-1.5 font-bold text-rose-700 ring-1 ring-rose-200">
                  <span>{b.ico}</span>
                  <span>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA retour */}
            <div className="mt-6 text-center">
              <Link
                to={`/creme-anti-cerne?company=${encodeURIComponent(company)}`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_25px_-5px_rgba(244,63,94,.55)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_-5px_rgba(244,63,94,.75)]"
              >
                Retour au produit
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-rose-700/70">
            GS · Solutions premium pour le bien-être · Côte d'Ivoire
          </p>
        </div>
      </main>
    </div>
  );
}
