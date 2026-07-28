/**
 * Page merci — Bandes Buccales pour le Sommeil (slug bandes-buccales-sommeil).
 * Theme NUIT cohérent avec la landing. Pixel Meta : constante vide (le client
 * la fournira) — tracking Purchase conditionné.
 */
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { orderTotal } from '../../utils/pricingHelpers';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = ''; // Pixel Meta : le client le fournira plus tard (event: Purchase conditionné)
const SLUG = 'bandes-buccales-sommeil';
const PRODUCT_CODE = 'BANDES_BUCCALES_SOMMEIL';
const PRICES: Record<number, number> = { 1: 9900, 2: 18900, 3: 26900 };

declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any } }

export default function BandesBuccalesSommeilThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const ref = q.get('ref') || ''; const company = q.get('company') || 'ci';
  const qty = [1, 2, 3].includes(parseInt(q.get('qty') || '1', 10)) ? parseInt(q.get('qty') || '1', 10) : 1;
  const fired = useRef(false);

  useEffect(() => { document.title = 'Merci — Bandes Buccales pour le Sommeil'; }, []);

  useEffect(() => {
    if (fired.current) return; fired.current = true;
    const sk = ref ? `bb_purchase_${ref}` : '';
    if (sk && sessionStorage.getItem(sk)) return;
    if (META_PIXEL_ID) {
      const init = () => {
        if (!window.fbq) {
          const f: any = window.fbq = function (...a: any[]) { f.callMethod ? f.callMethod(...a) : f.queue.push(a); };
          f.queue = []; f.loaded = true; f.version = '2.0';
          const s = document.createElement('script'); s.src = 'https://connect.facebook.net/en_US/fbevents.js'; s.async = true; document.head.appendChild(s);
        }
        window.fbq('init', META_PIXEL_ID);
        window.fbq('track', 'Purchase', { content_name: 'Bandes Buccales pour le Sommeil (paquet de 30)', content_ids: [PRODUCT_CODE], value: orderTotal(PRICES, qty), currency: 'XOF', num_items: qty });
        if (sk) sessionStorage.setItem(sk, '1');
      };
      setTimeout(init, 500);
    }
    if (ref) axios.post(`${API_URL}/public/track-purchase`, { ref, slug: SLUG, company, sourceUrl: window.location.href }).catch(() => {});
  }, [ref, company, qty]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0A0A0F] via-[#111118] to-[#0A0A0F] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md">
        <div className="bg-gradient-to-br from-[#B45309] via-[#D97706] to-[#F59E0B] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl ring-2 ring-white/40">✓</div>
          <h1 className="text-xl font-extrabold">Commande envoyée 🌙</h1>
          <p className="mt-1.5 text-[13px] text-white/85">Vos bandes buccales pour le sommeil sont bien enregistrées.</p>
        </div>
        <div className="space-y-4 p-5">
          {ref && (
            <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/15">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FCD34D]">Référence de votre commande</p>
              <p className="font-mono text-sm font-bold text-white">{ref.slice(0, 12).toUpperCase()}</p>
            </div>
          )}
          <div className="space-y-2.5 rounded-2xl bg-white/5 p-4 text-[12.5px] text-white/80 ring-1 ring-white/10">
            <div className="flex items-center gap-3"><span className="text-xl">📞</span><span>Un conseiller vous appelle <strong>sous 30 min</strong> pour confirmer votre commande et votre adresse.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">🚚</span><span>Livraison rapide à Abidjan et dans les principales villes.</span></div>
            <div className="flex items-center gap-3"><span className="text-xl">💵</span><span><strong>Paiement uniquement à la livraison</strong> — rien à payer en ligne.</span></div>
          </div>
          <p className="text-center text-[12px] text-white/50">
            Gardez votre téléphone à portée de main : sans confirmation, le paquet ne peut pas être expédié.
          </p>
          <Link to="/bandes-buccales-sommeil" className="block rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FCD34D] to-[#F59E0B] py-3.5 text-center text-[12px] font-black uppercase tracking-[0.12em] text-[#1A1207] shadow-lg transition hover:brightness-110">
            Retour au produit
          </Link>
        </div>
      </div>
    </div>
  );
}
