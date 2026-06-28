/**
 * Page de remerciement — Chaussettes chauffantes tourmaline (slug chaussette).
 * Pixel Meta : 1587475759254518
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '1587475759254518';
const TEMPLATE_SLUG = 'chaussette';
const PRODUCT_CODE = 'CHAUSSETTE_CHAUFFANTE';
const PRODUCT_NAME = 'Chaussettes chauffantes tourmaline';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

declare global { interface Window { fbq: any; _fbq: any } }

function ensureMetaPixelBase(): void {
  if (window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
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

export default function ChaussetteChauffanteThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qtyRaw = parseInt(q.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const purchaseFired = useRef(false);

  useEffect(() => {
    document.title = 'Merci pour votre commande — Chaussettes chauffantes';
  }, []);

  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;

    const sessionKey = ref ? `cch_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const value = orderTotal(PRICES, qty);

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
        console.warn('[ChaussetteChauffanteThankYou] Purchase non bloquant:', e);
      }
    };

    if (window.fbq) firePurchase();
    else setTimeout(firePurchase, 750);

    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref, slug: TEMPLATE_SLUG, company,
        sourceUrl: window.location.href, fbc, fbp,
      }).catch(() => {});
    }
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-white to-orange-50 px-4 py-10" style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-[0_20px_60px_-12px_rgba(245,158,11,.35)]">
          <div className="bg-gradient-to-br from-orange-700 via-amber-600 to-yellow-500 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,.5)]">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h1 className="text-xl font-extrabold">Commande envoyée</h1>
            <p className="mt-1.5 text-[13px] text-amber-100">
              Vos chaussettes chauffantes tourmaline sont bien enregistrées.
            </p>
          </div>

          <div className="space-y-4 p-5">
            {ref && (
              <div className="rounded-xl bg-amber-50 p-3.5 text-center ring-1 ring-amber-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Référence</p>
                <p className="mt-0.5 break-all font-mono text-sm font-bold text-orange-900">{ref.slice(0, 12).toUpperCase()}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-[12px] font-bold text-emerald-800">Un conseiller vous appelle</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700">Pour confirmer votre commande et organiser la livraison.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <span className="text-lg">🚚</span>
                <div>
                  <p className="text-[12px] font-bold text-amber-900">Livraison rapide</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">Paiement à la livraison · Abidjan 24h</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <a href="https://wa.me/2250700000000" target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded-full bg-[#25D366] px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-white transition hover:brightness-105">
                WhatsApp
              </a>
              <Link to="/chaussette"
                className="flex-1 rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-center text-[12px] font-black uppercase tracking-wider text-amber-800 transition hover:bg-amber-100">
                Retour au produit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
