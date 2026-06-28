/**
 * Page merci — Bande sport minceur (slug bande-sport-minceur).
 * Pixel Meta : 1587475759254518
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal, packAmount } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '1587475759254518';
const SLUG = 'bande-sport-minceur';
const PRODUCT_CODE = 'BANDE_SPORT_MINCEUR';
const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };
const fmtTotal = (qty: number) => orderTotal(PRICES, qty).toLocaleString('fr-FR').replace(/\u202f|,/g, ' ');

declare global { interface Window { fbq: any; _fbq: any } }

export default function BandeSportMinceurThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || ''; const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;
  const fired = useRef(false);

  useEffect(() => { document.title = 'Merci — Bande sport minceur'; }, []);

  useEffect(() => {
    if (fired.current) return; fired.current = true;
    const sk = ref ? `bsm_purchase_${ref}` : '';
    if (sk && sessionStorage.getItem(sk)) return;
    const init = () => {
      if (!window.fbq) {
        const f: any = window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); };
        f.queue = []; f.loaded = true; f.version = '2.0';
        const s = document.createElement('script'); s.src = 'https://connect.facebook.net/en_US/fbevents.js'; s.async = true; document.head.appendChild(s);
      }
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'Purchase', { content_name: 'Bande sport minceur', content_ids: [PRODUCT_CODE], value: orderTotal(PRICES, qty), currency: 'XOF', num_items: qty });
      if (sk) sessionStorage.setItem(sk, '1');
    };
    setTimeout(init, 500);
    if (ref) axios.post(`${API_URL}/public/track-purchase`, { ref, slug: SLUG, company, sourceUrl: window.location.href }).catch(() => {});
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-emerald-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-cyan-700 via-sky-600 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée</h1>
          <p className="mt-1.5 text-[13px] text-cyan-100">Votre bande sport minceur est bien enregistrée.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && <div className="rounded-xl bg-sky-50 p-3 text-center"><p className="text-[10px] font-bold uppercase text-cyan-600">Référence</p><p className="font-mono text-sm font-bold">{ref.slice(0, 12).toUpperCase()}</p></div>}
          <p className="text-center text-[12px] text-neutral-600">Un conseiller vous appelle pour confirmer avant livraison.</p>
          <Link to="/bande-sport-minceur" className="block rounded-full bg-cyan-600 py-3 text-center text-[12px] font-black uppercase text-white">Retour au produit</Link>
        </div>
      </div>
    </div>
  );
}
