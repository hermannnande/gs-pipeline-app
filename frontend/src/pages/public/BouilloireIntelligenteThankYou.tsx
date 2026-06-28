/**
 * Page merci — Bouilloire Électrique Intelligente (slug bouilloire-intelligente).
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TEMPLATE_SLUG = 'bouilloire-intelligente';
const PRODUCT_CODE = 'BOUILLOIRE_INTELLIGENTE';
const PRICES: Record<number, number> = { 1: 7000, 2: 12000, 3: 15000 };
const META_PIXEL_ID = '1333239138939400';
const PRODUCT_NAME = 'Bouilloire \u00c9lectrique Intelligente';
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

declare global { interface Window { fbq: any; _fbq: any } }

/** Injecte le pixel Meta (base fbevents) + init + PageView. Idempotent. */
function initMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const f: any = (window.fbq = function (...args: any[]) {
    f.callMethod ? f.callMethod(...args) : f.queue.push(args);
  });
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script');
  s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function BouilloireIntelligenteThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;

  const purchaseFired = useRef(false);

  useEffect(() => { document.title = 'Merci — Bouilloire Intelligente'; }, []);

  // Pixel Meta : PageView au mount + Purchase dédupliqué (eventID = purchase_<ref>,
  // identique à l'event_id du CAPI serveur) puis CAPI via /track-purchase.
  useEffect(() => {
    if (purchaseFired.current) return;
    purchaseFired.current = true;

    initMetaPixel(META_PIXEL_ID);

    if (ref) {
      const eventId = `purchase_${ref}`;
      const fire = () => {
        try {
          window.fbq?.('track', 'Purchase', {
            content_name: PRODUCT_NAME, content_ids: [PRODUCT_CODE], content_type: 'product',
            value: orderTotal(PRICES, qty), currency: 'XOF', num_items: qty,
          }, { eventID: eventId });
        } catch { /* noop */ }
      };
      if (window.fbq) fire(); else setTimeout(fire, 700);

      axios.post(`${API_URL}/public/track-purchase`, {
        ref, slug: TEMPLATE_SLUG, company,
        pixelId: META_PIXEL_ID,
        sourceUrl: window.location.href,
      }).catch(() => {});
    }
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-amber-50/40 to-rose-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-teal-500 via-amber-400 to-rose-800 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée</h1>
          <p className="mt-1.5 text-[13px] text-teal-100">Votre bouilloire intelligente est bien enregistrée.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-amber-50 p-3 text-center ring-1 ring-amber-100">
              <p className="text-[10px] font-bold uppercase text-amber-800">Référence</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-neutral-900">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <div className="rounded-xl bg-teal-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase text-teal-700">Montant estimé</p>
            <p className="mt-0.5 text-lg font-black text-neutral-900">{fmtTotal(qty)} FCFA</p>
          </div>
          <p className="text-center text-[12px] text-neutral-600">Un conseiller vous appelle pour confirmer et organiser la livraison.</p>
          <Link to="/bouilloire-intelligente" className="block rounded-2xl bg-gradient-to-r from-teal-500 via-amber-400 to-rose-700 py-3 text-center text-[12px] font-black uppercase text-white">
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
