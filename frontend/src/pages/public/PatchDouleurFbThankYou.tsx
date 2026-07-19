/**
 * Page de remerciement dediee a la campagne Facebook ads patchdouleurfb.
 *
 * Pixels Meta (double tracking) :
 *   - 2838942643120213 (campagne)
 *   - 1024740423446417 (historique FB)
 *
 * Purchase browser + CAPI dedup (eventID = ref).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const META_PIXEL_ID = '1024740423446417';
const META_PIXEL_ID_2 = '2838942643120213';
const META_PIXEL_IDS = [META_PIXEL_ID_2, META_PIXEL_ID];
const TEMPLATE_SLUG = 'patchdouleurfb';

const PRICES: Record<number, number> = { 1: 9900, 2: 16900, 3: 24900 };

const PRODUCT_CODE = 'PATCH_DOULEUR_FB';
const CONTENT_NAME = 'Patch Anti-Douleur Chauffant FB';

declare global {
  interface Window { fbq?: (...args: any[]) => void; _fbq?: any }
}

const initedMetaPixels = new Set<string>();

function ensureFbqBase(): void {
  if (window.fbq) return;
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
}

function initMetaPixels(pixelIds: string[]): void {
  const ids = [...new Set(pixelIds.filter(Boolean))];
  if (!ids.length) return;
  ensureFbqBase();
  let added = false;
  for (const id of ids) {
    if (initedMetaPixels.has(id)) continue;
    window.fbq?.('init', id);
    initedMetaPixels.add(id);
    added = true;
  }
  if (added) {
    for (const id of ids) {
      window.fbq?.('trackSingle', id, 'PageView');
    }
  }
}

function firePurchaseOnPixels(pixelIds: string[], payload: Record<string, unknown>, opts: { eventID: string }) {
  for (const pixelId of pixelIds) {
    window.fbq?.('trackSingle', pixelId, 'Purchase', payload, opts);
  }
}

export default function PatchDouleurFbThankYou() {
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const company = params.get('company') || 'ci';
  const qtyRaw = parseInt(params.get('qty') || '1', 10);
  const qty = [1, 2, 3].includes(qtyRaw) ? qtyRaw : 1;
  const value = PRICES[qty] || PRICES[1];
  const purchaseFired = useRef(false);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Merci pour votre commande — Ob\'rille';
  }, []);

  useEffect(() => {
    if (purchaseFired.current) return;

    const sessionKey = ref ? `pd_fb_purchase_${ref}` : '';
    if (sessionKey && sessionStorage.getItem(sessionKey)) return;

    purchaseFired.current = true;

    const eventId = ref || `purchase_${Date.now()}`;
    const purchasePayload = {
      content_name: CONTENT_NAME,
      content_ids: [PRODUCT_CODE],
      content_type: 'product',
      value,
      currency: 'XOF',
      num_items: qty,
      contents: [{ id: PRODUCT_CODE, quantity: qty }],
      order_id: ref || undefined,
    };
    const purchaseOpts = { eventID: eventId };

    const fire = () => {
      try {
        initMetaPixels(META_PIXEL_IDS);
        firePurchaseOnPixels(META_PIXEL_IDS, purchasePayload, purchaseOpts);
        if (sessionKey) sessionStorage.setItem(sessionKey, '1');
      } catch (err) {
        console.warn('[PatchDouleurFbThankYou] Purchase non bloquant:', err);
      }
    };

    if (window.fbq) fire();
    else setTimeout(fire, 800);

    if (ref) {
      const fbc = document.cookie.split('; ').find(c => c.startsWith('_fbc='))?.split('=')[1] || null;
      const fbp = document.cookie.split('; ').find(c => c.startsWith('_fbp='))?.split('=')[1] || null;
      axios.post(`${API_URL}/public/track-purchase`, {
        ref,
        slug: TEMPLATE_SLUG,
        company,
        pixelIds: META_PIXEL_IDS,
        sourceUrl: window.location.href,
        fbc,
        fbp,
      }).catch(() => {});
    }

    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [ref, company, qty, value]);

  return (
    <div className="pdfb-tx-root min-h-screen overflow-x-hidden bg-[#fafaf9] text-[#0a1628] antialiased">

      {/* Top strip */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0c1e2e] to-[#0a1628] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white sm:text-[11px]">
        <span className="text-cyan-300">Commande confirmee</span>
        <span className="mx-2 opacity-50">·</span>
        <span>Ob'rille · Cote d'Ivoire</span>
      </div>

      <main className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        {/* Halos lumineux fond */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-300/30 blur-[120px]"/>
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-200/30 blur-[120px]"/>

        <div className="relative mx-auto w-full max-w-[640px]">

          {/* Card centrale */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-200/60 sm:p-10">

            {/* Glow accent en haut */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400"/>

            {/* Pastille check */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.6)]">
              <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-800 ring-1 ring-emerald-200">
                Commande confirmee
              </span>
              <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-tight text-[#0a1628] sm:text-[38px]">
                Merci pour votre <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-600 bg-clip-text text-transparent">commande</span> !
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
                Votre <strong className="font-bold text-[#0a1628]">{CONTENT_NAME}</strong> est enregistre. Notre equipe vous appelle{' '}
                <strong className="font-bold text-[#0a1628]">sous 30 minutes</strong> pour confirmer la livraison.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#0c1e2e] to-[#0a1628] p-4 text-white ring-1 ring-cyan-300/25">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300/80">Reference</p>
                  <p className="mt-0.5 font-black text-white">{ref || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300/80">Montant</p>
                  <p className="mt-0.5 font-black text-emerald-300">{value.toLocaleString('fr-FR').replace(/\u202f|,/g, ' ')} FCFA</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300/80">Quantite</p>
                  <p className="mt-0.5 font-black">{qty} boite{qty > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-300/80">Paiement</p>
                  <p className="mt-0.5 font-black text-emerald-300">A la livraison</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-[13px] text-slate-600">
              <div className="flex items-start gap-3 rounded-xl bg-cyan-50/60 p-3 ring-1 ring-cyan-100">
                <span className="text-lg">📞</span>
                <p>Gardez votre telephone allume — nous vous appelons tres vite pour valider l&apos;adresse.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
                <span className="text-lg">🚚</span>
                <p>Livraison rapide partout en Cote d&apos;Ivoire. Paiement uniquement a la reception.</p>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>

            <div className="mt-6 text-center">
              <Link
                to="/patchdouleurfb"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-600 px-8 py-3.5 text-[14px] font-black text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
              >
                Retour a la page produit
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
