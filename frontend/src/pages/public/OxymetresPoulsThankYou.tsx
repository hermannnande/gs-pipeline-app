/**
 * Page merci — Oxymètre de Pouls Digital (slug oxymetre-pouls).
 * Pixel Meta : constante vide (le client la fournira) — tracking Purchase conditionné.
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (event: Purchase conditionné)
const SLUG = 'oxymetre-pouls';
const PRODUCT_CODE = 'OXYMETRE_POULS';
const PRICES: Record<number, number> = { 1: 8500, 2: 15900, 3: 22900 };

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

export default function OxymetresPoulsThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || ''; const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;
  const fired = useRef(false);

  useEffect(() => { document.title = 'Merci — Oxymètre de Pouls Digital'; }, []);

  useEffect(() => {
    if (fired.current) return; fired.current = true;
    const sk = ref ? `ox_purchase_${ref}` : '';
    if (sk && sessionStorage.getItem(sk)) return;
    if (META_PIXEL_ID) {
      const init = () => {
        if (!window.fbq) {
          const f: any = window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); };
          f.queue = []; f.loaded = true; f.version = '2.0';
          const s = document.createElement('script'); s.src = 'https://connect.facebook.net/en_US/fbevents.js'; s.async = true; document.head.appendChild(s);
        }
        window.fbq('init', META_PIXEL_ID);
        window.fbq('track', 'Purchase', { content_name: 'Oxymètre de Pouls Digital', content_ids: [PRODUCT_CODE], value: orderTotal(PRICES, qty), currency: 'XOF', num_items: qty });
        if (sk) sessionStorage.setItem(sk, '1');
      };
      setTimeout(init, 500);
    }
    if (ref) axios.post(`${API_URL}/public/track-purchase`, { ref, slug: SLUG, company, sourceUrl: window.location.href }).catch(() => {});
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#EFF6FF] via-[#ECFEFF] to-[#ECFDF5] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#93C5FD]/40 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-[#1D4ED8] via-[#06B6D4] to-[#10B981] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl ring-2 ring-white/40">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée 🎉</h1>
          <p className="mt-1.5 text-[13px] text-white/85">Votre oxymètre de pouls digital est bien enregistré.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-[#EFF6FF] p-3 text-center ring-1 ring-[#93C5FD]/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1D4ED8]">Référence de votre commande</p>
              <p className="font-mono text-sm font-bold text-[#0B1E4B]">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <div className="space-y-2.5 rounded-2xl bg-[#ECFEFF] p-4 text-[12.5px] text-[#1D4ED8]">
            <div className="flex items-center gap-3"><span className="text-xl">📞</span><span>Un conseiller vous appelle <strong>sous 30 min</strong> pour confirmer votre commande et votre adresse.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">🚚</span><span>Livraison rapide : Abidjan 24-48 h, intérieur 48-72 h.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">💵</span><span><strong>Paiement uniquement à la livraison</strong> — rien à payer en ligne.</span></div>
          </div>
          <p className="text-center text-[12px] text-neutral-500">
            Gardez votre téléphone à portée de main : sans confirmation, le colis ne peut pas être expédié.
          </p>
          <Link to="/oxymetre-pouls" className="block rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#06B6D4] to-[#EF4444] py-3.5 text-center text-[12px] font-black uppercase tracking-[0.12em] text-white shadow-lg transition hover:brightness-110">
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
