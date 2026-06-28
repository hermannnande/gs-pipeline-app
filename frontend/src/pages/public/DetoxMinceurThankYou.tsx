/**
 * Page de remerciement — Pack Détox Minceur (slug detoxminceur).
 * Pixel Meta : 2067584707359831
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '2067584707359831';
const TEMPLATE_SLUG = 'detoxminceur';
const PRODUCT_CODE = 'PATCH_DETOX_MINCEUR';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

declare global { interface Window { fbq: any; _fbq: any } }

function initPixel(id: string) {
  if (!id || window.fbq) return;
  const f: any = window.fbq = function (...args: any[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args); };
  if (!window._fbq) window._fbq = f;
  f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
  const s = document.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}

export default function DetoxMinceurThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || '';
  const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;
  const fired = useRef(false);

  useEffect(() => { document.title = 'Merci — Pack Détox Minceur'; }, []);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const sk = ref ? `dxm_purchase_${ref}` : '';
    if (sk && sessionStorage.getItem(sk)) return;
    const eventId = ref ? `purchase_${ref}` : `purchase_${Date.now()}`;
    const fire = () => {
      initPixel(META_PIXEL_ID);
      window.fbq?.('track', 'Purchase', {
        content_name: 'Pack Détox Minceur', content_ids: [PRODUCT_CODE], content_type: 'product',
        value: orderTotal(PRICES, qty) || PRICES[1], currency: 'XOF', num_items: qty,
      }, { eventID: eventId });
      if (sk) sessionStorage.setItem(sk, '1');
    };
    window.fbq ? fire() : setTimeout(fire, 750);
    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref, slug: TEMPLATE_SLUG, company,
        sourceUrl: window.location.href, fbc, fbp,
        pixelId: META_PIXEL_ID,
      }).catch(() => {});
    }
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-lime-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée</h1>
          <p className="mt-1.5 text-[13px] text-emerald-100">Votre pack détox minceur est bien enregistré.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Référence</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-emerald-900">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <p className="text-center text-[12px] text-neutral-600">Un conseiller vous appelle pour confirmer et organiser la livraison.</p>
          <Link to="/detoxminceur" className="block rounded-full bg-emerald-600 py-3 text-center text-[12px] font-black uppercase text-white">Retour au produit</Link>
        </div>
      </div>
    </div>
  );
}
